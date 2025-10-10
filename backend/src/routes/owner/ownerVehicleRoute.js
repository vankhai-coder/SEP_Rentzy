import express from "express";
import {
  getOwnerVehicles,
  getOwnerVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getOwnerVehicleStats
} from "../../controllers/owner/ownerController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// // Tất cả routes đều cần authentication
// router.use(authenticateToken);

// GET /api/owner/vehicles - Lấy danh sách xe của owner
router.get("/vehicles", verifyJWTToken, getOwnerVehicles);

// GET /api/owner/vehicles/stats - Lấy thống kê xe của owner
router.get("/vehicles/stats", verifyJWTToken, getOwnerVehicleStats);

// GET /api/owner/vehicles/:id - Lấy thông tin chi tiết xe
router.get("/vehicles/:id", verifyJWTToken, getOwnerVehicleById);

// POST /api/owner/vehicles - Thêm xe mới
router.post("/vehicles", verifyJWTToken, createVehicle);

// PUT /api/owner/vehicles/:id - Cập nhật thông tin xe
router.put("/vehicles/:id", verifyJWTToken, updateVehicle);

// PATCH /api/owner/vehicles/:id/status - Cập nhật trạng thái xe (available/blocked)
router.patch("/vehicles/:id/status", verifyJWTToken, updateVehicleStatus);

// DELETE /api/owner/vehicles/:id - Xóa xe
router.delete("/vehicles/:id", verifyJWTToken, deleteVehicle);

export default router;
