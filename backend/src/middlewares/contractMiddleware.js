import db from "../models/index.js";

// Middleware: Yêu cầu hợp đồng đã được ký đầy đủ bởi cả renter và owner
export const requireContractFullySigned = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { userId, role } = req.user || {};

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu bookingId trong đường dẫn",
      });
    }

    // Lấy booking và kiểm tra quyền truy cập (đối với owner)
    const booking = await db.Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: db.Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    if (role === "owner" && booking?.vehicle?.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền với booking này",
      });
    }

    // Lấy hợp đồng gắn với booking
    const contract = await db.BookingContract.findOne({
      where: { booking_id: bookingId },
    });

    if (!contract) {
      return res.status(400).json({
        success: false,
        message: "Chưa tạo hợp đồng DocuSign cho booking này",
      });
    }

    const signedByRenter = !!contract.renter_signed_at;
    const signedByOwner = !!contract.owner_signed_at;
    const status = contract.contract_status;

    // Cho phép nếu trạng thái là completed hoặc cả hai bên đã ký
    const fullySigned = (signedByRenter && signedByOwner) || status === "completed" || status === "signed";

    if (!fullySigned) {
      return res.status(400).json({
        success: false,
        message: "Hợp đồng chưa được ký đầy đủ bởi hai bên",
        detail: {
          renter_signed_at: contract.renter_signed_at,
          owner_signed_at: contract.owner_signed_at,
          contract_status: contract.contract_status,
        },
      });
    }

    // Đính kèm thông tin hợp đồng vào req (nếu cần dùng ở controller)
    req.bookingContract = contract;
    next();
  } catch (error) {
    console.error("requireContractFullySigned error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra trạng thái hợp đồng",
      error: error.message,
    });
  }
};

export default requireContractFullySigned;