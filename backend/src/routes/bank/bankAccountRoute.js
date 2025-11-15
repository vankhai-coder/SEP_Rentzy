// routes/bankAccountRoute.js
import express from "express";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  setPrimaryAccount,
  deleteBankAccount,
  uploadQRCode,
} from "../../controllers/bankRenter/bankAccountController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import upload from "../../middlewares/multerConfig.js";

const router = express.Router();

// Routes cho user quản lý tài khoản ngân hàng của mình
router.get("/", verifyJWTToken, getBankAccounts);
router.post("/", verifyJWTToken, createBankAccount);
router.put("/:bankId", verifyJWTToken, updateBankAccount);
router.patch("/:bankId/set-primary", verifyJWTToken, setPrimaryAccount);
router.delete("/:bankId", verifyJWTToken, deleteBankAccount);

// Route upload ảnh QR code
router.post("/upload-qr", verifyJWTToken, upload.single("qrImage"), uploadQRCode);

export default router;
