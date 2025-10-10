import express from "express";
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { check2FaceMatch, verifyDriverLicenseCard, verifyIdentityCard } from "../../controllers/renter/renterInfomation.js";
import upload from '../../middlewares/multerConfig.js'

const router = express.Router();

// verify driver license card : 
router.post('/verify/driver-license-card', upload.single("image"), verifyDriverLicenseCard)

// verify driver identity card :
router.post('/verify/identify-card', upload.single("image"), verifyIdentityCard)

// check 2 face match : 
router.post('/check-2-face-match', upload.fields([{ name: 'image_1', maxCount: 1 }, { name: 'image_2', maxCount: 1 }]) , check2FaceMatch )

export default router;
