import express from "express";
import {
  uploadMiddleware,
  confirmOwnerHandover,
  confirmRenterHandover,
  confirmOwnerReturn,
  confirmRenterReturn,
} from "../../controllers/booking/handoverController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { requireContractFullySigned } from "../../middlewares/contractMiddleware.js";

const router = express.Router();

// Owner upload và xác nhận bàn giao xe
router.post(
  "/:bookingId/confirm-owner-handover",
  verifyJWTToken,
  requireContractFullySigned,
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
router.post(
  "/:bookingId/confirm-owner-return",
  verifyJWTToken,
  uploadMiddleware,
  confirmOwnerReturn
);
// renter xác nhận ảnh trả xe
router.post(
  "/:bookingId/confirm-renter-return",
  verifyJWTToken,
  confirmRenterReturn
);

export default router;
