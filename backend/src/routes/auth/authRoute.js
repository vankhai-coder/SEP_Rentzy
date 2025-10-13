import express from 'express'
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { googleCallback, googleLogin, login, logout, register, requestCreateVerifyEmail, requestResetPassword, requestUpdateEmail, resetPassword, verifyEmail, verifyUpdatedEmail } from '../../controllers/auth/authController.js'
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

export default router 