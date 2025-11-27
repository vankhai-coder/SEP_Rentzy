import express from "express";
import {
  getOwnerVehicles,
  getOwnerVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  updateRequireOwnerConfirmation,
  getOwnerVehicleStats
} from "../../controllers/owner/ownerController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import upload from "../../middlewares/multerConfig.js";
import multer from "multer";
const router = express.Router();

const storage = multer.memoryStorage();
const upload1 = multer({ storage: storage });
// // Tất cả routes đều cần authentication
// router.use(authenticateToken);

// GET /api/owner/vehicles - Lấy danh sách xe của owner
router.get("/vehicles", verifyJWTToken, getOwnerVehicles);

// GET /api/owner/vehicles/stats - Lấy thống kê xe của owner
router.get("/vehicles/stats", verifyJWTToken, getOwnerVehicleStats);

// GET /api/owner/vehicles/:id - Lấy thông tin chi tiết xe
router.get("/vehicles/:id", verifyJWTToken, getOwnerVehicleById);

// POST /api/owner/vehicles - Thêm xe mới
router.post("/vehicles", verifyJWTToken, upload1.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'extra_images', maxCount: 10 },
]), createVehicle);

// PUT /api/owner/vehicles/:id - Cập nhật thông tin xe
router.put("/vehicles/:id", verifyJWTToken, upload1.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'extra_images', maxCount: 10 },
]), updateVehicle);

// PATCH /api/owner/vehicles/:id/status - Cập nhật trạng thái xe (available/blocked)
router.patch("/vehicles/:id/status", verifyJWTToken, updateVehicleStatus);

// PATCH /api/owner/vehicles/:id/confirmation - Bật/tắt yêu cầu chủ xe xác nhận đơn thuê
router.patch("/vehicles/:id/confirmation", verifyJWTToken, updateRequireOwnerConfirmation);

// DELETE /api/owner/vehicles/:id - Xóa xe
router.delete("/vehicles/:id", verifyJWTToken, deleteVehicle);

export default router;
