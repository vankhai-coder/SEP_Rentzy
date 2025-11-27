// src/routes/renter/compareVehicleRoute.js
import express from "express";
import CompareVehicleController from "../../controllers/renter/compareVehicleController.js";
import AIRecommendController from "../../controllers/renter/AIRecommendController.js";

const router = express.Router();

// POST /api/renter/vehicles/compare
router.post("/compare", CompareVehicleController.compareVehicles);

// POST /api/renter/vehicles/ai-recommend  ← ĐÚNG ĐƯỜNG DẪN!
router.post("/ai-recommend", AIRecommendController.recommendVehicle);

export default router;
