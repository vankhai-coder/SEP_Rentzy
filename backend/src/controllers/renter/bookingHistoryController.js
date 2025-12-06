import Booking from "../../models/Booking.js";
import BookingReview from "../../models/BookingReview.js";
import Vehicle from "../../models/Vehicle.js";
import { Op } from "sequelize";

export const getBookingHistory = async (req, res) => {
  try {
    const {
      status,
      sortBy = "created_at",
      sortOrder = "DESC",
      dateFilter = "all",
      page = 1,
      limit = 10,
    } = req.query;

    const baseWhereClause = {
      renter_id: req.user.userId, // Lấy từ JWT token (req.user.userId)
    };

    // Tính toán thống kê tổng quan (không phụ thuộc vào filter)
    const [
      totalBookings,
      completedBookings,
      activeBookings,
      cancelledBookings,
    ] = await Promise.all([
      // Tổng số đơn
      Booking.count({
        where: baseWhereClause,
      }),
      // Tổng đơn đã hoàn thành
      Booking.count({
        where: {
          ...baseWhereClause,
          status: "completed",
        },
      }),
      // Tổng đơn đang thuê (confirmed, in_progress)
      Booking.count({
        where: {
          ...baseWhereClause,
          status: {
            [Op.in]: ["in_progress"],
          },
        },
      }),
      // Tổng đơn đã hủy
      Booking.count({
        where: {
          ...baseWhereClause,
          status: "canceled",
        },
      }),
    ]);

    // Tạo where clause cho việc lọc dữ liệu
    const whereClause = { ...baseWhereClause };

    // Filter by status
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Filter by date
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          whereClause.created_at = {
            [Op.gte]: startDate,
          };
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          whereClause.created_at = {
            [Op.gte]: startDate,
          };
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          whereClause.created_at = {
            [Op.gte]: startDate,
          };
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          whereClause.created_at = {
            [Op.gte]: startDate,
          };
          break;
      }
    }

    // Build order clause
    let orderClause = [["created_at", sortOrder.toUpperCase()]];
    if (sortBy === "start_date") {
      orderClause = [["start_date", sortOrder.toUpperCase()]];
    } else if (sortBy === "booking_id") {
      orderClause = [["booking_id", sortOrder.toUpperCase()]];
    } else if (sortBy === "total_amount") {
      orderClause = [["total_amount", sortOrder.toUpperCase()]];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          required: true,
          attributes: [
            "vehicle_id",
            "model",
            "license_plate",
            "main_image_url",
            "brand_id",
            "year",
            "vehicle_type",
          ],
        },
        {
          model: BookingReview,
          as: "review",
          required: false,
          attributes: ["review_id", "rating", "review_content", "created_at"],
        },
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
    });

    // Format dữ liệu trả về cho frontend với đầy đủ thông tin
    const formattedBookings = bookings.map((booking) => ({
      booking_id: booking.booking_id,
      vehicle: {
        vehicle_id: booking.vehicle.vehicle_id,
        model: booking.vehicle.model,
        license_plate: booking.vehicle.license_plate,
        main_image_url: booking.vehicle.main_image_url,
        brand_id: booking.vehicle.brand_id,
        year: booking.vehicle.year,
        vehicle_type: booking.vehicle.vehicle_type,
      },
      start_date: booking.start_date,
      start_time: booking.start_time,
      end_date: booking.end_date,
      end_time: booking.end_time,
      total_amount: parseFloat(booking.total_amount || 0),
      total_paid: parseFloat(booking.total_paid || 0),
      remaining_amount: parseFloat(
        (booking.total_amount || 0) - (booking.total_paid || 0)
      ),
      total_cost: parseFloat(booking.total_cost || 0),
      discount_amount: parseFloat(booking.discount_amount || 0),
      delivery_fee: parseFloat(booking.delivery_fee || 0),
      status: booking.status,
      pickup_location: booking.pickup_location,
      return_location: booking.return_location,
      special_requests: booking.special_requests,
      hasReview: !!booking.review,
      review: booking.review
        ? {
            review_id: booking.review.review_id,
            rating: booking.review.rating,
            review_content: booking.review.review_content,
            created_at: booking.review.created_at,
          }
        : null,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      success: true,
      data: formattedBookings,
      statistics: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        active_bookings: activeBookings,
        cancelled_bookings: cancelledBookings,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      filters: {
        status,
        sortBy,
        sortOrder,
        dateFilter,
      },
      message: "Lấy danh sách lịch sử đơn hàng và thống kê thành công",
    });
  } catch (error) {
    console.error("Error in getBookingHistory:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách lịch sử đơn hàng",
    });
  }
};

//Lấy chi tiết một booking (cho trang review)
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
        start_time: booking.start_time,
        end_date: booking.end_date,
        end_time: booking.end_time,
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
