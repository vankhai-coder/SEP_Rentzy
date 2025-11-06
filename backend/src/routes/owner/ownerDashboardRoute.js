import express from "express";
import {
  getOwnerBookings,
  getBookingDetail,
  getCancelRequests,
  getCancelledBookings,
  approveCancelRequest,
  rejectCancelRequest,
  getOwnerRevenue,
  getOwnerTransactions,
  getVehicleReviews,
  getOwnerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  searchTrafficFine,
  getTrafficFineCaptcha,
} from "../../controllers/owner/ownerDashboardController.js";
import { createOwner } from "../../controllers/auth/createOwner.js";
import { createTestData } from "../../controllers/auth/createTestData.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Test endpoint không cần authentication
router.get("/test", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});

// Tạo tài khoản owner (không cần authentication)
router.post("/create-owner", createOwner);

// Tạo dữ liệu test (không cần authentication)
router.post("/create-test-data/:ownerId", createTestData);

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyJWTToken);

// 1. Quản lý đơn thuê
router.get("/bookings", getOwnerBookings);
// xem chi tiết xe
router.get("/bookings/detail/:id", getBookingDetail);

// 2. Duyệt đơn hủy
router.get("/cancel-requests", getCancelRequests);
router.patch("/cancel-requests/:id/approve", approveCancelRequest);
router.patch("/cancel-requests/:id/reject", rejectCancelRequest);

// 2.1. Xem danh sách booking đã hủy với thông tin tiền hoàn
router.get("/cancelled-bookings", getCancelledBookings);

// 3. Doanh thu
router.get("/revenue", getOwnerRevenue);

// Transactions endpoint
router.get("/transactions", getOwnerTransactions);

// 4. Đánh giá về xe
router.get("/vehicle-reviews", getVehicleReviews);

// 5. Thông báo
router.get("/notifications", getOwnerNotifications);
router.patch("/notifications/:id/read", markNotificationAsRead);
router.patch("/notifications/mark-all-read", markAllNotificationsAsRead);

// 6. Tra cứu phạt nguội
router.get("/traffic-fine-search/captcha", getTrafficFineCaptcha);
router.post("/traffic-fine-search", searchTrafficFine);

export default router;
