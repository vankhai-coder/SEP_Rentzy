import { Router } from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { getTransactionHistory } from "../../controllers/renter/transactionController.js";

const router = Router();

router.get("/", verifyJWTToken, getTransactionHistory);

export default router;
