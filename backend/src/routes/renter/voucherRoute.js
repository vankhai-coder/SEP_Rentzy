import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { getUnusedVouchersForUser } from "../../controllers/renter/voucherController.js";

const router = express.Router();

router.get("/unused", verifyJWTToken, getUnusedVouchersForUser);

export default router;
