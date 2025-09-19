import db from '../../models/index.js'
import { createCookie } from '../../utils/createCookie.js'
import { sendEmail } from '../../utils/email/sendEmail.js';
import { verifyEmailTemplate } from '../../utils/email/templates/verifyEmail.js';
import bcrypt from "bcrypt";
import crypto from "crypto";

// redirect user to google login form and ask for permission : 
export const googleLogin = (req, res) => {
    try {
        const scope = ["openid", "profile", "email"].join(" ");
        const authUrl =
            "https://accounts.google.com/o/oauth2/v2/auth" +
            `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&access_type=offline`;

        // Redirect user to Google login page
        res.redirect(authUrl);
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).send("Server error during Google login");
    }
};

// Handle callback from Google after user login to google account and accept permission :
export const googleCallback = async (req, res) => {
    try {
        // if user not allow to access data : 
        if (req.query.error === 'access_denied') {
            return res.status(400).json({ success: false, message: 'User not provide permisstion to access email,profile... in consent screen!' })
        }
        // get code from google response :
        const code = req.query.code;
        if (!code) return res.status(400).send("No code returned from Google");

        // Exchange code for access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenRes.json();

        if (!tokens.access_token) {
            return res.status(400).send("Error fetching access token");
        }
        // Fetch user info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const user = await userRes.json();

        // Check if user already exist : 
        const existUser = await db.User.findOne({
            where: {
                email: user.email,
            }
        });

        if (existUser) {
            // set cookie : 
            createCookie(res, existUser.user_id, existUser.role, existUser.avatar_url, existUser.email)
        } else {
            // create new user :
            const newUser = await db.User.create({
                email: user.email,
                full_name: user.name,
                avatar_url: user.picture,
                google_id: user.id,
                email_verified: true,
                authMethod: 'oauth'

            });
            // set cookie : 
            createCookie(res, newUser.user_id, 'renter', newUser.avatar_url, newUser.email)
        }
        return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}?googleCheckAuth=true`)
    } catch (error) {
        console.error("Google Callback Error:", error);
        res.status(500).send("Server error during Google callback");
    }
};

// logout : 
export const logout = (req, res) => {
    try {
        // 1. delete cookie : 
        res.clearCookie('token',
            {
                httpOnly: true,   // cannot be accessed by JavaScript (XSS safe)
                secure: process.env.NODE_ENV === "production", // only HTTPS in production
                sameSite: "strict", // CSRF protection
                maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
            }
        )
        // 2. return : 
        return res.status(200).json({ success: true, message: "Logout successfully!" })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, message: "Error when logout!" })

    }
}

// register :
export const register = async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Missing email or password in request!" });
        }

        // 1. check if email already exist :
        const existEmail = await db.User.findOne({ where: { email } });
        if (existEmail) {
            return res
                .status(400)
                .json({ success: false, message: "Email already exists!" });
        }

        // 2. create new account :
        const password_hash = await bcrypt.hash(password, 10); // 10 = salt rounds
        const verifyEmailToken = crypto.randomBytes(32).toString("hex");

        const newUser = await db.User.create({
            email,
            password_hash,
            authMethod: "email",
            verifyEmailToken,
        });

        // 3. send verify email :
        const verifyLink = `${process.env.CLIENT_ORIGIN}/verify-email?email=${encodeURIComponent(
            email
        )}&verifyEmailToken=${verifyEmailToken}`;

        await sendEmail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: verifyEmailTemplate(verifyLink),
        });

        // 4. return success
        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email to verify your account.",
        });
    } catch (error) {
        console.error("Register error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Server error. Please try again later." });
    }
};

// verify email : 
export const verifyEmail = async (req, res) => {
    try {
        const { email, verifyEmailToken } = req.body || {};

        // 1. Check if email & token exist in body
        if (!email || !verifyEmailToken) {
            return res
                .status(400)
                .json({ success: false, message: "Missing email or verify token in request" });
        }

        // 2. Find user by email
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        // 3. Check if token matches
        if (user.verifyEmailToken !== verifyEmailToken) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired token" });
        }

        // 4. Token matches → update user
        user.verifyEmailToken = null; // delete token
        user.email_verified = true;
        await user.save();

        // 5. Create cookie 
        createCookie(res, user.user_id, user.role, user.avatar_url, user.email)

        // 6. Respond
        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                role: user.role,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// login : 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Missing email or password in request!" });
        }

        // 1. Check if email exists
        const existUser = await db.User.findOne({ where: { email } });
        if (!existUser) {
            return res.status(400).json({ success: false, message: "Email not registered" });
        }

        // 2. Check if email is verified
        if (existUser.email_verified !== true) {
            return res
                .status(400)
                .json({ success: false, message: "Email not verified", isNotVerifyEmailError: true });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, existUser.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        // 5. Set cookie
        createCookie(res, existUser.user_id, existUser.role, '', existUser.email)

        // 6. Send response
        return res.json({
            success: true,
            message: "Login successful",
            user: {
                userId: existUser.user_id,
                email: existUser.email,
                role: existUser.role,
                avatar: existUser.avatar,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// request to create verify email : 
export const requestCreateVerifyEmail = async (req, res) => {
    try {
        const { email } = req.body || {};

        // 0. Check if email is provided
        if (!email) {
            return res
                .status(400)
                .json({ success: false, message: "Email is required!" });
        }

        // 1. Check if user exists
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found!" });
        }

        // 2. Check if email is already verified
        if (user.email_verified) {
            return res
                .status(400)
                .json({ success: false, message: "Email is already verified!" });
        }

        // 3. Create verify email token
        const verifyEmailToken = crypto.randomBytes(32).toString("hex");
        user.verifyEmailToken = verifyEmailToken;
        await user.save();

        // 4. Send verification email
        const verifyLink = `${process.env.CLIENT_ORIGIN}/verify-email?email=${encodeURIComponent(
            email
        )}&verifyEmailToken=${verifyEmailToken}`;
        await sendEmail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: verifyEmailTemplate(verifyLink),
        });

        // 5. Response
        return res
            .status(200)
            .json({ success: true, message: "Verification email sent!" });
    } catch (error) {
        console.error("Error in requestCreateVerifyEmail:", error.message);
        return res
            .status(500)
            .json({ success: false, message: "Server error. Please try again." });
    }
};