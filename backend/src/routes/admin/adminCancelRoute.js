import express from "express";
import {
  getRefundRequests,
  approveRefund,
  rejectRefund,
} from "../../controllers/admin/adminController.js";
import { checkUserBankAccount } from "../../middlewares/bankAccountMiddleware.js";

const router = express.Router();

// GET /api/admin/refund-requests - Lấy danh sách yêu cầu hoàn tiền
router.get("/refund-requests", getRefundRequests);

// PATCH /api/admin/refund-requests/:id/approve - Duyệt hoàn tiền
router.patch(
  "/refund-requests/:id/approve",
  checkUserBankAccount,
  approveRefund
);

// PATCH /api/admin/refund-requests/:id/reject - Từ chối hoàn tiền
router.patch("/refund-requests/:id/reject", rejectRefund);

export default router;
