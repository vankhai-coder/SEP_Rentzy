import express from "express";
import {
  getTrafficFineCaptcha,
  searchTrafficFine,
} from "../../controllers/owner/ownerDashboardController.js";

const router = express.Router();

// Không cần authentication - ai cũng có thể tra cứu phạt nguội
// GET /api/traffic-fine-search/captcha - Lấy captcha image
router.get("/captcha", getTrafficFineCaptcha);

// POST /api/traffic-fine-search - Tra cứu phạt nguội
router.post("/", searchTrafficFine);

export default router;

