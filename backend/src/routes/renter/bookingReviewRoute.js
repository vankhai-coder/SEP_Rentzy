// routes/renter/bookingReviewRoute.js
import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  createBookingReview,
  getReviewsByVehicle,
} from "../../controllers/renter/bookingReviewController.js";

const router = express.Router();

// POST: renter gửi đánh giá sau khi hoàn tất thuê xe
router.post("/", verifyJWTToken, createBookingReview);

// GET: xem tất cả review của 1 xe
router.get("/vehicle/:vehicle_id", getReviewsByVehicle);

export default router;
