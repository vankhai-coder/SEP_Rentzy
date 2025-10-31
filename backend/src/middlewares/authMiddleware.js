import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyJWTToken = async (req, res, next) => {
  try {
    // 1. Get token from cookie
    const { token } = req.cookies;
    // console.log("token:", token);
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    // 2. Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // 3. Check if user exists and is active
    const existUser = await User.findOne({
      where: {
        user_id: decoded.userId,
        is_active: true,
      },
    });

    if (!existUser) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Không tìm thấy người dùng hoặc tài khoản đã bị khóa!",
        });
    }

    // 4. Save decoded data to req.user (thêm points)
    req.user = { ...decoded, points: existUser.points };

    // 5. Continue to next middleware
    next();
  } catch (error) {
    console.error("Error verifying JWT token:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error verifying token" });
  }
};
