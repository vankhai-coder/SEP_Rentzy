import express from "express";
import {
  getPendingVehicles,
  approveVehicle,
  rejectVehicle,
  getApprovalStats,
  setAutoApproveFlag,
  getAutoApproveFlag,
} from "../../controllers/admin/adminApprovlVehicleController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyJWTToken); // Temporarily disabled for testing

// GET /api/admin/approval-vehicles - Lấy danh sách xe chờ duyệt
router.get("/", getPendingVehicles);

// GET /api/admin/approval-vehicles/stats - Thống kê xe theo trạng thái duyệt
router.get("/stats", getApprovalStats);

// PATCH /api/admin/approval-vehicles/auto-approve-flag - Bật/tắt tự động duyệt
router.patch("/auto-approve-flag", setAutoApproveFlag);

// GET /api/admin/approval-vehicles/auto-approve-flag - Lấy trạng thái tự động duyệt
router.get("/auto-approve-flag", getAutoApproveFlag);

// PATCH /api/admin/approval-vehicles/:id/approve - Chấp nhận xe
router.patch("/:id/approve", approveVehicle);

// PATCH /api/admin/approval-vehicles/:id/reject - Từ chối xe
router.patch("/:id/reject", rejectVehicle);

export default router;