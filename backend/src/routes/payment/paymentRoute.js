import express from 'express';
import { verifyJWTToken } from '../../middlewares/authMiddleware.js';
import {
    createPayOSLink,
    handlePayOSWebhook,
    createPayOSLinkForRemaining,
    forceRefreshPayment
} from '../../controllers/payment/paymentController.js';

const router = express.Router();

// PayOS Payment Route
router.post('/payos/link', verifyJWTToken, createPayOSLink);
// PayOS Remaining Payment Route
router.post('/payos/remaining-link', verifyJWTToken, createPayOSLinkForRemaining);
// PayOS Force Refresh Payment Session Route
router.post('/payos/force-refresh', verifyJWTToken, forceRefreshPayment);
// PayOS Webhook Route
router.post('/payos/webhook', handlePayOSWebhook);

export default router;