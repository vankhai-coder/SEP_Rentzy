import express from 'express'
import { verifyJWTToken } from '../../middlewares/authMiddleware.js'
import { googleCallback, googleLogin, logout, register } from '../../controllers/auth/authController.js'
const router = express.Router()

// check auth :
router.get('/check-auth', verifyJWTToken, (req, res) => { return res.status(200).json({ success: true, user: req.user }) })

// route for redirect user to google login form : 
router.get('/auth/google', googleLogin)
// after login to google account , user will be redirectd to this route :
router.get('/auth/google/callback', googleCallback)

// logout : 
router.get('/logout', logout)

// register by email : 
router.post('/register' , register )

export default router 