import Booking from "../../models/Booking.js";
import BookingReview from "../../models/BookingReview.js";
import Vehicle from "../../models/Vehicle.js";

export const getBookingHistory = async (req, res) => {
  try {
    const { status, sortBy = "start_date" } = req.query; // ✅ Thêm query param 'sortBy' để linh hoạt: 'created_at' (mặc định cũ), 'start_date' (ngày nhận xe), 'booking_id' (mã đơn)
    const whereClause = {
      renter_id: req.user.userId, // Lấy từ JWT token (req.user.userId)
    };

    if (status) {
      whereClause.status = status;
    }

    // ✅ Xây dựng order clause dựa trên sortBy (mặc định: start_date DESC - sắp xếp theo ngày nhận xe gần nhất trước, tránh lộn xộn)
    let orderClause = [["start_date", "DESC"]];
    if (sortBy === "created_at") {
      orderClause = [["created_at", "DESC"]];
    } else if (sortBy === "booking_id") {
      orderClause = [["booking_id", "DESC"]]; // Mã đơn mới nhất trước (hoặc ASC nếu muốn cũ nhất)
    } // Else: giữ start_date DESC

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle", // ✅ Sửa alias từ "Vehicle" (uppercase) thành "vehicle" (lowercase) để khớp với association trong models/index.js (tránh SequelizeEagerLoadingError)
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
      order: orderClause, // ✅ Áp dụng order động
    });

    // Format dữ liệu trả về cho frontend
    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking.booking_id,
      vehicle: `${booking.vehicle.model} (${booking.vehicle.license_plate})`, // ✅ Sửa từ booking.Vehicle thành booking.vehicle (lowercase)
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
      sortBy: sortBy, // ✅ Trả về info sort để FE biết (optional)
    });
  } catch (error) {
    console.error("Error in getBookingHistory:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách lịch sử đơn hàng",
    });
  }
};

// ✅ THÊM MỚI: Lấy chi tiết một booking (cho trang review)
export const getBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.params; // booking_id từ URL params
    const renter_id = req.user.userId; // Từ JWT

    // Tìm booking theo ID và renter_id (chỉ cho phép xem booking của mình)
    const booking = await Booking.findOne({
      where: { booking_id: bookingId, renter_id },
      include: [
        {
          model: Vehicle,
          as: "vehicle", // ✅ Sửa alias từ "Vehicle" (uppercase) thành "vehicle" (lowercase) để khớp với association
          required: true,
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
          ], // Lấy thêm fields cần cho detail
        },
        {
          model: BookingReview,
          as: "review",
          required: false,
          attributes: ["review_id", "rating", "review_content", "created_at"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn thuê này hoặc bạn không có quyền truy cập.",
      });
    }

    // Format data cho frontend: { booking, vehicle, review }
    const formattedData = {
      booking: {
        booking_id: booking.booking_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: parseFloat(booking.total_amount),
        status: booking.status,
        // Thêm fields khác nếu cần
      },
      vehicle: booking.vehicle, // ✅ Sửa từ booking.Vehicle thành booking.vehicle (lowercase)
      review: booking.review
        ? {
            rating: booking.review.rating,
            review_content: booking.review.review_content,
            created_at: booking.review.created_at,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
      message: "Lấy chi tiết đơn thuê thành công",
    });
  } catch (error) {
    console.error("Error in getBookingDetail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn thuê",
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
