// routes/renter/searchVehicleRoute.js
import express from "express";
import { searchVehicles } from "../../controllers/renter/searchVehicleController.js";

const router = express.Router();

// GET /api/renter/vehicles/search - Tìm kiếm xe nâng cao (mount tại /search)
router.get("/", searchVehicles);

export default router;
