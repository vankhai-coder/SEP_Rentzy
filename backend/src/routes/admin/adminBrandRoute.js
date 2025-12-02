import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getAllBrands,
  updateBrand,
  createBrand,
  deleteBrand,
} from "../../controllers/admin/adminBrandController.js";
import upload from "../../middlewares/multerConfig.js";

const router = express.Router();

// === Middleware: Verify JWT & Admin Role ===
router.use(verifyJWTToken);
router.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

// === Routes ===
router.get("/", getAllBrands);
router.post("/", upload.single("logo"), createBrand);
router.patch("/:brandId", upload.single("logo"), updateBrand);
router.delete("/:brandId", deleteBrand);

export default router;
