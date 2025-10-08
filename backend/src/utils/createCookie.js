import jwt from 'jsonwebtoken'

export const createCookie = (res, userId, role, avatar, email) => {
    // 1. Generate JWT
    const token = jwt.sign({ userId, role, avatar, email }, process.env.JWT_SECRET_KEY); // never expires

    // 2. Set cookie
    res.cookie("token", token, {
        httpOnly: true,   // cannot be accessed by JavaScript (XSS safe)
        secure: process.env.NODE_ENV === "production", // only HTTPS in production
        sameSite: "strict", // CSRF protection
        maxAge: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    });

    return token; // in case you also want to send it in JSON response
}