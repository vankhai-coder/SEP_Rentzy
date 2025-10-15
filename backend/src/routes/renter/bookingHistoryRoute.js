// src/routes/renter/bookingHistoryRoute.js
import { Router } from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getBookingHistory,
  getAllStatuses,
} from "../../controllers/renter/bookingHistoryController.js";

const router = Router();

router.get("/", verifyJWTToken, getBookingHistory); // GET danh sách (có filter status)
router.get("/statuses", verifyJWTToken, getAllStatuses); // GET tất cả statuses

export default router;
