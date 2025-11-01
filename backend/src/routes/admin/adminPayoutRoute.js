import express from "express";
import {
  approvePayout,
  rejectPayout,
  getPayoutManagement,
} from "../../controllers/admin/adminPayoutController.js";

const router = express.Router();

// GET /api/admin/payout-management - Lấy danh sách quản lý thanh toán với thông tin bank (legacy)
router.get("/payout-management", getPayoutManagement);

// GET /api/admin/payouts - Lấy danh sách quản lý thanh toán với thông tin bank (new endpoint)
router.get("/payouts", getPayoutManagement);

// POST /api/admin/payout-management/:id/approve - Duyệt thanh toán (legacy)
router.post("/payout-management/approve/:id", approvePayout);

// PUT /api/admin/payouts/:id/approve - Duyệt thanh toán (new endpoint)
router.put("/payouts/:id/approve", approvePayout);

// POST /api/admin/payout-management/:id/reject - Từ chối thanh toán (legacy)
router.post("/payout-management/reject/:id", rejectPayout);

// PUT /api/admin/payouts/:id/reject - Từ chối thanh toán (new endpoint)
router.put("/payouts/:id/reject", rejectPayout);

export default router;
