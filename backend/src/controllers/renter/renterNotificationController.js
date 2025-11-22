import db from "../../models/index.js";
const { Notification } = db;

// GET /api/renter/notifications - Lấy danh sách thông báo của renter
export const getRenterNotifications = async (req, res) => {
  try {
    const renterId = req.user.userId;
    const { page = 1, limit = 10, is_read } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = { user_id: renterId };

    // Filter theo trạng thái đọc nếu có truyền rõ ràng true/false
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

    const unreadCount = await Notification.count({
      where: {
        user_id: renterId,
        is_read: false,
      },
    });

    return res.json({
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
    console.error("Error getting renter notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

// PATCH /api/renter/notifications/:id/read - Đánh dấu thông báo là đã đọc
export const markRenterNotificationAsRead = async (req, res) => {
  try {
    const renterId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: renterId,
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

    return res.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking renter notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

// PATCH /api/renter/notifications/mark-all-read - Đánh dấu tất cả đã đọc
export const markAllRenterNotificationsAsRead = async (req, res) => {
  try {
    const renterId = req.user.userId;

    await Notification.update(
      { is_read: true, updated_at: new Date() },
      { where: { user_id: renterId, is_read: false } }
    );

    return res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Error marking all renter notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};