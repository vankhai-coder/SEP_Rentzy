import db from "../../models/index.js";
import { Op } from "sequelize";

const { BookingPayout, Booking, User, Vehicle, Notification, Bank, Transaction, Brand } = db;

// PATCH /api/admin/payout-requests/:id/approve - Duyệt thanh toán
export const approvePayout = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    // Tìm BookingPayout
    const payout = await BookingPayout.findOne({
      where: { payout_id: id },
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

    if (!payout) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu thanh toán",
      });
    }

    if (payout.payout_status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Yêu cầu thanh toán đã được xử lý",
      });
    }

    const now = new Date();

    // Cập nhật trạng thái payout
    await payout.update(
      {
        payout_status: "completed",
        processed_at: now,
        completed_at: now,
        updated_at: now,
      },
      { transaction }
    );

    // Tạo transaction PAYOUT cho owner
    await Transaction.create(
      {
        booking_id: payout.booking_id,
        from_user_id: null, // System/Admin transaction - không có user cụ thể
        to_user_id: payout.booking.vehicle.owner.user_id,
        amount: payout.total_rental_amount,
        type: "PAYOUT",
        status: "COMPLETED",
        payment_method: payout.payout_method.toUpperCase(),
        processed_at: now,
        note: `Thanh toán payout cho booking #${payout.booking_id} - Admin duyệt`,
      },
      { transaction }
    );

    // Tạo thông báo cho owner
    await Notification.create(
      {
        user_id: payout.booking.vehicle.owner.user_id,
        title: "Thanh toán đã được duyệt",
        content: `Thanh toán ${payout.total_rental_amount.toLocaleString(
          "vi-VN"
        )} VND cho booking #${
          payout.booking_id
        } đã được admin duyệt. Số tiền giải ngân đã được chuyển vào tài khoản của bạn.`,
        type: "payout",
        is_read: false,
      },
      { transaction }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã duyệt thanh toán thành công",
      data: {
        payout_id: payout.payout_id,
        approved_at: now,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error approving payout:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt thanh toán",
      error: error.message,
    });
  }
};

// PATCH /api/admin/payout-requests/:id/reject - Từ chối thanh toán
export const rejectPayout = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Tìm BookingPayout
    const payout = await BookingPayout.findOne({
      where: { payout_id: id },
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

    if (!payout) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu thanh toán",
      });
    }

    if (payout.payout_status !== "pending") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Yêu cầu thanh toán đã được xử lý",
      });
    }

    const now = new Date();

    // Cập nhật trạng thái payout
    await payout.update(
      {
        payout_status: "cancelled",
        failure_reason: reason || "Admin từ chối thanh toán",
        processed_at: now,
        updated_at: now,
      },
      { transaction }
    );

    // Tạo transaction hoàn tiền cho renter
    await Transaction.create(
      {
        booking_id: payout.booking_id,
        from_user_id: null, // Admin/System
        to_user_id: payout.booking.renter?.user_id,
        amount: payout.total_rental_amount,
        type: "REFUND",
        status: "COMPLETED",
        payment_method: "SYSTEM",
        processed_at: now,
        note: `Hoàn tiền do từ chối thanh toán payout cho booking #${payout.booking_id} - ${reason || "Admin từ chối"}`,
      },
      { transaction }
    );

    // Tạo transaction ghi nợ cho owner (để cân bằng sổ sách)
    await Transaction.create(
      {
        booking_id: payout.booking_id,
        from_user_id: payout.booking.vehicle.owner.user_id,
        to_user_id: null, // Admin/System
        amount: payout.total_rental_amount,
        type: "DEBIT",
        status: "COMPLETED",
        payment_method: "SYSTEM",
        processed_at: now,
        note: `Ghi nợ do từ chối thanh toán payout cho booking #${payout.booking_id} - ${reason || "Admin từ chối"}`,
      },
      { transaction }
    );

    // Tạo thông báo cho owner
    await Notification.create(
      {
        user_id: payout.booking.vehicle.owner.user_id,
        title: "Thanh toán bị từ chối",
        content: `Yêu cầu thanh toán cho booking #${
          payout.booking_id
        } đã bị admin từ chối. Lý do: ${
          reason || "Không đủ điều kiện thanh toán"
        }. Số tiền đã được hoàn lại cho người thuê.`,
        type: "payout",
        is_read: false,
      },
      { transaction }
    );

    // Tạo thông báo cho renter (nếu có)
    if (payout.booking.renter?.user_id) {
      await Notification.create(
        {
          user_id: payout.booking.renter.user_id,
          title: "Nhận hoàn tiền",
          content: `Bạn đã nhận hoàn tiền ${payout.total_rental_amount.toLocaleString(
            "vi-VN"
          )} VND do yêu cầu thanh toán cho booking #${
            payout.booking_id
          } bị từ chối. Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc.`,
          type: "refund",
          is_read: false,
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã từ chối thanh toán",
      data: {
        payout_id: payout.payout_id,
        rejected_at: now,
        reason,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error rejecting payout:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi từ chối thanh toán",
      error: error.message,
    });
  }
};

// GET /api/admin/payout-management - Lấy danh sách quản lý thanh toán với thông tin bank
export const getPayoutManagement = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      filter,
      status,
      processed,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {};

    // Add status filter - support both filter and status parameters
    const statusFilter = filter || status;
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.payout_status = statusFilter;
    } else if (processed === 'true') {
      whereConditions.payout_status = {
        [Op.in]: ['completed', 'failed']
      };
    }

    // Add search condition
    if (search) {
      whereConditions[Op.or] = [
        { "$booking.renter.full_name$": { [Op.iLike]: `%${search}%` } },
        { "$booking.vehicle.owner.full_name$": { [Op.iLike]: `%${search}%` } },
        { "$booking.vehicle.license_plate$": { [Op.iLike]: `%${search}%` } },
        { payout_method: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: payoutData } = await BookingPayout.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Booking,
          as: "booking",
          include: [
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
              model: Vehicle,
              as: "vehicle",
              attributes: [
                "vehicle_id",
                "model",
                "license_plate",
                "main_image_url",
              ],
              include: [
                {
                  model: Brand,
                  as: "brand",
                  attributes: ["brand_id", "name"],
                },
                {
                  model: User,
                  as: "owner",
                  attributes: [
                    "user_id",
                    "full_name",
                    "email",
                    "phone_number",
                    "avatar_url",
                  ],
                  include: [
                    {
                      model: Bank,
                      as: "banks",
                      attributes: [
                        "bank_id",
                        "bank_name",
                        "account_number",
                        "account_holder_name",
                        "qr_code_url",
                      ],
                      where: { is_primary: true },
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
          attributes: [
            "booking_id",
            "start_date",
            "end_date",
            "total_amount",
            "total_paid",
            "remaining_paid_by_cash_status",
            "status",
            "created_at",
          ],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Format data for response
    const formattedData = payoutData.map((payout) => {
      const ownerBank = payout.booking.vehicle.owner.banks?.[0] || null;

      return {
        payout_id: payout.payout_id,
        booking_id: payout.booking_id,
        total_rental_amount: parseFloat(payout.total_rental_amount),
        platform_commission_rate: parseFloat(payout.platform_commission_rate),
        status: payout.payout_status, // Map payout_status to status for frontend
        payout_method: payout.payout_method,
        payout_account_info: payout.payout_account_info,
        requested_at: payout.requested_at,
        processed_at: payout.processed_at,
        completed_at: payout.completed_at,
        failure_reason: payout.failure_reason,
        created_at: payout.created_at,
        updated_at: payout.updated_at,

        // Booking info
        booking_info: {
          booking_id: payout.booking.booking_id,
          start_date: payout.booking.start_date,
          end_date: payout.booking.end_date,
          total_amount: payout.booking.total_amount,
          total_paid: payout.booking.total_paid,
          remaining_paid_by_cash_status: payout.booking.remaining_paid_by_cash_status,
          status: payout.booking.status,
          created_at: payout.booking.created_at,
        },

        // Vehicle info with brand
        vehicle_info: {
          vehicle_id: payout.booking.vehicle.vehicle_id,
          brand: payout.booking.vehicle.brand?.name || "Unknown", // Get brand name from Brand model
          model: payout.booking.vehicle.model,
          license_plate: payout.booking.vehicle.license_plate,
          main_image_url: payout.booking.vehicle.main_image_url,
        },

        // Renter info
        renter_info: {
          user_id: payout.booking.renter.user_id,
          full_name: payout.booking.renter.full_name,
          email: payout.booking.renter.email,
          phone_number: payout.booking.renter.phone_number,
          avatar_url: payout.booking.renter.avatar_url,
        },

        // Owner info with bank details at root level
        owner_info: {
          user_id: payout.booking.vehicle.owner.user_id,
          full_name: payout.booking.vehicle.owner.full_name,
          email: payout.booking.vehicle.owner.email,
          phone_number: payout.booking.vehicle.owner.phone_number,
          avatar_url: payout.booking.vehicle.owner.avatar_url,
          // Bank info at root level for easier access
          bank_name: ownerBank?.bank_name || null,
          account_number: ownerBank?.account_number || null,
          account_holder_name: ownerBank?.account_holder_name || null,
          qr_code: ownerBank?.qr_code_url || null, // Map qr_code_url to qr_code
          bank_info: ownerBank
            ? {
                bank_id: ownerBank.bank_id,
                bank_name: ownerBank.bank_name,
                account_number: ownerBank.account_number,
                account_holder_name: ownerBank.account_holder_name,
                qr_code_url: ownerBank.qr_code_url,
              }
            : null,
        },
      };
    });

    // Calculate statistics for all payouts (not just current page)
    const allPayouts = await BookingPayout.findAll({
      attributes: ['payout_status'],
    });

    const statistics = {
      total: allPayouts.length,
      pending: allPayouts.filter(p => p.payout_status === 'pending').length,
      approved: allPayouts.filter(p => p.payout_status === 'completed').length,
      rejected: allPayouts.filter(p => p.payout_status === 'cancelled').length,
      completed: allPayouts.filter(p => p.payout_status === 'completed').length,
      failed: allPayouts.filter(p => p.payout_status === 'failed').length,
    };

    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách quản lý thanh toán thành công",
      data: {
        payouts: formattedData,
        totalPages,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting payout management:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách quản lý thanh toán",
      error: error.message,
    });
  }
};