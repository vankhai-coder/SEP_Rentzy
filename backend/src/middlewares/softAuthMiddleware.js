import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const softAuth = async (req, res, next) => {
  try {
    // 1. Get token from cookie (optional)
    const { token } = req.cookies;
    if (!token) {
      // Guest: Set req.user = null và continue
      req.user = null;
      return next();
    }

    // 2. Decode token (nếu có)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      // Invalid token: Treat as guest
      req.user = null;
      return next();
    }

    // 3. Check user exists and active (nếu có token valid)
    const existUser = await User.findOne({
      where: {
        user_id: decoded.userId,
        is_active: true,
      },
    });

    if (!existUser) {
      // User không tồn tại: Treat as guest
      req.user = null;
      return next();
    }

    // 4. Set req.user (valid user)
    req.user = { ...decoded, points: existUser.points };
    next();
  } catch (error) {
    console.error("Error in softAuth:", error.message);
    // Fallback guest, không throw error
    req.user = null;
    next();
  }
};
