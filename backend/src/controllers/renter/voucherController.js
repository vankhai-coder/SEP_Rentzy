import { Op } from "sequelize";
import Voucher from "../../models/Voucher.js";
import Booking from "../../models/Booking.js";

/**
 * GET /api/renter/vouchers/unused
 * Trả về tất cả voucher mà người dùng CHƯA sử dụng.
 * Loại trừ những voucher đã xuất hiện trong booking của người dùng.
 */
export const getUnusedVouchersForUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Lấy các mã voucher người dùng đã dùng trong tất cả booking
    const userBookings = await Booking.findAll({
      where: {
        renter_id: userId,
        voucher_code: { [Op.ne]: null },
      },
      attributes: ["voucher_code"],
      raw: true,
    });

    const usedCodes = Array.from(
      new Set(
        userBookings
          .map((b) => b.voucher_code)
          .filter((code) => typeof code === "string" && code.length > 0)
      )
    );

    // Lấy các voucher còn hiệu lực và chưa bị user này dùng
    const now = new Date();
    const where = {
      is_active: true,
      valid_from: { [Op.lte]: now },
      valid_to: { [Op.gte]: now },
    };

    if (usedCodes.length > 0) {
      where.code = { [Op.notIn]: usedCodes };
    }

    const vouchers = await Voucher.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: vouchers,
      meta: {
        count: vouchers.length,
        excluded_codes: usedCodes,
      },
    });
  } catch (error) {
    console.error("Error fetching unused vouchers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy voucher chưa dùng",
      error: error.message,
    });
  }
};