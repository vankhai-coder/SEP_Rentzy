import express from "express";
import { generateCarDescription, generateMotoBikeDescription , checkVehicleInfo} from "../../controllers/ai/generateCarDescription.js";

const router = express.Router();

router.post("/generate-car-description", generateCarDescription);
router.post("/generate-motorbike-description", generateMotoBikeDescription);
router.post("/check-vehicle-info", checkVehicleInfo);  

export default router;