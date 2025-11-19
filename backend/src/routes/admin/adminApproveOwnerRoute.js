import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { approveOwnerRequest, getOwnerApprovalRequestsWithFilter, getOwnerApprovalStats, rejectOwnerRequest } from "../../controllers/admin/adminApproveOwnerController.js";


const router = express.Router();

// // check JWT token for all admin overview dashboard routes : 
router.use(verifyJWTToken);

// // check admin role for all admin overview dashboard routes :
router.use((req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
});

// all routes below are protected and only accessible by admin users :


// GET /api/admin/owner-approval/stats
router.get("/stats", verifyJWTToken, getOwnerApprovalStats);

// GEt /api/admin/owner-approval/requests
router.get("/requests", verifyJWTToken, getOwnerApprovalRequestsWithFilter);

// POST /api/admin/owner-approval/approve
router.post("/approve", verifyJWTToken, approveOwnerRequest);

// POST /api/admin/owner-approval/reject
router.post("/reject", verifyJWTToken, rejectOwnerRequest);

export default router;
