import db from "../../models/index.js";
import { Op } from "sequelize";

const {
  Booking,
  BookingCancellation,
  User,
  Vehicle,
  Notification,
} = db;

// GET /api/admin/refund-requests - Lấy danh sách yêu cầu hoàn tiền
export const getRefundRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "pending" } = req.query;
    const offset = (page - 1) * limit;

    // Tìm các BookingCancellation có trạng thái hoàn tiền pending
    const whereCondition = {
      [Op.or]: [
        { refund_status_renter: status },
        { refund_status_owner: status },
      ],
    };

    const { count, rows: refundRequests } = await BookingCancellation.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: ["user_id", "full_name", "email", "phone_number"],
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedRequests = refundRequests.map((cancellation) => ({
      cancellation_id: cancellation.cancellation_id,
      booking_id: cancellation.booking_id,
      cancellation_reason: cancellation.cancellation_reason,
      cancelled_by: cancellation.cancelled_by,
      cancelled_at: cancellation.cancelled_at,
      
      // Thông tin booking
      booking_info: {
        start_date: cancellation.booking.start_date,
        end_date: cancellation.booking.end_date,
        total_amount: cancellation.booking.total_amount,
        total_paid: cancellation.booking.total_paid,
      },

      // Thông tin xe và chủ xe
      vehicle_info: {
        model: cancellation.booking.vehicle.model,
        license_plate: cancellation.booking.vehicle.license_plate,
        owner: {
          user_id: cancellation.booking.vehicle.owner.user_id,
          full_name: cancellation.booking.vehicle.owner.full_name,
          email: cancellation.booking.vehicle.owner.email,
        },
      },

      // Thông tin người thuê
      renter_info: {
        user_id: cancellation.booking.renter.user_id,
        full_name: cancellation.booking.renter.full_name,
        email: cancellation.booking.renter.email,
      },

      // Thông tin hoàn tiền
      refund_info: {
        cancellation_fee: cancellation.cancellation_fee,
        renter: {
          amount: cancellation.total_refund_for_renter,
          status: cancellation.refund_status_renter,
          reason: cancellation.refund_reason_renter,
        },
        owner: {
          amount: cancellation.total_refund_for_owner,
          status: cancellation.refund_status_owner,
        },
        platform_fee: cancellation.cancellation_fee * 0.1, // 10% cho platform
      },

      created_at: cancellation.created_at,
      updated_at: cancellation.updated_at,
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        refund_requests: formattedRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
        summary: {
          total_pending_refunds: count,
          total_renter_refund_amount: formattedRequests.reduce(
            (sum, item) => sum + (item.refund_info.renter.status === "pending" ? item.refund_info.renter.amount : 0),
            0
          ),
          total_owner_refund_amount: formattedRequests.reduce(
            (sum, item) => sum + (item.refund_info.owner.status === "pending" ? item.refund_info.owner.amount : 0),
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error getting refund requests:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách yêu cầu hoàn tiền",
      error: error.message,
    });
  }
};

// PATCH /api/admin/refund-requests/:id/approve - Duyệt hoàn tiền
export const approveRefund = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { refund_type } = req.body; // "renter" hoặc "owner" hoặc "both"

    console.log("=== APPROVE REFUND DEBUG ===");
    console.log("Request params:", { id, refund_type });

    // Tìm BookingCancellation
    const cancellation = await BookingCancellation.findOne({
      where: { cancellation_id: id },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: ["user_id", "full_name", "email"],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    });

    if (!cancellation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoàn tiền",
      });
    }

    const now = new Date();
    const updateData = { updated_at: now };

    // Xử lý duyệt hoàn tiền theo loại
    if (refund_type === "renter" || refund_type === "both") {
      if (cancellation.refund_status_renter === "pending") {
        updateData.refund_status_renter = "approved";
        updateData.refund_processed_at_renter = now;
        
        // Tạo thông báo cho renter
        await Notification.create({
          user_id: cancellation.booking.renter.user_id,
          title: "Hoàn tiền đã được duyệt",
          content: `Yêu cầu hoàn tiền ${cancellation.total_refund_for_renter.toLocaleString("vi-VN")} VND cho booking #${cancellation.booking_id} đã được admin duyệt. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.`,
          type: "refund",
          is_read: false,
        }, { transaction });
      }
    }

    if (refund_type === "owner" || refund_type === "both") {
      if (cancellation.refund_status_owner === "pending") {
        updateData.refund_status_owner = "approved";
        updateData.refund_processed_at_owner = now;
        
        // Tạo thông báo cho owner
        await Notification.create({
          user_id: cancellation.booking.vehicle.owner.user_id,
          title: "Hoàn tiền đã được duyệt",
          content: `Yêu cầu hoàn tiền ${cancellation.total_refund_for_owner.toLocaleString("vi-VN")} VND cho booking #${cancellation.booking_id} đã được admin duyệt. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.`,
          type: "refund",
          is_read: false,
        }, { transaction });
      }
    }

    // Cập nhật BookingCancellation
    await cancellation.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã duyệt hoàn tiền thành công",
      data: {
        cancellation_id: cancellation.cancellation_id,
        refund_type,
        approved_at: now,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error approving refund:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt hoàn tiền",
      error: error.message,
    });
  }
};

// PATCH /api/admin/refund-requests/:id/reject - Từ chối hoàn tiền
export const rejectRefund = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { refund_type, reason } = req.body; // "renter" hoặc "owner" hoặc "both"

    // Tìm BookingCancellation
    const cancellation = await BookingCancellation.findOne({
      where: { cancellation_id: id },
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: User,
                  as: "owner",
                  attributes: ["user_id", "full_name", "email"],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    });

    if (!cancellation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hoàn tiền",
      });
    }

    const now = new Date();
    const updateData = { updated_at: now };

    // Xử lý từ chối hoàn tiền theo loại
    if (refund_type === "renter" || refund_type === "both") {
      if (cancellation.refund_status_renter === "pending") {
        updateData.refund_status_renter = "rejected";
        updateData.refund_reason_renter = reason || "Admin từ chối hoàn tiền";
        
        // Tạo thông báo cho renter
        await Notification.create({
          user_id: cancellation.booking.renter.user_id,
          title: "Hoàn tiền bị từ chối",
          content: `Yêu cầu hoàn tiền cho booking #${cancellation.booking_id} đã bị admin từ chối. Lý do: ${reason || "Không đủ điều kiện hoàn tiền"}`,
          type: "refund",
          is_read: false,
        }, { transaction });
      }
    }

    if (refund_type === "owner" || refund_type === "both") {
      if (cancellation.refund_status_owner === "pending") {
        updateData.refund_status_owner = "rejected";
        
        // Tạo thông báo cho owner
        await Notification.create({
          user_id: cancellation.booking.vehicle.owner.user_id,
          title: "Hoàn tiền bị từ chối",
          content: `Yêu cầu hoàn tiền cho booking #${cancellation.booking_id} đã bị admin từ chối. Lý do: ${reason || "Không đủ điều kiện hoàn tiền"}`,
          type: "refund",
          is_read: false,
        }, { transaction });
      }
    }

    // Cập nhật BookingCancellation
    await cancellation.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã từ chối hoàn tiền",
      data: {
        cancellation_id: cancellation.cancellation_id,
        refund_type,
        rejected_at: now,
        reason,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error rejecting refund:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối hoàn tiền",
      error: error.message,
    });
  }
};