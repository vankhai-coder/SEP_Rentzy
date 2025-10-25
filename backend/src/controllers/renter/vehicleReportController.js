// controllers/renter/vehicleReportController.js
import VehicleReport from "../../models/VehicleReport.js";
import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js"; // Để validate user nếu cần

// POST: Tạo báo cáo mới cho xe
export const createVehicleReport = async (req, res) => {
  try {
    const { vehicle_id } = req.params; // Lấy vehicle_id từ URL params
    const { reason, message = "" } = req.body; // reason bắt buộc, message tùy chọn
    const userId = req.user.userId; // Lấy từ middleware verifyJWTToken

    // Validation: Kiểm tra reason có hợp lệ không (ENUM)
    const validReasons = [
      "fake_info",
      "illegal",
      "bad_owner",
      "dangerous",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message:
          "Lý do báo cáo không hợp lệ. Các lý do cho phép: fake_info, illegal, bad_owner, dangerous, other.",
      });
    }

    // Kiểm tra xe có tồn tại không
    console.log(
      "Vehicle ID from params:",
      vehicle_id,
      "Type:",
      typeof vehicle_id
    );
    console.log("Parsed ID:", parseInt(vehicle_id));
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Xe không tồn tại.",
      });
    }

    // Kiểm tra người dùng đã báo cáo xe này chưa (tránh trùng lặp)
    const existingReport = await VehicleReport.findOne({
      where: { vehicle_id: parseInt(vehicle_id), user_id: userId },
    });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã báo cáo xe này rồi. Không thể báo cáo lại.",
      });
    }

    // Tạo báo cáo mới
    const newReport = await VehicleReport.create({
      vehicle_id: parseInt(vehicle_id),
      user_id: userId,
      reason,
      message,
    });

    // Response thành công
    res.status(201).json({
      success: true,
      message: "Báo cáo xe thành công. Cảm ơn bạn đã góp ý!",
      data: {
        report_id: newReport.report_id,
        vehicle_id: newReport.vehicle_id,
        reason: newReport.reason,
        message: newReport.message,
        created_at: newReport.created_at,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo báo cáo xe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo báo cáo.",
    });
  }
};

// GET: Lấy danh sách báo cáo của một xe (hữu ích cho admin/owner kiểm tra)
// Chỉ cho phép nếu user là owner của xe hoặc admin (thêm check role nếu cần)
export const getVehicleReports = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role; // Lấy role từ token

    // Kiểm tra xe tồn tại
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Xe không tồn tại.",
      });
    }

    // Kiểm tra quyền: Owner của xe hoặc admin mới xem được
    if (userRole !== "admin" && vehicle.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem báo cáo của xe này.",
      });
    }

    // Lấy danh sách báo cáo (include user info để hiển thị ai báo cáo)
    const reports = await VehicleReport.findAll({
      where: { vehicle_id: parseInt(vehicle_id) },
      include: [
        {
          model: User,
          as: "user", // Giả sử relation User hasMany VehicleReport với as: "reports" - cần thêm nếu chưa có
          attributes: ["user_id", "full_name", "email"], // Chỉ lấy info cơ bản
        },
      ],
      order: [["created_at", "DESC"]], // Sắp xếp mới nhất trước
    });

    res.status(200).json({
      success: true,
      message: "Lấy báo cáo thành công.",
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo xe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy báo cáo.",
    });
  }
};
