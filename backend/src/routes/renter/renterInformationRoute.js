import express from "express";
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import {
    agreeToTerms, check2FaceMatchAndSaveDriverLicenseToAWS, check2FaceMatchAndSaveIdentityCardToAWS,
    checkIfUserIsAgreeToTerms, checkIfUserIsVerifyEmail, checkIfUserIsVerifyIdentityCard,
    checkIfUserRegisterBankAccount, checkStatusForRequestToBecomeOwner, sendOTPUsingMoceanForUpdatePhoneNumber,
    sendRequestToBecomeOwner, updateFullName, verifyDriverLicenseCard, verifyIdentityCard,
    verifyOTPUsingMoceanForUpdatePhoneNumber
} from "../../controllers/renter/renterInfomationController.js";
import upload from '../../middlewares/multerConfig.js'
import { getBasicUserInformation, updateAvatarToCloudinary } from "../../controllers/renter/renterInfomationController.js";

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

// check if user is verify email : 
router.get('/is-verify-email', verifyJWTToken, checkIfUserIsVerifyEmail);

// check if user is verify identity card :
router.get('/is-verify-identity-card', verifyJWTToken, checkIfUserIsVerifyIdentityCard);

// check if user is register bank account :
router.get('/is-register-bank-account', verifyJWTToken, checkIfUserRegisterBankAccount);

// check status for request to become owner :
router.get('/status-request-to-be-owner', verifyJWTToken, checkStatusForRequestToBecomeOwner);

// check if user is agree to terms and conditions :
router.get('/is-agree-terms-and-conditions', verifyJWTToken, checkIfUserIsAgreeToTerms);

// axiosInstance.post('/api/renter/info/agree-terms-and-conditions')
router.post('/agree-terms-and-conditions', verifyJWTToken, agreeToTerms);

// register owner request :
router.post('/register-owner-request', verifyJWTToken, sendRequestToBecomeOwner);

// get basic user information: 
router.post('/get-basic-user-information', verifyJWTToken, getBasicUserInformation);

// update avatar :
router.post('/update-avatar', verifyJWTToken, upload.single("avatarImage"), updateAvatarToCloudinary);

// sending opt using twilio :
router.post('/send-otp', verifyJWTToken, sendOTPUsingMoceanForUpdatePhoneNumber);

// verify otp code using twilio :
router.post('/verify-otp', verifyJWTToken, verifyOTPUsingMoceanForUpdatePhoneNumber);

export default router;
