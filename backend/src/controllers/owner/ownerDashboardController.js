import db from "../../models/index.js";
import { Op } from "sequelize";
import { calculateCancellationFeeLogic, createCancellationInfo } from "../../utils/cancellationUtils.js";

const {
  Booking,
  BookingReview,
  Notification,
  Vehicle,
  User,
  Brand,
  BookingHandover,
  BookingCancellation,
  Transaction,
} = db;

// 1. GET /api/owner/bookings - Quản lý đơn thuê
export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          bookings: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Tạo điều kiện where
    let whereCondition = {
      vehicle_id: { [Op.in]: vehicleIds },
    };

    if (status) {
      whereCondition.status = status;
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["brand_id", "name", "logo_url"],
            },
          ],
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "price_per_day",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: BookingCancellation,
          as: "cancellation",
          required: false, // LEFT JOIN để lấy booking ngay cả khi chưa có cancellation
          attributes: [
            "cancellation_id",
            "cancellation_fee",
            "total_refund_for_owner",
            "total_refund_for_renter",
            "cancellation_reason",
            "cancelled_by",
            "owner_approved_cancel_at",
            "cancelled_at",
            "refund_status_renter",
            "refund_status_owner",
          ],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Xử lý thông tin hủy cho từng booking
    const processedBookings = bookings.map((booking) => {
      const bookingData = booking.toJSON();
      
      // Nếu booking có trạng thái cancel_requested hoặc canceled nhưng chưa có BookingCancellation
      if ((bookingData.status === 'cancel_requested' || bookingData.status === 'canceled') && !bookingData.cancellation) {
        // Tính toán thông tin hủy dựa trên logic chung
        const calculation = calculateCancellationFeeLogic(bookingData);
        const cancellationInfo = createCancellationInfo(bookingData, calculation);
        
        // Thêm thông tin hủy tính toán vào response
        bookingData.cancellation_info = {
          ...cancellationInfo,
          calculated: true, // Đánh dấu là thông tin được tính toán
          status: bookingData.status === 'cancel_requested' ? 'pending_approval' : 'approved',
        };
      } else if (bookingData.cancellation) {
        // Nếu đã có BookingCancellation, sử dụng dữ liệu từ database
        bookingData.cancellation_info = {
          cancellation_fee: bookingData.cancellation.cancellation_fee,
          owner_refund: bookingData.cancellation.total_refund_for_owner,
          renter_refund: bookingData.cancellation.total_refund_for_renter,
          cancellation_reason: bookingData.cancellation.cancellation_reason,
          cancelled_by: bookingData.cancellation.cancelled_by,
          can_approve: false, // Đã được xử lý
          calculated: false, // Dữ liệu từ database
          status: 'approved',
          refund_status_renter: bookingData.cancellation.refund_status_renter,
          refund_status_owner: bookingData.cancellation.refund_status_owner,
        };
      }
      
      // Xóa thông tin cancellation gốc để tránh trùng lặp
      delete bookingData.cancellation;
      
      return bookingData;
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        bookings: processedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting owner bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn thuê",
      error: error.message,
    });
  }
};

// Get owner transactions
export const getOwnerTransactions = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      status = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Map sortBy from frontend camelCase to database snake_case
    const sortByMap = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      amount: "amount",
    };
    const dbSortBy = sortByMap[sortBy] || sortBy;

    // Build where conditions cho Transaction
    const whereConditions = {
      to_user_id: ownerId, // Lấy các giao dịch mà owner nhận tiền
      type: { [Op.in]: ['COMPENSATION', 'PAYOUT'] }, // Chỉ lấy COMPENSATION và PAYOUT
    };

    // Add search condition
    if (search) {
      whereConditions[Op.or] = [
        { transaction_id: { [Op.like]: `%${search}%` } },
        { note: { [Op.like]: `%${search}%` } },
        { "$fromUser.full_name$": { [Op.like]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (status && status !== "all") {
      whereConditions.status = status.toUpperCase();
    }

    // Add type filter
    if (type && type !== "all") {
      if (type === "compensation") {
        whereConditions.type = "COMPENSATION";
      } else if (type === "payout") {
        whereConditions.type = "PAYOUT";
      }
    }

    // Get transactions from Transaction table
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["user_id", "full_name", "email", "phone_number"],
          required: false,
        },
        {
          model: User,
          as: "toUser",
          attributes: ["user_id", "full_name", "email"],
          required: false,
        },
        {
          model: Booking,
          attributes: ["booking_id", "start_date", "end_date"],
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: ["vehicle_id", "license_plate", "model", "brand_id"],
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["name"],
                },
              ],
            },
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
          ],
          required: false,
        },
      ],
      order: [[dbSortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Format transactions data
    const formattedTransactions = transactions.map((transaction) => {
      // Xác định loại giao dịch
      let transactionType = "income";
      let description = "";
      
      if (transaction.type === "COMPENSATION") {
        transactionType = "compensation";
        description = `Bồi thường từ khách hàng hủy chuyến`;
      } else if (transaction.type === "PAYOUT") {
        transactionType = "payout";
        description = `Thanh toán từ hệ thống`;
      }

      // Thêm thông tin xe nếu có
      if (transaction.Booking?.vehicle) {
        description += ` - Xe ${transaction.Booking.vehicle.license_plate}`;
      }

      return {
        id: transaction.transaction_id,
        bookingCode: transaction.Booking ? `BK${transaction.Booking.booking_id}` : "N/A",
        type: transactionType,
        amount: parseFloat(transaction.amount || 0),
        description: transaction.note || description,
        paymentStatus: transaction.status.toLowerCase(),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        startDate: transaction.Booking?.start_date || null,
        endDate: transaction.Booking?.end_date || null,
        renter: transaction.Booking?.renter ? {
          id: transaction.Booking.renter.user_id,
          name: transaction.Booking.renter.full_name,
          email: transaction.Booking.renter.email,
          phone: transaction.Booking.renter.phone_number,
        } : (transaction.fromUser ? {
          id: transaction.fromUser.user_id,
          name: transaction.fromUser.full_name,
          email: transaction.fromUser.email,
          phone: transaction.fromUser.phone_number,
        } : null),
        vehicle: transaction.Booking?.vehicle ? {
          id: transaction.Booking.vehicle.vehicle_id,
          licensePlate: transaction.Booking.vehicle.license_plate,
          model: transaction.Booking.vehicle.model,
          brand: transaction.Booking.vehicle.brand?.name || "N/A",
        } : null,
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting owner transactions:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách giao dịch",
      error: error.message,
    });
  }
};

// 2. GET /api/owner/cancel-requests - Duyệt đơn hủy (với thông tin tiền hoàn từ BookingCancellation)
export const getCancelRequests = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          cancelRequests: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Điều kiện where cho Booking
    let bookingWhere = {
      vehicle_id: { [Op.in]: vehicleIds },
      status: { [Op.in]: ["cancel_requested"] },
    };

    // Nếu chỉ muốn lấy những đơn đang chờ duyệt
    if (status === "pending_approval") {
      bookingWhere.status = "cancel_requested";
    }

    // Tìm các booking có yêu cầu hủy hoặc đã hủy, kèm thông tin BookingCancellation
    const { count, rows: cancelRequests } = await Booking.findAndCountAll({
      where: bookingWhere,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["brand_id", "name", "logo_url"],
            },
          ],
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "price_per_day",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: [
            "user_id",
            "full_name",
            "email",
            "phone_number",
            "avatar_url",
          ],
        },
        {
          model: BookingCancellation,
          as: "cancellation",
          required: false, // LEFT JOIN để lấy cả booking chưa có cancellation record
          attributes: [
            "cancellation_id",
            "cancellation_reason",
            "cancellation_fee",
            "cancelled_by",
            "cancel_requested_at",
            "cancelled_at",
            "owner_approved_cancel_at",
            "total_refund_for_renter",
            "refund_status_renter",
            "refund_processed_at_renter",
            "total_refund_for_owner",
            "refund_status_owner",
            "refund_processed_at_owner",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    // Format dữ liệu để hiển thị với thông tin tiền hoàn chi tiết
    const formattedCancelRequests = cancelRequests.map((booking) => {
      const cancellation = booking.cancellation;
      const bookingData = booking.toJSON();

      // Tính toán thông tin tiền hoàn sử dụng hàm chung
      let cancellationFee = 0;
      let platformFee = 0;
      let ownerRefund = 0;
      let renterRefund = 0;
      let cancellationFeePercent = 0;

      if (cancellation) {
        // Nếu đã có BookingCancellation, sử dụng dữ liệu từ database
        cancellationFee = parseFloat(cancellation.cancellation_fee) || 0;
        platformFee = cancellationFee * 0.1; // 10% cho platform
        ownerRefund = parseFloat(cancellation.total_refund_for_owner) || 0;
        renterRefund = parseFloat(cancellation.total_refund_for_renter) || 0;
        cancellationFeePercent = cancellationFee > 0 
          ? Math.round((cancellationFee / parseFloat(booking.total_paid)) * 100)
          : 0;
      } else if (booking.status === "cancel_requested") {
        // Tính toán dự kiến cho những booking chưa có cancellation record sử dụng hàm chung
        const calculation = calculateCancellationFeeLogic(bookingData);
        cancellationFee = calculation.cancellationFee;
        platformFee = calculation.platformFee;
        ownerRefund = calculation.ownerRefund;
        renterRefund = calculation.refundAmount;
        cancellationFeePercent = calculation.cancellationFeePercent;
      }

      return {
        // Thông tin booking cơ bản
        booking_id: booking.booking_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: parseFloat(booking.total_amount),
        total_paid: parseFloat(booking.total_paid),
        status: booking.status,
        created_at: booking.created_at,

        // Thông tin xe
        vehicle: {
          vehicle_id: booking.vehicle.vehicle_id,
          model: booking.vehicle.model,
          license_plate: booking.vehicle.license_plate,
          main_image_url: booking.vehicle.main_image_url,
          price_per_day: parseFloat(booking.vehicle.price_per_day),
          brand: booking.vehicle.brand,
        },

        // Thông tin người thuê
        renter: booking.renter,

        // Thông tin hủy đơn
        cancellation_info: cancellation
          ? {
              cancellation_id: cancellation.cancellation_id,
              reason: cancellation.cancellation_reason,
              cancelled_by: cancellation.cancelled_by,
              cancel_requested_at: cancellation.cancel_requested_at,
              cancelled_at: cancellation.cancelled_at,
              owner_approved_at: cancellation.owner_approved_cancel_at,
              refund_status_renter: cancellation.refund_status_renter,
              refund_status_owner: cancellation.refund_status_owner,
              refund_processed_at_renter:
                cancellation.refund_processed_at_renter,
              refund_processed_at_owner: cancellation.refund_processed_at_owner,
            }
          : null,

        // Thông tin tiền hoàn chi tiết
        financial_breakdown: {
          cancellation_fee: cancellationFee,
          platform_fee: platformFee, // 10% phí hủy cho admin
          owner_refund: ownerRefund, // 90% phí hủy cho owner
          renter_refund: renterRefund, // Tiền hoàn cho renter
          cancellation_fee_percent: cancellationFeePercent,
        },

        // Trạng thái tổng quan
        can_approve: booking.status === "cancel_requested",
        is_cancelled: booking.status === "canceled",
      };
    });

    const totalPages = Math.ceil(count / limit);

    // Tính tổng hợp thống kê
    const summary = formattedCancelRequests.reduce(
      (acc, item) => {
        acc.total_cancellation_fees +=
          item.financial_breakdown.cancellation_fee;
        acc.total_platform_fees += item.financial_breakdown.platform_fee;
        acc.total_owner_refunds += item.financial_breakdown.owner_refund;
        acc.total_renter_refunds += item.financial_breakdown.renter_refund;

        if (item.status === "cancel_requested") {
          acc.pending_approvals++;
        } else if (item.status === "canceled") {
          acc.completed_cancellations++;
        }

        return acc;
      },
      {
        total_cancellation_fees: 0,
        total_platform_fees: 0,
        total_owner_refunds: 0,
        total_renter_refunds: 0,
        pending_approvals: 0,
        completed_cancellations: 0,
      }
    );

    res.json({
      success: true,
      data: {
        cancelRequests: formattedCancelRequests,
        summary,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting cancel requests:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách yêu cầu hủy",
      error: error.message,
    });
  }
};

// PATCH /api/owner/cancel-requests/:id/approve - Duyệt yêu cầu hủy
export const approveCancelRequest = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    console.log("=== APPROVE CANCEL REQUEST DEBUG ===");
    console.log("Request params:", { id, ownerId });

    // Kiểm tra booking có thuộc xe của owner không
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        status: "cancel_requested",
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
      transaction,
    });

    console.log("Found booking:", booking ? "YES" : "NO");
    if (booking) {
      console.log("Booking data:", {
        booking_id: booking.booking_id,
        status: booking.status,
        total_amount: booking.total_amount,
        total_paid: booking.total_paid,
        created_at: booking.created_at,
        start_date: booking.start_date
      });
    }

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hủy",
      });
    }

    // Tính toán phí hủy sử dụng hàm chung
    const now = new Date();
    const bookingData = booking.toJSON();
    console.log("Booking data for calculation:", bookingData);
    
    const calculation = calculateCancellationFeeLogic(bookingData, now);
    console.log("Calculation result:", calculation);
    
    const cancellationFee = calculation.cancellationFee;
    const refundAmount = calculation.refundAmount;
    const platformFee = calculation.platformFee;
    const ownerRefund = calculation.ownerRefund;

    console.log("Extracted values:", {
      cancellationFee,
      refundAmount,
      platformFee,
      ownerRefund
    });

    // Cập nhật trạng thái thành canceled
    await booking.update({
      status: "canceled",
      updated_at: now,
    }, { transaction });

    // Hoàn lại điểm thưởng nếu có sử dụng
    if (booking.points_used > 0) {
      await User.increment("points", {
        by: booking.points_used,
        where: { user_id: booking.renter_id },
        transaction,
      });
    }

    // Tìm và cập nhật BookingCancellation đã có (được tạo khi renter yêu cầu hủy)
    const existingCancellation = await BookingCancellation.findOne({
      where: { booking_id: booking.booking_id },
      transaction,
    });

    if (!existingCancellation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin hủy booking",
      });
    }

    console.log("Found existing BookingCancellation:", existingCancellation.cancellation_id);

    // Cập nhật BookingCancellation với thông tin duyệt và chuyển trạng thái hoàn tiền thành pending
    await existingCancellation.update({
      owner_approved_cancel_at: now,
      cancelled_at: now,
      refund_status_renter: "pending", // Chuyển từ none thành pending
      refund_status_owner: ownerRefund > 0 ? "pending" : "none", // Chuyển từ none thành pending nếu có tiền hoàn
      updated_at: now,
    }, { transaction });

    console.log("BookingCancellation updated successfully with pending refund status");

    // Tạo thông báo cho renter
    console.log("Creating notification for renter:", booking.renter_id);
    await Notification.create({
      user_id: booking.renter_id,
      title: "Yêu cầu hủy đã được duyệt",
      content: `Yêu cầu hủy đơn thuê xe ${booking.vehicle.model} đã được chủ xe duyệt. Số tiền hoàn lại: ${refundAmount.toLocaleString("vi-VN")} VND (đang chờ admin duyệt).`,
      type: "rental",
      is_read: false,
    }, { transaction });

    // Tạo thông báo cho admin về việc cần duyệt hoàn tiền
    console.log("Creating notification for admin");
    await Notification.create({
      user_id: 1, // Giả sử admin có user_id = 1
      title: "Yêu cầu duyệt hoàn tiền",
      content: `Có yêu cầu duyệt hoàn tiền cho booking #${booking.booking_id}: Renter ${refundAmount.toLocaleString("vi-VN")} VND, Owner ${ownerRefund.toLocaleString("vi-VN")} VND, Platform ${platformFee.toLocaleString("vi-VN")} VND`,
      type: "refund_request",
      is_read: false,
    }, { transaction });

    console.log("Committing transaction...");
    await transaction.commit();
    console.log("Transaction committed successfully");

    res.json({
      success: true,
      message: "Đã duyệt yêu cầu hủy thành công",
    });
  } catch (error) {
    console.log("=== ERROR IN APPROVE CANCEL REQUEST ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    await transaction.rollback();
    console.log("Transaction rolled back");
    
    res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt yêu cầu hủy",
      error: error.message,
    });
  }
};

// PATCH /api/owner/cancel-requests/:id/reject - Từ chối yêu cầu hủy
export const rejectCancelRequest = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra booking có thuộc xe của owner không
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        status: "cancel_requested",
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { owner_id: ownerId },
        },
      ],
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hủy",
      });
    }

    // Cập nhật trạng thái về fully_paid (trở lại trạng thái trước khi yêu cầu hủy)
    await booking.update({
      status: "fully_paid",
      updated_at: new Date(),
    }, { transaction });

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Yêu cầu hủy bị từ chối",
      content: `Yêu cầu hủy đơn thuê xe ${booking.vehicle.model} đã bị chủ xe từ chối.`,
      type: "rental",
      is_read: false,
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã từ chối yêu cầu hủy",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error rejecting cancel request:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối yêu cầu hủy",
      error: error.message,
    });
  }
};

// 3. GET /api/owner/revenue - Doanh thu
export const getOwnerRevenue = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const {
      period = "month",
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
    } = req.query;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          completedBookings: 0,
          monthlyRevenue: [],
          vehicleStats: [],
        },
      });
    }

    // Tính doanh thu tổng
    const totalRevenueResult = await Booking.findOne({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: "completed",
      },
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("total_amount")),
          "totalRevenue",
        ],
      ],
      raw: true,
    });

    const totalRevenue = parseFloat(totalRevenueResult?.totalRevenue || 0);

    // Đếm số đơn hoàn thành
    const completedBookings = await Booking.count({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: "completed",
      },
    });

    // Doanh thu theo tháng (12 tháng gần nhất)
    const monthlyRevenue = await db.sequelize.query(
      `
      SELECT 
        MONTH(created_at) as month,
        YEAR(created_at) as year,
        SUM(total_amount) as revenue,
        COUNT(*) as booking_count
      FROM bookings 
      WHERE vehicle_id IN (${vehicleIds.join(",")})
        AND status = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Thống kê theo xe
    const vehicleStats = await Booking.findAll({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: "completed",
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          include: [
            {
              model: Brand,
              as: "brand",
              attributes: ["brand_id", "name"],
            },
          ],
          attributes: ["vehicle_id", "model", "license_plate"],
        },
      ],
      attributes: [
        "vehicle_id",
        [
          db.sequelize.fn("SUM", db.sequelize.col("total_amount")),
          "totalRevenue",
        ],
        [
          db.sequelize.fn("COUNT", db.sequelize.col("booking_id")),
          "bookingCount",
        ],
      ],
      group: ["vehicle_id"],
      raw: false,
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        completedBookings,
        monthlyRevenue,
        vehicleStats,
      },
    });
  } catch (error) {
    console.error("Error getting owner revenue:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin doanh thu",
      error: error.message,
    });
  }
};

// 4. GET /api/owner/vehicle-reviews - Đánh giá về xe
export const getVehicleReviews = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, vehicle_id } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          reviews: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Tạo điều kiện where cho booking
    let bookingWhere = {
      vehicle_id: { [Op.in]: vehicleIds },
    };

    if (vehicle_id) {
      bookingWhere.vehicle_id = vehicle_id;
    }

    const { count, rows: reviews } = await BookingReview.findAndCountAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: bookingWhere,
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["brand_id", "name", "logo_url"],
                },
              ],
              attributes: [
                "vehicle_id",
                "model",
                "license_plate",
                "main_image_url",
              ],
            },
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    // Tính điểm đánh giá trung bình
    const avgRatingResult = await BookingReview.findOne({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { vehicle_id: { [Op.in]: vehicleIds } },
        },
      ],
      attributes: [
        [db.sequelize.fn("AVG", db.sequelize.col("rating")), "avgRating"],
        [
          db.sequelize.fn("COUNT", db.sequelize.col("review_id")),
          "totalReviews",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: parseFloat(avgRatingResult?.avgRating || 0),
        totalReviews: parseInt(avgRatingResult?.totalReviews || 0),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting vehicle reviews:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy đánh giá xe",
      error: error.message,
    });
  }
};

// 5. GET /api/owner/notifications - Thông báo
export const getOwnerNotifications = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, is_read } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = { user_id: ownerId };

    // Only apply filter when query param is explicitly 'true' or 'false'
    if (is_read === "true") {
      whereCondition.is_read = true;
    } else if (is_read === "false") {
      whereCondition.is_read = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereCondition,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.count({
      where: {
        user_id: ownerId,
        is_read: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

// PATCH /api/owner/notifications/:id/read - Đánh dấu đã đọc
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: ownerId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    await notification.update({
      is_read: true,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

// GET /api/owner/dashboard/bookings/:id - Lấy chi tiết đơn thuê
export const getBookingDetail = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    // Lấy danh sách xe của owner để kiểm tra quyền truy cập
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe nào của bạn",
      });
    }

    // Lấy chi tiết booking
    const booking = await Booking.findOne({
      where: {
        booking_id: id,
        vehicle_id: { [Op.in]: vehicleIds },
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "price_per_day",
            "location",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: BookingHandover,
          as: "handover",
          attributes: { exclude: [] }, //  lấy tất cả cột
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error getting booking detail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết đơn thuê",
      error: error.message,
    });
  }
};

// PATCH /api/owner/notifications/mark-all-read - Đánh dấu tất cả đã đọc
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    await Notification.update(
      {
        is_read: true,
        updated_at: new Date(),
      },
      {
        where: {
          user_id: ownerId,
          is_read: false,
        },
      }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

// API lấy danh sách booking đã hủy của owner với thông tin chi tiết về tiền hoàn
export const getCancelledBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;

    // Lấy danh sách xe của owner
    const ownerVehicles = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: ["vehicle_id"],
    });

    const vehicleIds = ownerVehicles.map((v) => v.vehicle_id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          cancelledBookings: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    }

    // Điều kiện where cho BookingCancellation
    let cancellationWhere = {};
    if (status) {
      if (status === "pending_refund") {
        cancellationWhere = {
          [Op.or]: [
            { refund_status_renter: "pending" },
            { refund_status_owner: "pending" },
          ],
        };
      } else if (status === "completed_refund") {
        cancellationWhere = {
          refund_status_renter: "completed",
          refund_status_owner: { [Op.in]: ["completed", "none"] },
        };
      }
    }

    const { count, rows: cancelledBookings } =
      await BookingCancellation.findAndCountAll({
        where: cancellationWhere,
        include: [
          {
            model: Booking,
            as: "booking",
            where: {
              vehicle_id: { [Op.in]: vehicleIds },
              status: { [Op.in]: ["canceled", "cancel_requested"] },
            },
            include: [
              {
                model: Vehicle,
                as: "vehicle",
                include: [
                  {
                    model: Brand,
                    as: "brand",
                    attributes: ["brand_id", "name", "logo_url"],
                  },
                ],
                attributes: [
                  "vehicle_id",
                  "model",
                  "license_plate",
                  "main_image_url",
                  "price_per_day",
                ],
              },
              {
                model: User,
                as: "renter",
                attributes: [
                  "user_id",
                  "full_name",
                  "email",
                  "phone_number",
                  "avatar_url",
                ],
              },
            ],
            attributes: [
              "booking_id",
              "start_date",
              "end_date",
              "total_amount",
              "total_paid",
              "status",
              "created_at",
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true,
      });

    // Format dữ liệu để hiển thị dưới dạng bảng
    const formattedData = cancelledBookings.map((cancellation) => {
      const booking = cancellation.booking;

      // Tính toán phí platform (10% của cancellation_fee)
      const cancellationFee = parseFloat(cancellation.cancellation_fee) || 0;
      const platformFee = cancellationFee * 0.1;
      const ownerRefund = parseFloat(cancellation.total_refund_for_owner) || 0;
      const renterRefund =
        parseFloat(cancellation.total_refund_for_renter) || 0;

      return {
        // Thông tin cơ bản
        cancellation_id: cancellation.cancellation_id,
        booking_id: booking.booking_id,
        vehicle_info: {
          model: booking.vehicle.model,
          license_plate: booking.vehicle.license_plate,
          brand: booking.vehicle.brand?.name || "N/A",
          image: booking.vehicle.main_image_url,
          price_per_day: booking.vehicle.price_per_day,
        },
        renter_info: {
          name: booking.renter.full_name,
          email: booking.renter.email,
          phone: booking.renter.phone_number,
          avatar: booking.renter.avatar_url,
        },

        // Thông tin booking
        booking_period: {
          start_date: booking.start_date,
          end_date: booking.end_date,
          created_at: booking.created_at,
        },

        // Thông tin tài chính
        financial_info: {
          total_amount: parseFloat(booking.total_amount) || 0,
          total_paid: parseFloat(booking.total_paid) || 0,
          cancellation_fee: cancellationFee,
          platform_fee: platformFee, // 10% phí hủy cho admin
          owner_refund: ownerRefund, // 90% phí hủy cho owner
          renter_refund: renterRefund, // Tiền hoàn cho renter
        },

        // Thông tin hủy
        cancellation_info: {
          reason: cancellation.cancellation_reason,
          cancelled_by: cancellation.cancelled_by,
          cancel_requested_at: cancellation.cancel_requested_at,
          cancelled_at: cancellation.cancelled_at,
          owner_approved_at: cancellation.owner_approved_cancel_at,
        },

        // Trạng thái hoàn tiền
        refund_status: {
          renter: {
            status: cancellation.refund_status_renter,
            amount: renterRefund,
            processed_at: cancellation.refund_processed_at_renter,
            reason: cancellation.refund_reason_renter,
          },
          owner: {
            status: cancellation.refund_status_owner,
            amount: ownerRefund,
            processed_at: cancellation.refund_processed_at_owner,
          },
          platform: {
            amount: platformFee,
            status: cancellationFee > 0 ? "completed" : "none", // Platform luôn nhận ngay
          },
        },

        // Trạng thái tổng quan
        overall_status: booking.status,
        created_at: cancellation.created_at,
        updated_at: cancellation.updated_at,
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        cancelledBookings: formattedData,
        summary: {
          total_cancelled: count,
          total_platform_fee: formattedData.reduce(
            (sum, item) => sum + item.financial_info.platform_fee,
            0
          ),
          total_owner_refund: formattedData.reduce(
            (sum, item) => sum + item.financial_info.owner_refund,
            0
          ),
          total_renter_refund: formattedData.reduce(
            (sum, item) => sum + item.financial_info.renter_refund,
            0
          ),
          pending_refunds: formattedData.filter(
            (item) =>
              item.refund_status.renter.status === "pending" ||
              item.refund_status.owner.status === "pending"
          ).length,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting cancelled bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách booking đã hủy",
      error: error.message,
    });
  }
};
