import db from "../../models/index.js";

const { Notification } = db;

// GET /api/admin/notifications - Lấy danh sách thông báo của admin
export const getAdminNotifications = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { page = 1, limit = 10, is_read } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = { user_id: adminId };

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
        user_id: adminId,
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
    console.error("Error getting admin notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

// PATCH /api/admin/notifications/:id/read - Đánh dấu đã đọc
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: adminId,
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

    // Đếm lại số thông báo chưa đọc
    const unreadCount = await Notification.count({
      where: {
        user_id: adminId,
        is_read: false,
      },
    });

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
      data: {
        unreadCount,
      },
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

// PATCH /api/admin/notifications/mark-all-read - Đánh dấu tất cả đã đọc
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.user.userId;

    await Notification.update(
      {
        is_read: true,
        updated_at: new Date(),
      },
      {
        where: {
          user_id: adminId,
          is_read: false,
        },
      }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
      data: {
        unreadCount: 0,
      },
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

