import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../controllers/admin/adminNotificationController.js";

const router = express.Router();

// Check JWT token for all admin notification routes
router.use(verifyJWTToken);

// Check admin role for all admin notification routes
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

// All routes below are protected and only accessible by admin users

// GET /api/admin/notifications
router.get("/", getAdminNotifications);

// PATCH /api/admin/notifications/:id/read
router.patch("/:id/read", markNotificationAsRead);

// PATCH /api/admin/notifications/mark-all-read
router.patch("/mark-all-read", markAllNotificationsAsRead);

export default router;

