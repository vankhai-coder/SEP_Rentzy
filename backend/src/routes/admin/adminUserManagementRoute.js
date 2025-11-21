import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { getUserManagementStats, getUsers, toggleUserActiveStatus } from "../../controllers/admin/adminUserManagementController.js";


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


// GET /api/admin/user-management-stats
router.get("/stats", getUserManagementStats);

// GET /api/admin/user-management/users
router.get("/users", getUsers);

// PATCH /api/admin/user-management/users/:userId/ban-unban
router.patch("/users/:userId/ban-unban", toggleUserActiveStatus);

export default router;
