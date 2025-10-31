import express from "express";
import {
  getAllVehicles,
  searchVehicles,
  updateVehicleStatus,
} from "../../controllers/admin/adminManagementVehicleController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Temporarily disable authentication for testing (similar to approval vehicle route)
router.use(verifyJWTToken);

// Get all vehicles for admin management
router.get("/", getAllVehicles);

// Search vehicles
router.get("/search", searchVehicles);

// Update vehicle status (lock/unlock)
router.patch("/:vehicleId/status", updateVehicleStatus);

export default router;