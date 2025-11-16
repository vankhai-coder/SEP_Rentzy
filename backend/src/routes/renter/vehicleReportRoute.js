// routes/renter/vehicleReportRoute.js
import express from "express";
import {
  createVehicleReport,
  getVehicleReports,
  getMyVehicleReports,
} from "../../controllers/renter/vehicleReportController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js"; // Middleware xác thực

const router = express.Router();

// POST /api/renter/reports/vehicles/:vehicleId - Tạo báo cáo mới
router.post("/vehicles/:vehicle_id", verifyJWTToken, createVehicleReport);

// GET /api/renter/reports/vehicles/:vehicleId - Lấy danh sách báo cáo của xe
router.get("/vehicles/:vehicle_id", verifyJWTToken, getVehicleReports);

// GET /api/renter/reports/my?vehicle_id=xxx - Lấy báo cáo của user (tất cả nếu không có vehicle_id, hoặc filter theo xe nếu có)
router.get("/my", verifyJWTToken, getMyVehicleReports);

export default router;
