// src/controllers/renter/bookingHistoryController.js
import Booking from "../../models/Booking.js";
import BookingReview from "../../models/BookingReview.js";
import Vehicle from "../../models/Vehicle.js";

export const getBookingHistory = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {
      renter_id: req.user.userId, // Lấy từ JWT token (req.user.userId)
    };

    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "Vehicle",
          required: true,
          attributes: ["model", "license_plate"], // ❌ Không lấy brand
        },
        {
          model: BookingReview,
          as: "review",
          required: false,
          attributes: ["review_id", "rating", "review_content", "created_at"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Format dữ liệu trả về cho frontend
    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking.booking_id,
      vehicle: `${booking.Vehicle.model} (${booking.Vehicle.license_plate})`, // ✅ Không có brand
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_amount: parseFloat(booking.total_amount),
      total_paid: parseFloat(booking.total_paid),
      remaining: parseFloat(booking.total_amount - booking.total_paid),
      status: booking.status,
      hasReview: !!booking.review,
      review: booking.review
        ? {
            rating: booking.review.rating,
            review_content: booking.review.review_content,
            created_at: booking.review.created_at,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedBookings,
      message: "Lấy danh sách lịch sử đơn hàng thành công",
    });
  } catch (error) {
    console.error("Error in getBookingHistory:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách lịch sử đơn hàng",
    });
  }
};

export const getAllStatuses = async (req, res) => {
  try {
    const statuses = Object.values(Booking.rawAttributes.status.values);
    res.status(200).json({
      success: true,
      data: statuses,
      message: "Lấy danh sách tất cả trạng thái thành công",
    });
  } catch (error) {
    console.error("Error in getAllStatuses:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách trạng thái",
    });
  }
};
