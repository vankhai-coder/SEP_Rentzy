// routes/owner/ownerBrandRoute.js
import express from "express";
import {
  getAllBrands,
  getBrandsByCategory,
} from "../../controllers/owner/ownerBrandController.js";

const router = express.Router();

// GET: /api/owner/brands
router.get("/", getAllBrands);

// GET: /api/owner/brands/category/:category
router.get("/category/:category", getBrandsByCategory);

export default router;