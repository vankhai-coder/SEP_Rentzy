import db from '../../models/index.js'
import { createCookie } from '../../utils/createCookie.js'

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
                google_id: user.id,
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
        return res.status(200).redirect(`${process.env.CLIENT_ORIGIN}`)
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