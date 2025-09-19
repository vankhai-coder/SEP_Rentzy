import express from "express";
import {
  getAllVehicles,
  getVehicleById,
} from "../../controllers/renter/vehicleController.js";

const router = express.Router();

// Lấy danh sách phương tiện
router.get("/", getAllVehicles);

// Lấy chi tiết 1 phương tiện
router.get("/:id", getVehicleById);

export default router;
