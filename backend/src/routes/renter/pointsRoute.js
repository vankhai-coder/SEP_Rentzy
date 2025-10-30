// routes/renter/pointsRoute.js
import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { getPointsHistory } from "../../controllers/renter/pointsController.js";

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(verifyJWTToken);

// GET /api/renter/points/history - Lấy lịch sử giao dịch điểm
router.get("/history", getPointsHistory);

export default router;
