import db from "../../models/index.js";
import { Op } from "sequelize";

const {
  Booking,
  BookingReview,
  Notification,
  Vehicle,
  User,
  Brand,
  BookingHandover,
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
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        bookings,
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

// 2. GET /api/owner/cancel-requests - Duyệt đơn hủy
export const getCancelRequests = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

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

    const { count, rows: cancelRequests } = await Booking.findAndCountAll({
      where: {
        vehicle_id: { [Op.in]: vehicleIds },
        status: "cancel_requested",
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
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        cancelRequests,
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
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hủy",
      });
    }

    // Cập nhật trạng thái thành canceled
    await booking.update({
      status: "canceled",
      updated_at: new Date(),
    });

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Yêu cầu hủy đã được duyệt",
      content: `Yêu cầu hủy đơn thuê xe ${booking.vehicle.model} đã được chủ xe duyệt.`,
      type: "rental",
      is_read: false,
    });

    res.json({
      success: true,
      message: "Đã duyệt yêu cầu hủy thành công",
    });
  } catch (error) {
    console.error("Error approving cancel request:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt yêu cầu hủy",
      error: error.message,
    });
  }
};

// PATCH /api/owner/cancel-requests/:id/reject - Từ chối yêu cầu hủy
export const rejectCancelRequest = async (req, res) => {
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
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu hủy",
      });
    }

    // Cập nhật trạng thái về confirmed (giữ nguyên đơn)
    await booking.update({
      status: "confirmed",
      updated_at: new Date(),
    });

    // Tạo thông báo cho renter
    await Notification.create({
      user_id: booking.renter_id,
      title: "Yêu cầu hủy bị từ chối",
      content: `Yêu cầu hủy đơn thuê xe ${booking.vehicle.model} đã bị chủ xe từ chối.`,
      type: "rental",
      is_read: false,
    });

    res.json({
      success: true,
      message: "Đã từ chối yêu cầu hủy",
    });
  } catch (error) {
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
