import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  createPayOSLink,
  handlePayOSWebhook,
  createPayOSLinkForRemaining,
  cancelPayOSTransaction,
  paymentByCash,
  approveRemainingByOwner,
  createPayOSLinkForTrafficFine,
} from "../../controllers/payment/paymentController.js";

const router = express.Router();

// PayOS Payment Route
router.post("/payos/link", verifyJWTToken, createPayOSLink);
// PayOS Remaining Payment Route
router.post(
  "/payos/remaining-link",
  verifyJWTToken,
  createPayOSLinkForRemaining
);
// PayOS Traffic Fine Payment Route
router.post(
  "/payos/traffic-fine-link",
  verifyJWTToken,
  createPayOSLinkForTrafficFine
);
// PayOS Cancel Transaction Route
router.post("/payos/cancel", verifyJWTToken, cancelPayOSTransaction);
// PayOS Webhook Route
router.post("/payos/webhook", handlePayOSWebhook);
// thanh toán phần tiền còn lại ngoài hệ thống
router.patch("/byCash/:bookingId", verifyJWTToken, paymentByCash);

// owner xác nhận  thanh toán phần tiền còn lại ngoài hệ thống
router.patch(
  "/approveRemainingByOwner/:bookingId",
  verifyJWTToken,
  approveRemainingByOwner
);

export default router;
