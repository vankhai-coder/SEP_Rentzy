// routes/renter/brandRoute.js
import express from "express";
import {
  getAllBrands,
  getBrandsByCategory,
  getVehiclesByBrand,
} from "../../controllers/renter/brandController.js";

const router = express.Router();

// GET: /api/renter/brands
router.get("/", getAllBrands);

// GET: /api/renter/brands/category/:category
router.get("/category/:category", getBrandsByCategory);

// GET: /api/renter/brands/:brand_id/vehicles
router.get("/:brand_id/vehicles", getVehiclesByBrand);

export default router;
