import express from "express";
import {
  approveRefund,
  rejectRefund,
  getRefundManagement,
} from "../../controllers/admin/adminCancelController.js";

const router = express.Router();

// GET /api/admin/refund-management - Lấy danh sách quản lý hoàn tiền với thông tin bank
router.get("/refund-management", getRefundManagement);

// POST /api/admin/refund-management/:id/approve - Duyệt hoàn tiền
router.post("/refund-management/:id/approve", approveRefund);

// POST /api/admin/refund-management/:id/reject - Từ chối hoàn tiền
router.post("/refund-management/:id/reject", rejectRefund);

export default router;
