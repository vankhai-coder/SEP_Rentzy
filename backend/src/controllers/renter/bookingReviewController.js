// controllers/renter/bookingReviewController.js
import db from "../../models/index.js";

const { Booking, BookingReview, Vehicle } = db;

export const createBookingReview = async (req, res) => {
  try {
    const { booking_id, rating, review_content } = req.body;
    const renter_id = req.user.userId; // từ verifyJWTToken middleware

    // 1️⃣ Kiểm tra thông tin đầu vào
    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (booking_id, rating)",
      });
    }

    // 2️⃣ Kiểm tra booking có tồn tại và thuộc về renter này
    const booking = await Booking.findOne({
      where: { booking_id, renter_id },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn thuê này." });
    }

    // 3️⃣ Kiểm tra trạng thái booking (phải completed)
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá sau khi đơn thuê đã hoàn tất.",
      });
    }

    // 4️⃣ Kiểm tra xem đã đánh giá đơn này chưa
    const existingReview = await BookingReview.findOne({
      where: { booking_id },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá đơn thuê này rồi.",
      });
    }

    // 5️⃣ Tạo review
    const newReview = await BookingReview.create({
      booking_id,
      rating,
      review_content,
    });

    // 6️⃣ Lấy thông tin xe để phản hồi cho FE (nếu cần)
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: booking.vehicle_id },
      attributes: ["vehicle_id", "model", "main_image_url", "owner_id"],
    });

    res.status(201).json({
      success: true,
      message: "Đánh giá thành công!",
      review: newReview,
      vehicle,
    });
  } catch (error) {
    console.error("❌ Error creating booking review:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá.",
    });
  }
};

// Lấy tất cả review của 1 xe (để hiện ở View xe)
export const getReviewsByVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.params;

    const reviews = await BookingReview.findAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { vehicle_id },
          attributes: ["vehicle_id", "renter_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy đánh giá." });
  }
};
