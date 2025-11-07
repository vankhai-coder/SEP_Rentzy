import express from "express";
import {
  getOverviewStats,
  getRevenueChart,
  getTopRenters,
  getTopVehicles,
  getTopVehiclesRentalHistory
} from "../../controllers/owner/ownerOverViewController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Test endpoint không cần authentication
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Overview API is working!" });
});


router.use(verifyJWTToken);

// API lấy thống kê tổng quan
router.get("/stats", getOverviewStats);

// API lấy dữ liệu biểu đồ doanh thu
router.get("/revenue-chart", getRevenueChart);

// API lấy danh sách người thuê hàng đầu
router.get("/top-renters", getTopRenters);

// API lấy danh sách xe được thuê nhiều nhất
router.get("/top-vehicles", getTopVehicles);
//API lấy lịch sử thuê xe của các xe được thuê nhiều nhất
router.get("/top-vehicles/rental-history", getTopVehiclesRentalHistory);

export default router;