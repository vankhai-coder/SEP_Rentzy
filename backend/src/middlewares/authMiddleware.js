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
        .json({ success: false, message: "Không tìm thấy người dùng hoặc tài khoản đã bị khóa!" });
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

// Optional authentication middleware - không yêu cầu token
export const optionalAuth = async (req, res, next) => {
  try {
    // 1. Get token from cookie
    const { token } = req.cookies;
    
    // Nếu không có token, tiếp tục mà không set req.user
    if (!token) {
      req.user = null;
      return next();
    }

    // 2. Decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      // Token không hợp lệ, tiếp tục mà không set req.user
      req.user = null;
      return next();
    }

    // 3. Check if user exists and is active
    const existUser = await User.findOne({
      where: {
        user_id: decoded.userId,
        is_active: true,
      },
    });

    if (!existUser) {
      // User không tồn tại hoặc bị khóa, tiếp tục mà không set req.user
      req.user = null;
      return next();
    }

    // 4. Save decoded data to req.user (thêm points)
    req.user = { ...decoded, points: existUser.points };

    // 5. Continue to next middleware
    next();
  } catch (error) {
    console.error("Error in optional auth middleware:", error.message);
    // Có lỗi, tiếp tục mà không set req.user
    req.user = null;
    next();
  }
};
