// routes/renter/brandRoute.js
import express from "express";
import {
  getAllBrands,
  getBrandsByCategory,
} from "../../controllers/renter/brandController.js";

const router = express.Router();

// GET: /api/renter/brands
router.get("/", getAllBrands);

// GET: /api/renter/brands/category/:category
router.get("/category/:category", getBrandsByCategory);

export default router;
