import express from "express";
import CompareVehicleController from "../../controllers/renter/compareVehicleController.js";
const router = express.Router();

// POST /api/renter/vehicles/compare - So sánh xe
router.post("/compare", CompareVehicleController.compareVehicles);

export default router;
