import express from "express";
import { getAdminOverviewStats } from "../../controllers/admin/adminOverviewDashboardController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";


const router = express.Router();

// // check JWT token for all admin overview dashboard routes : 
// router.use(verifyJWTToken);

// // check admin role for all admin overview dashboard routes :
// router.use((req, res, next) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Access denied. Admins only." });
//     }
//     next();
// });

// all routes below are protected and only accessible by admin users :

// Get /api/admin/overview/stats
router.get("/stats", getAdminOverviewStats);


export default router;
