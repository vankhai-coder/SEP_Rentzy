
import express from 'express';
import { verifyJWTToken } from '../../middlewares/authMiddleware.js';
import { getBookingStatusStats, getPayoutStatusStats, getRevenueStatsForCompletedBookingInNumberOfMonths } from '../../controllers/admin/adminRevenueController.js';

const router = express.Router();


// // // check JWT token for all admin overview dashboard routes : 
// router.use(verifyJWTToken);

// // // check admin role for all admin overview dashboard routes :
// router.use((req, res, next) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Access denied. Admins only." });
//     }
//     next();
// });

// all routes below are protected and only accessible by admin users :


// GET /api/admin/revenue/revenue-stats?months=6
router.get('/revenue-stats', getRevenueStatsForCompletedBookingInNumberOfMonths);

// GET /api/admin/revenue/booking-status-count
router.get('/booking-status-count', getBookingStatusStats);

// GET /api/admin/revenue/booking-payouts
router.get('/booking-payouts', getPayoutStatusStats);


export default router;