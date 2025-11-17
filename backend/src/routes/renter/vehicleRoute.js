import express from "express";
import {
  getAllVehicles,
  getVehicleById,
} from "../../controllers/renter/vehicleController.js";
import { softAuth } from "../../middlewares/softAuthMiddleware.js"; // Thêm
const router = express.Router();

// Lấy danh sách phương tiện
router.get("/", getAllVehicles);

// Lấy chi tiết 1 phương tiện (có thể đăng nhập hoặc không)
router.get("/:id", softAuth, getVehicleById);

export default router;
