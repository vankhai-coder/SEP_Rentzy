// middlewares/verificationMiddleware.js
import User from "../models/User.js";

/**
 * Middleware kiểm tra xác minh số điện thoại và GPLX trước khi đặt xe
 * Yêu cầu:
 * - Số điện thoại đã được xác minh (phone_verified = true)
 * - GPLX đã được phê duyệt (driver_license_status = "approved")
 */
export const checkVerificationForBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    console.log("userId:", userId);

    // Lấy thông tin user từ database
    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "full_name",
        "phone_verified",
        "driver_license_status",
        "phone_number",
        "driver_license_number",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Kiểm tra xác minh số điện thoại
    if (!user.phone_verified) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần xác minh số điện thoại trước khi đặt xe",
        error_code: "PHONE_NOT_VERIFIED",
        required_verification: {
          phone_verified: false,
          phone_number: user.phone_number,
        },
      });
    }

    // Kiểm tra xác minh GPLX
    if (user.driver_license_status !== "approved") {
      let message = "Bạn cần xác minh GPLX trước khi đặt xe";

      if (user.driver_license_status === "pending") {
        message = "Bạn cần xác minh GPLX trước khi đặt xe";
      } else if (user.driver_license_status === "rejected") {
        message =
          "GPLX của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin GPLX";
      }

      return res.status(403).json({
        success: false,
        message: message,
        error_code: "LICENSE_NOT_VERIFIED",
        required_verification: {
          driver_license_status: user.driver_license_status,
          driver_license_number: user.driver_license_number,
        },
      });
    }

    // Nếu tất cả đều đã xác minh, cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra xác minh:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi kiểm tra xác minh",
      error: error.message,
    });
  }
};

/**
 * Middleware kiểm tra chỉ xác minh số điện thoại (cho các tính năng khác)
 */
export const checkPhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ["user_id", "phone_verified", "phone_number"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    if (!user.phone_verified) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần xác minh số điện thoại để sử dụng tính năng này",
        error_code: "PHONE_NOT_VERIFIED",
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra xác minh số điện thoại:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi kiểm tra xác minh",
      error: error.message,
    });
  }
};

/**
 * Middleware kiểm tra chỉ xác minh GPLX (cho các tính năng khác)
 */
export const checkLicenseVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ["user_id", "driver_license_status", "driver_license_number"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    if (user.driver_license_status !== "approved") {
      let message = "Bạn cần xác minh GPLX để sử dụng tính năng này";

      if (user.driver_license_status === "pending") {
        message = "GPLX của bạn đang chờ phê duyệt";
      } else if (user.driver_license_status === "rejected") {
        message = "GPLX của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin";
      }

      return res.status(403).json({
        success: false,
        message: message,
        error_code: "LICENSE_NOT_VERIFIED",
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra xác minh GPLX:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi kiểm tra xác minh",
      error: error.message,
    });
  }
};
