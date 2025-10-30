import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  createPayOSLink,
  handlePayOSWebhook,
  createPayOSLinkForRemaining,
  cancelPayOSTransaction,
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
// PayOS Cancel Transaction Route
router.post("/payos/cancel", verifyJWTToken, cancelPayOSTransaction);
// PayOS Webhook Route
router.post("/payos/webhook", handlePayOSWebhook);

export default router;
