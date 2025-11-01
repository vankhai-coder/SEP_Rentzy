// controllers/booking/bookingCancelController.js
import db from "../../models/index.js";
import { calculateCancellationFeeLogic } from "../../utils/cancellationUtils.js";

const {
  Booking,
  Vehicle,
  BookingCancellation,
  User,
  Transaction,
  Notification,
} = db;

// API tính phí hủy booking
export const calculateCancellationFee = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user?.userId;

    console.log("=== Calculate Cancellation Fee Debug ===");
    console.log("Booking ID:", bookingId);
    console.log("Renter ID:", renterId);
    console.log("User object:", req.user);

    // Kiểm tra authentication
    if (!renterId) {
      console.log("ERROR: No renter ID found in request");
      return res.status(401).json({
        success: false,
        message: "Không có quyền truy cập. Vui lòng đăng nhập lại.",
      });
    }

    // Tìm booking
    console.log("Searching for booking with conditions:", {
      booking_id: bookingId,
      renter_id: renterId,
    });

    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId,
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["model", "license_plate"],
        },
      ],
    });

    console.log(
      "Booking found:",
      booking
        ? {
            id: booking.booking_id,
            status: booking.status,
            renter_id: booking.renter_id,
            vehicle: booking.vehicle?.model,
          }
        : null
    );

    if (!booking) {
      console.log("ERROR: Booking not found");
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê này.",
      });
    }

    // Kiểm tra trạng thái booking có thể hủy
    const cancellableStatuses = ["pending", "deposit_paid", "fully_paid"];
    console.log("Checking booking status:", booking.status);
    console.log("Cancellable statuses:", cancellableStatuses);

    if (!cancellableStatuses.includes(booking.status)) {
      console.log("ERROR: Booking status not cancellable:", booking.status);
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn thuê này do trạng thái hiện tại.",
      });
    }

    // Tính toán phí hủy sử dụng hàm chung
    const now = new Date();
    const bookingData = booking.toJSON();
    const calculation = calculateCancellationFeeLogic(bookingData, now);

    // Kiểm tra nếu đã bắt đầu chuyến đi
    if (calculation.daysToStart < 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn thuê đã bắt đầu.",
      });
    }

    const cancellationFee = calculation.cancellationFee;
    const refundAmount = calculation.refundAmount;
    const platformFee = calculation.platformFee;
    const ownerRefund = calculation.ownerRefund;
    const cancellationFeePercent = calculation.cancellationFeePercent;
    const totalPaid = calculation.totalPaid;
    const actualRefundPercent = totalPaid > 0 ? Math.round((refundAmount / totalPaid) * 100) : 100;

    // Tạo breakdown chi tiết
    const feeBreakdown = {
      percentage_fee: {
        percent: cancellationFeePercent,
        amount: cancellationFee,
        applied_to: "Tổng giá trị hóa đơn",
      },
      processing_fee: 0,
      total_fee: cancellationFee,
      platform_fee: platformFee,
      owner_refund: ownerRefund,
    };

    res.status(200).json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        booking_status: booking.status,
        total_amount: booking.total_amount, // Tổng giá trị đơn hàng
        total_paid: totalPaid,
        cancellation_fee_breakdown: feeBreakdown,
        cancellation_fee: cancellationFee,
        platform_fee: platformFee,
        owner_refund: ownerRefund,
        refund_amount: refundAmount,
        cancellation_fee_percent: cancellationFeePercent,
        fee_description: calculation.feeDescription,
        timing_info: {
          hours_from_creation: Math.round(calculation.hoursFromCreation * 10) / 10,
          days_to_start: Math.round(calculation.daysToStart * 10) / 10,
        },
        start_date: booking.start_date,
        end_date: booking.end_date,
        created_at: booking.created_at,
      },
    });
  } catch (error) {
    console.error("Error calculating cancellation fee:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tính phí hủy",
      error: error.message,
    });
  }
};

// API xác nhận hủy booking
export const confirmCancellation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { bookingId } = req.params;
    const renterId = req.user.userId;
    console.log("huỷ booking gọi api");
    // Tìm booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId,
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["model", "license_plate", "owner_id"],
        },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê này.",
      });
    }

    // Kiểm tra trạng thái booking có thể hủy
    const cancellableStatuses = ["pending", "deposit_paid", "fully_paid"];
    if (!cancellableStatuses.includes(booking.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn thuê này do trạng thái hiện tại.",
      });
    }

    // Tính toán phí hủy sử dụng hàm chung
    const now = new Date();
    const bookingData = booking.toJSON();
    const calculation = calculateCancellationFeeLogic(bookingData, now);
    
    // Kiểm tra nếu đã bắt đầu chuyến đi
    if (calculation.daysToStart < 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn thuê đã bắt đầu.",
      });
    }

    const cancellationFee = calculation.cancellationFee;
    const refundAmount = calculation.refundAmount;
    const platformFee = calculation.platformFee;
    const ownerRefund = calculation.ownerRefund;
    const cancellationFeePercent = calculation.cancellationFeePercent;

    // Cập nhật trạng thái booking thành "cancel_requested" - chờ owner duyệt
    await booking.update(
      {
        status: "cancel_requested",
        updated_at: now,
      },
      { transaction }
    );

    // Tạo BookingCancellation ngay khi renter yêu cầu hủy với trạng thái hoàn tiền là "none"
    const cancellationData = {
      booking_id: booking.booking_id,
      cancellation_reason: (req.body && req.body.reason) || "Người thuê yêu cầu hủy booking",
      cancel_requested_at: now,
      cancellation_fee: cancellationFee,
      cancelled_by: "renter",
      owner_approved_cancel_at: null,
      cancelled_at: null,
      total_refund_for_renter: refundAmount,
      refund_status_renter: "none", // Trạng thái hoàn tiền ban đầu là none
      refund_reason_renter: "Hoàn tiền do hủy booking",
      refund_processed_at_renter: null,
      total_refund_for_owner: ownerRefund,
      refund_status_owner: ownerRefund > 0 ? "none" : "none", // Trạng thái hoàn tiền ban đầu là none
      refund_processed_at_owner: null,
      created_at: now,
      updated_at: now,
    };

    console.log("Creating BookingCancellation with initial data:", cancellationData);
    
    const newBookingCancellation = await BookingCancellation.create(cancellationData, { transaction });
    
    console.log("BookingCancellation created successfully:", newBookingCancellation.cancellation_id);

    // Tạo thông báo cho owner để duyệt yêu cầu hủy
    if (booking.vehicle.owner_id) {
      await Notification.create(
        {
          user_id: booking.vehicle.owner_id,
          title: "Yêu cầu hủy booking mới",
          content: `Người thuê đã yêu cầu hủy booking #${booking.booking_id} cho xe ${booking.vehicle.model}. Phí hủy dự kiến: ${cancellationFeePercent}%. Vui lòng vào dashboard để duyệt hoặc từ chối.`,
          type: "rental",
          is_read: false,
        },
        { transaction }
      );
    }

    // Tạo thông báo cho renter
    await Notification.create(
      {
        user_id: renterId,
        title: "Yêu cầu hủy booking đã được gửi",
        content: `Yêu cầu hủy booking #${booking.booking_id} đã được gửi đến chủ xe. Vui lòng chờ chủ xe duyệt.`,
        type: "rental",
        is_read: false,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Yêu cầu hủy booking đã được gửi đến chủ xe. Vui lòng chờ chủ xe duyệt.",
      data: {
        booking_id: booking.booking_id,
        status: "cancel_requested",
        total_paid: calculation.totalPaid,
        estimated_cancellation_fee: cancellationFee,
        estimated_platform_fee: platformFee,
        estimated_refund_amount: refundAmount,
        estimated_owner_refund: ownerRefund,
        cancellation_reason: (req.body && req.body.reason) || "Người thuê yêu cầu hủy booking",
        cancel_requested_at: now,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error confirming cancellation:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy booking",
      error: error.message,
    });
  }
};
