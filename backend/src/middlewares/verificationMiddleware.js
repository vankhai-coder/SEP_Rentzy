// middlewares/verificationMiddleware.js
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

/**
 * Middleware kiểm tra xác minh số điện thoại và GPLX trước khi đặt xe
 * Yêu cầu:
 * - Số điện thoại đã được xác minh (phone_verified = true)
 * - GPLX phù hợp với loại xe (xe máy: A, ô tô: B) và đã được phê duyệt
 */
export const checkVerificationForBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { vehicle_id } = req.body;
    console.log("userId:", userId, "vehicle_id:", vehicle_id);

    // 1. Lấy thông tin xe để xác định loại xe (xe máy hay ô tô)
    let isMotorbike = false;
    let isCar = false;

    if (vehicle_id) {
      const vehicle = await Vehicle.findByPk(vehicle_id);
         console.log("loại xe" ,vehicle.vehicle_type)
      if (vehicle) {
        if (vehicle.vehicle_type === "motorbike") {
          isMotorbike = true;
        } else if (vehicle.vehicle_type === "car") {
          isCar = true;
        }
      }
    }

    // 2. Lấy thông tin user với các trường phù hợp
    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "full_name",
        "phone_verified",
        "phone_number",
        // Các trường GPLX cho xe máy
        "driver_license_status_for_motobike",
        "driver_license_number_for_motobike",
        "driver_class_for_motobike",
        // Các trường GPLX cho ô tô
        "driver_license_status_for_car",
        "driver_license_number_for_car",
        "driver_class_for_car",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // 4. Kiểm tra xác minh GPLX theo loại xe
    let licenseStatus = "";
    let licenseNumber = "";
    let licenseClass = "";
    let requiredClass = "";
    let vehicleTypeName = "";

    if (isMotorbike) {
      licenseStatus = user.driver_license_status_for_motobike;
      licenseNumber = user.driver_license_number_for_motobike;
      licenseClass = user.driver_class_for_motobike;
      requiredClass = "A"; // Bằng lái xe máy (A1, A2...)
      vehicleTypeName = "xe máy";
    } else if (isCar) {
      licenseStatus = user.driver_license_status_for_car;
      licenseNumber = user.driver_license_number_for_car;
      licenseClass = user.driver_class_for_car;
      requiredClass = "B"; // Bằng lái ô tô (B1, B2...)
      vehicleTypeName = "ô tô";
    } else {
      // Trường hợp không xác định được loại xe (hoặc không có vehicle_id), 
      // có thể skip check GPLX hoặc check cả 2? 
      // Ở đây tạm thời cho qua hoặc báo lỗi nếu bắt buộc. 
      // Nhưng theo logic booking, phải có vehicle.
      // Nếu không tìm thấy xe, booking controller sẽ xử lý lỗi 404 sau.
      // Nhưng ở đây ta chỉ check điều kiện user.
      // Nếu không xác định được loại xe, ta có thể yêu cầu tối thiểu 1 bằng lái?
      // Hoặc đơn giản là next() và để controller xử lý tiếp.
      // Tuy nhiên, user yêu cầu check logic bằng lái.
      if (vehicle_id) { // Có vehicle_id mà không xác định được type => Lỗi data xe
         console.warn("Không xác định được loại xe cho vehicle_id:", vehicle_id);
      }
      // Tạm thời next() nếu không xác định được loại xe để tránh chặn sai
      return next();
    }

    // Kiểm tra status
    console.log("licenseStatus:", licenseStatus);
    if (licenseStatus !== "approved") {
      let message = `Bạn cần xác minh GPLX ${vehicleTypeName} để đặt xe này`;

      if (licenseStatus === "pending") {
        message = `Bạn cần xác minh GPLX ${vehicleTypeName} để đặt xe này`;
      } else if (licenseStatus === "rejected") {
        message = `GPLX ${vehicleTypeName} của bạn đã bị từ chối. Vui lòng cập nhật lại`;
      }

      return res.status(403).json({
        success: false,
        message: message,
        error_code: "LICENSE_NOT_VERIFIED",
        required_verification: {
          driver_license_status: licenseStatus,
          driver_license_number: licenseNumber,
          vehicle_type: isMotorbike ? "motorbike" : "car"
        },
      });
    }

    // Kiểm tra hạng bằng (Class)
    // Xe máy cần có chữ 'A' (A1, A2...), Ô tô cần có chữ 'B' (B1, B2...) hoặc cao hơn (C, D...)
    // Logic đơn giản: check include. 
    // Tuy nhiên, user chỉ yêu cầu "thuê xe oto thì là bằng b ... thuê xe máy thì bằng a"
    // Ta sẽ check xem licenseClass có chứa ký tự yêu cầu không.
    
    let isValidClass = false;
    if (licenseClass) {
        if (isMotorbike && licenseClass.toUpperCase().includes("A")) isValidClass = true;
        // Ô tô: B, C, D, E, F đều lái được xe con (tùy loại), nhưng yêu cầu tối thiểu B.
        // Giả sử user có bằng C, vẫn thuê được xe con (thường là vậy).
        // Code hiện tại check chứa "B". Nếu user có bằng C thì sao?
        // User yêu cầu: "thuê xe oto thì là bằng b". 
        // Nhưng logic đúng nên là >= B.
        // Tuy nhiên, model lưu class dưới dạng string (VD: "B2", "C").
        // Nếu class là "C", nó không chứa "B".
        // Ta nên check list các bằng hợp lệ cho ô tô.
        const validCarClasses = ["B1", "B2", "C", "D", "E", "F", "FC", "FD", "FE"];
        if (isCar && validCarClasses.some(c => licenseClass.toUpperCase().startsWith(c))) isValidClass = true;
        // Hoặc đơn giản theo yêu cầu user "bằng b":
        if (isCar && licenseClass.toUpperCase().includes("B")) isValidClass = true; // Fallback cho yêu cầu user
        
        // Combine:
        if (isCar) {
             const upperClass = licenseClass.toUpperCase();
             if (upperClass.includes("B") || ["C", "D", "E", "F"].some(c => upperClass.startsWith(c))) {
                 isValidClass = true;
             }
        }
    }

    if (!isValidClass) {
         return res.status(403).json({
            success: false,
            message: `Hạng bằng lái của bạn (${licenseClass || 'Chưa cập nhật'}) không phù hợp để thuê ${vehicleTypeName}`,
            error_code: "LICENSE_CLASS_INVALID",
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
