// routes/renter/bookingReviewRoute.js
import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  createBookingReview,
  getReviewsByVehicle,
  getMyReviews,
} from "../../controllers/renter/bookingReviewController.js";

const router = express.Router();

// POST: renter gửi đánh giá sau khi hoàn tất thuê xe
router.post("/", verifyJWTToken, createBookingReview);

// GET: xem tất cả review của 1 xe
router.get("/vehicle/:vehicle_id", getReviewsByVehicle);

// GET: xem tất cả review của người dùng đang đăng nhập
router.get("/my-reviews", verifyJWTToken, getMyReviews);

export default router;
