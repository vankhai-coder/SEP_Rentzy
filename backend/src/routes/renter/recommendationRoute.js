// routes/renter/recommendationRoute.js
import express from "express";
import { softAuth } from "../../middlewares/softAuthMiddleware.js";
import { getRecommendations } from "../../controllers/renter/recommendationController.js";

const router = express.Router();

// Route: GET /api/renter/recommendations?limit=10 (yêu cầu JWT)
router.get("/recommendations", softAuth, getRecommendations);

export default router;
