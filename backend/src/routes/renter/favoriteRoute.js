import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../../controllers/renter/favoriteController.js";

const router = express.Router();

// Route thêm favorite (POST /api/renter/favorites)
router.post("/", verifyJWTToken, addFavorite);

// Route xóa favorite (DELETE /api/renter/favorites/:vehicle_id)
router.delete("/:vehicle_id", verifyJWTToken, removeFavorite);

// Route lấy danh sách favorites (GET /api/renter/favorites)
router.get("/", verifyJWTToken, getFavorites);

export default router;
