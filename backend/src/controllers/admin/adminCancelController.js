import db from "../../models/index.js";
import { Op } from "sequelize";

const { Booking, BookingCancellation, User, Vehicle, Notification, Bank, Transaction } = db;

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
        await Notification.create(
          {
            user_id: cancellation.booking.renter.user_id,
            title: "Hoàn tiền đã được duyệt",
            content: `Yêu cầu hoàn tiền ${cancellation.total_refund_for_renter.toLocaleString(
              "vi-VN"
            )} VND cho booking #${
              cancellation.booking_id
            } đã được admin duyệt. Tiền sẽ được chuyển về tài khoản của bạn .`,
            type: "refund",
            is_read: false,
          },
          { transaction }
        );
      }
    }

    if (refund_type === "owner" || refund_type === "both") {
      if (cancellation.refund_status_owner === "pending") {
        updateData.refund_status_owner = "approved";
        updateData.refund_processed_at_owner = now;

        // Tạo transaction COMPENSATION cho owner
        if (cancellation.total_refund_for_owner > 0) {
          await Transaction.create(
            {
              booking_id: cancellation.booking_id,
              from_user_id: null, // Admin/System
              to_user_id: cancellation.booking.vehicle.owner.user_id,
              amount: cancellation.total_refund_for_owner,
              type: "COMPENSATION",
              status: "COMPLETED",
              payment_method: "BANK_TRANSFER",
              processed_at: now,
              note: `Hoàn tiền hủy booking #${cancellation.booking_id} - Admin duyệt`,
            },
            { transaction }
          );
        }

        // Tạo thông báo cho owner
        await Notification.create(
          {
            user_id: cancellation.booking.vehicle.owner.user_id,
            title: "Hoàn tiền đã được duyệt",
            content: `Yêu cầu hoàn tiền ${cancellation.total_refund_for_owner.toLocaleString(
              "vi-VN"
            )} VND cho booking #${
              cancellation.booking_id
            } đã được admin duyệt. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.`,
            type: "refund",
            is_read: false,
          },
          { transaction }
        );
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
        await Notification.create(
          {
            user_id: cancellation.booking.renter.user_id,
            title: "Hoàn tiền bị từ chối",
            content: `Yêu cầu hoàn tiền cho booking #${
              cancellation.booking_id
            } đã bị admin từ chối. Lý do: ${
              reason || "Không đủ điều kiện hoàn tiền"
            }`,
            type: "refund",
            is_read: false,
          },
          { transaction }
        );
      }
    }

    if (refund_type === "owner" || refund_type === "both") {
      if (cancellation.refund_status_owner === "pending") {
        updateData.refund_status_owner = "rejected";

        // Tạo thông báo cho owner
        await Notification.create(
          {
            user_id: cancellation.booking.vehicle.owner.user_id,
            title: "Hoàn tiền bị từ chối",
            content: `Yêu cầu hoàn tiền cho booking #${
              cancellation.booking_id
            } đã bị admin từ chối. Lý do: ${
              reason || "Không đủ điều kiện hoàn tiền"
            }`,
            type: "refund",
            is_read: false,
          },
          { transaction }
        );
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
    console.error("Error rejecting refund:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi từ chối hoàn tiền",
      error: error.message,
    });
  }
};

// GET /api/admin/refund-management - Lấy danh sách quản lý hoàn tiền với thông tin bank

export const getRefundManagement = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = {
      [Op.and]: [
        {
          [Op.or]: [
            {
              total_refund_for_renter: { [Op.gt]: 0 },
              ...(status && { refund_status_renter: status }),
            },
            {
              total_refund_for_owner: { [Op.gt]: 0 },
              ...(status && { refund_status_owner: status }),
            },
          ],
        },
      ],
    };

    // Add search condition
    if (search) {
      whereConditions[Op.and].push({
        [Op.or]: [
          { "$booking.renter.full_name$": { [Op.iLike]: `%${search}%` } },
          {
            "$booking.vehicle.owner.full_name$": { [Op.iLike]: `%${search}%` },
          },
          { "$booking.vehicle.license_plate$": { [Op.iLike]: `%${search}%` } },
          { cancellation_reason: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    // Lấy phần trăm phí nền tảng từ SystemSetting (sử dụng chung cho hiển thị admin)
    const platformFeeSetting = await db.SystemSetting.findOne({
      where: { feeCode: "PLATFORM_FEE_COMPLETE_ORDER" },
      attributes: ["feeCode", "percent"],
    });
    const platformFeePercent = Number(platformFeeSetting?.percent ?? 10);

    const { count, rows: refundData } = await BookingCancellation.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Booking,
            as: "booking",
            include: [
              {
                model: User,
                as: "renter",
                attributes: ["user_id", "full_name", "email", "phone_number"],
                include: [
                  {
                    model: Bank,
                    as: "banks",
                    attributes: [
                      "bank_id",
                      "bank_name",
                      "account_number",
                      "account_holder_name",
                      "is_primary",
                      "qr_code_url",
                    ],
                    where: { is_primary: true },
                    required: false,
                  },
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
                    model: User,
                    as: "owner",
                    attributes: [
                      "user_id",
                      "full_name",
                      "email",
                      "phone_number",
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
                          "is_primary",
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
    const formattedData = refundData.map((cancellation) => {
      const renterBank = cancellation.booking.renter.banks?.[0] || null;
      const ownerBank = cancellation.booking.vehicle.owner.banks?.[0] || null;
      const totalAmount = Number(cancellation.booking.total_amount) || 0;
      const totalPaid = Number(cancellation.booking.total_paid) || 0;
      const cancellationFee = Number(cancellation.cancellation_fee) || 0;
      const ownerRefundAmount = Number(cancellation.total_refund_for_owner) || 0;
      const renterRefundAmount = Number(cancellation.total_refund_for_renter) || 0;
      const platformFeeAmount = Number(((cancellationFee * platformFeePercent) / 100).toFixed(2));

      return {
        cancellation_id: cancellation.cancellation_id,
        booking_id: cancellation.booking_id,
        cancellation_reason: cancellation.cancellation_reason,
        cancelled_by: cancellation.cancelled_by,
        cancelled_at: cancellation.cancelled_at,
        cancellation_fee: cancellation.cancellation_fee,
        created_at: cancellation.created_at,

        // Tóm tắt tài chính phục vụ hiển thị
        financial_summary: {
          total_amount: totalAmount,
          total_paid: totalPaid,
          cancellation_fee: cancellationFee,
          renter_refund_amount: renterRefundAmount,
          owner_compensation_amount: ownerRefundAmount,
          platform_fee_percent: platformFeePercent,
          platform_fee_amount: platformFeeAmount,
        },

        // Booking info
        booking_info: {
          booking_id: cancellation.booking.booking_id,
          start_date: cancellation.booking.start_date,
          end_date: cancellation.booking.end_date,
          total_amount: cancellation.booking.total_amount,
          total_paid: cancellation.booking.total_paid,
          status: cancellation.booking.status,
          created_at: cancellation.booking.created_at,
        },

        // Vehicle info
        vehicle_info: {
          vehicle_id: cancellation.booking.vehicle.vehicle_id,
          model: cancellation.booking.vehicle.model,
          license_plate: cancellation.booking.vehicle.license_plate,
          main_image_url: cancellation.booking.vehicle.main_image_url,
        },

        // Renter refund info
        renter_refund: {
          user_id: cancellation.booking.renter.user_id,
          full_name: cancellation.booking.renter.full_name,
          email: cancellation.booking.renter.email,
          phone_number: cancellation.booking.renter.phone_number,
          refund_amount: parseFloat(cancellation.total_refund_for_renter) || 0,
          refund_status: cancellation.refund_status_renter,
          refund_reason: cancellation.refund_reason_renter,
          refund_processed_at: cancellation.refund_processed_at_renter,
          bank_info: renterBank
            ? {
                bank_id: renterBank.bank_id,
                bank_name: renterBank.bank_name,
                account_number: renterBank.account_number,
                account_holder_name: renterBank.account_holder_name,
                qr_code_url: renterBank.qr_code_url,
              }
            : null,
        },

        // Owner refund info
        owner_refund: {
          user_id: cancellation.booking.vehicle.owner.user_id,
          full_name: cancellation.booking.vehicle.owner.full_name,
          email: cancellation.booking.vehicle.owner.email,
          phone_number: cancellation.booking.vehicle.owner.phone_number,
          refund_amount: parseFloat(cancellation.total_refund_for_owner) || 0,
          refund_status: cancellation.refund_status_owner,
          refund_processed_at: cancellation.refund_processed_at_owner,
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

    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách quản lý hoàn tiền thành công",
      data: {
        refunds: formattedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting refund management:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách quản lý hoàn tiền",
      error: error.message,
    });
  }
};
