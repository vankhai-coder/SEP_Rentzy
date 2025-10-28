import express from "express";
import {
  uploadPreRentalImages,
  confirmHandoverByOwner,
  confirmPreRentalImagesByRenter,
  deletePreRentalImage,
  uploadPostRentalImages,
  confirmReturnByOwner,
  confirmPostRentalImagesByRenter,
  deletePostRentalImage,
  getHandoverStatus,
  uploadMiddleware,
} from "../../controllers/booking/handoverController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// 1. Owner upload ảnh xe trước khi bàn giao
router.post(
  "/:bookingId/upload-pre-rental-images",
  verifyJWTToken,
  uploadMiddleware,
  uploadPreRentalImages
);
// 2. Owner xác nhận bàn giao xe
router.post(
  "/:bookingId/confirm-handover-by-owner",
  verifyJWTToken,
  confirmHandoverByOwner
);
// 3. Renter xác nhận ảnh xe và nhận xe
router.post(
  "/:bookingId/confirm-pre-rental-images-by-renter",
  verifyJWTToken,
  confirmPreRentalImagesByRenter
);

// Delete pre-rental image
router.delete(
  "/:bookingId/delete-image/:imageIndex",
  verifyJWTToken,
  deletePreRentalImage
);

//  ảnh sau trả xe
// 5. Owner upload ảnh xe sau khi trả lại
router.post(
  "/:bookingId/upload-post-rental-images",
  verifyJWTToken,
  uploadMiddleware,
  uploadPostRentalImages
);

// 6. Owner xác nhận nhận lại xe
router.post(
  "/:bookingId/confirm-return-by-owner",
  verifyJWTToken,
  confirmReturnByOwner
);

// 7. Renter xác nhận ảnh xe sau khi trả lại
router.post(
  "/:bookingId/confirm-post-rental-images-by-renter",
  verifyJWTToken,
  confirmPostRentalImagesByRenter
);

// 8. Route này đã được thay thế bằng /:bookingId/handover-detail

// Delete post-rental image
router.delete(
  "/:bookingId/delete-post-rental-image/:imageIndex",
  verifyJWTToken,
  deletePostRentalImage
);

// ==================== UTILITY ROUTES ====================

// Lấy thông tin tổng quan handover
router.get("/:bookingId/status", verifyJWTToken, getHandoverStatus);

export default router;
