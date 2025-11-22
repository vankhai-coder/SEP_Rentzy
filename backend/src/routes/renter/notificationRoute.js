import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getRenterNotifications,
  markRenterNotificationAsRead,
  markAllRenterNotificationsAsRead,
} from "../../controllers/renter/renterNotificationController.js";

const router = express.Router();

// Yêu cầu đăng nhập cho toàn bộ routes
router.use(verifyJWTToken);

// Lấy danh sách thông báo
router.get("/", getRenterNotifications);

// Đánh dấu 1 thông báo là đã đọc
router.patch("/:id/read", markRenterNotificationAsRead);

// Đánh dấu tất cả thông báo là đã đọc
router.patch("/mark-all-read", markAllRenterNotificationsAsRead);

export default router;