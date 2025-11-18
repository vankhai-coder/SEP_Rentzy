import express from "express";
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { check2FaceMatchAndSaveDriverLicenseToAWS, check2FaceMatchAndSaveIdentityCardToAWS, sendOTPUsingTwilioForUpdatePhoneNumber, updateFullName, verifyDriverLicenseCard, verifyIdentityCard } from "../../controllers/renter/renterInfomationController.js";
import upload from '../../middlewares/multerConfig.js'
import { getBasicUserInformation, updateAvatarToCloudinary, verifyOTPUsingTwilioForUpdatePhoneNumber } from "../../controllers/renter/renterInfomationController.js";

const router = express.Router();

// verify driver license card : 
router.post('/verify/driver-license-card', verifyJWTToken, upload.single("image"), verifyDriverLicenseCard)

// verify driver identity card :
router.post('/verify/identify-card', verifyJWTToken, upload.single("image"), verifyIdentityCard)

// check 2 face match and save driver license to aws s3 : 
router.post('/check-2-face-match-driver-license', verifyJWTToken, upload.fields([{ name: 'image_1', maxCount: 1 }, { name: 'image_2', maxCount: 1 }]), check2FaceMatchAndSaveDriverLicenseToAWS)

// check 2 face match and save identity card to aws s3 : 
router.post('/check-2-face-match-identity-card', verifyJWTToken, upload.fields([{ name: 'image_1', maxCount: 1 }, { name: 'image_2', maxCount: 1 }]), check2FaceMatchAndSaveIdentityCardToAWS)

// update full name :
router.post('/update-full-name', verifyJWTToken, updateFullName);

// get basic user information: 
router.post('/get-basic-user-information', verifyJWTToken, getBasicUserInformation);

// update avatar :
router.post('/update-avatar', verifyJWTToken, upload.single("avatarImage"), updateAvatarToCloudinary);

// sending opt using twilio :
router.post('/send-otp', verifyJWTToken, sendOTPUsingTwilioForUpdatePhoneNumber);

// verify otp code using twilio :
router.post('/verify-otp', verifyJWTToken, verifyOTPUsingTwilioForUpdatePhoneNumber);

export default router;
