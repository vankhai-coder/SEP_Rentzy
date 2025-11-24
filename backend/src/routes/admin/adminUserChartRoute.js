
import express from 'express';
import { getApprovedOwnerStatus, getNewRegisterUserDataByMonth, getUserCountByRole } from '../../controllers/admin/adminUserChartController.js';
import { verifyJWTToken } from '../../middlewares/authMiddleware.js';

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


// GET /api/admin/user-chart/new-registrations?months=6
router.get('/new-registrations', getNewRegisterUserDataByMonth);

// GET /api/admin/user-chart/user-count-by-role
router.get('/user-count-by-role', getUserCountByRole);

// GET /api/admin/user-chart/owner-count-by-status
router.get('/owner-count-by-status', getApprovedOwnerStatus);

export default router;