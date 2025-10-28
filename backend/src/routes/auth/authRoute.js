import express from 'express'
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { googleCallback, googleLogin, login, loginWithPhoneNumber, logout, register, registerWithPhoneNumber, requestCreateVerifyEmail, requestLoginWithPhoneNumber, requestResetPassword, requestUpdateEmail, resetPassword, verifyEmail, verifyPhoneNumberForRegistration, verifyUpdatedEmail } from '../../controllers/auth/authController.js'
const router = express.Router()

// check auth :
router.get('/check-auth', verifyJWTToken, (req, res) => { return res.status(200).json({ success: true, user: req.user }) })

// route for redirect user to google login form : 
router.get('/google', googleLogin)
// after login to google account , user will be redirectd to this route :
router.get('/google/callback', googleCallback)

// logout : 
router.get('/logout', logout)

// register by email : 
router.post('/register', register)

// verify email : 
router.post('/verify-email', verifyEmail)

// login : 
router.post('/login', login)

// request to create verify email : 
router.post('/request-create-verify-email', requestCreateVerifyEmail)

// request to create reset password email : 
router.post('/request-reset-password', requestResetPassword)

// reset password : 
router.post('/reset-password', resetPassword)

// request update email : 
router.post('/request-update-email', verifyJWTToken, requestUpdateEmail)

// veriry updated email : 
router.post('/verify-updated-email', verifyUpdatedEmail)

// register with phone number : 
router.post('/register-with-phone-number', registerWithPhoneNumber)

// verify phone number for registration :
router.post('/verify-phone-number-for-registration', verifyPhoneNumberForRegistration)

// login with phone number :
router.post('/login-with-phone-number', loginWithPhoneNumber)

// request send otp for login with phone number :
router.post('/request-login-with-phone-number', requestLoginWithPhoneNumber)



export default router 