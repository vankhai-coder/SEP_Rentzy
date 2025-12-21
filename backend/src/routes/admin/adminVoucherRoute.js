import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { createVoucher, getVoucherManagementStats, getVouchersWithFilter, toggleVoucherActiveStatus, updateVoucher } from "../../controllers/admin/adminVoucherController.js";


const router = express.Router();

// // check JWT token for all admin overview dashboard routes : 
router.use(verifyJWTToken);

// // check admin role for all admin overview dashboard routes :
// router.use((req, res, next) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Access denied. Admins only." });
//     }
//     next();
// });

// all routes below are protected and only accessible by admin users :

// GET /api/admin/voucher-management/stats
router.get("/stats", getVoucherManagementStats);

// GET /api/admin/voucher-management/vouchers
router.get("/vouchers", getVouchersWithFilter);

// PATCH /api/admin/voucher-management/ban-unban
router.patch("/ban-unban", toggleVoucherActiveStatus);

// POST /api/admin/voucher-management/create
router.post("/create", createVoucher);

// PATCH /api/admin/voucher-management/update
router.patch("/update", updateVoucher);

export default router;
