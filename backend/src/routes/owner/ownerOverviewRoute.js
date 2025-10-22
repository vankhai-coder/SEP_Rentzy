import express from "express";
import {
  getOverviewStats,
  getRevenueChart,
  getTopRenters,
  getTopVehicles
} from "../../controllers/owner/ownerOverViewController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Test endpoint không cần authentication
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Overview API is working!" });
});

// API lấy thống kê tổng quan (tạm thời bỏ auth để test)
router.get("/stats", getOverviewStats);

// API lấy dữ liệu biểu đồ doanh thu (tạm thời bỏ auth để test)
router.get("/revenue-chart", getRevenueChart);

// API lấy danh sách người thuê hàng đầu (tạm thời bỏ auth để test)
router.get("/top-renters", getTopRenters);

// API lấy danh sách xe được thuê nhiều nhất (tạm thời bỏ auth để test)
router.get("/top-vehicles", getTopVehicles);

export default router;