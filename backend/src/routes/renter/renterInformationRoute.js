import express from "express";
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { verifyDriverLicense } from "../../controllers/renter/renterInfomation.js";
import upload from '../../middlewares/multerConfig.js'

const router = express.Router();

// verify driver license card : 
router.post('/verify/driver-license-card', upload.single("image"), verifyDriverLicense)

// verify driver identity card :

// check 2 face match : 


export default router;
