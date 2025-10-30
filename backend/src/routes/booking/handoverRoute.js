import express from "express";
import {
  uploadMiddleware,
  confirmOwnerHandover,
  confirmRenterHandover,
} from "../../controllers/booking/handoverController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Owner upload và xác nhận bàn giao xe
router.post(
  "/:bookingId/confirm-owner-handover",
  verifyJWTToken,
  uploadMiddleware,
  confirmOwnerHandover
);
// renter xác nhận ảnh lúc giao xe từ chủ xe
router.post(
  "/:bookingId/confirm-renter-handover",
  verifyJWTToken,
  confirmRenterHandover
);

// owner xác nhận ảnh trả xe và xác nhận nhận lại xe

export default router;
