import express from "express";
import { generateCarDescription, generateMotoBikeDescription } from "../../controllers/ai/generateCarDescription.js";

const router = express.Router();

router.post("/generate-car-description", generateCarDescription);
router.post("/generate-motorbike-description", generateMotoBikeDescription);


export default router;