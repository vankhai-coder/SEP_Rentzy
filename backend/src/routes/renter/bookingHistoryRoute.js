import { Router } from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getBookingHistory,
  getAllStatuses,
  getBookingDetail, // ✅ IMPORT MỚI
} from "../../controllers/renter/bookingHistoryController.js";

const router = Router();

router.get("/", verifyJWTToken, getBookingHistory); // GET danh sách (có filter status)
router.get("/statuses", verifyJWTToken, getAllStatuses); // GET tất cả statuses

// ✅ THÊM MỚI: GET chi tiết booking theo ID (cho trang review)
router.get("/:bookingId", verifyJWTToken, getBookingDetail);

export default router;
