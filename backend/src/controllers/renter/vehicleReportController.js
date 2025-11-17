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

// GET: Lấy báo cáo của user (tất cả hoặc filter theo xe cụ thể qua query param vehicle_id)
export const getMyVehicleReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vehicle_id } = req.query; // Lấy vehicle_id từ query param (optional)
    let whereClause = { user_id: userId };
    if (vehicle_id) {
      whereClause.vehicle_id = parseInt(vehicle_id);
      // Kiểm tra xe tồn tại nếu filter theo vehicle_id
      const vehicle = await Vehicle.findByPk(parseInt(vehicle_id));
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Xe không tồn tại.",
        });
      }
    }
    // Lấy danh sách báo cáo của user (include vehicle info để hiển thị xe nào, và status/admin_note)
    const reports = await VehicleReport.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle", // Giả sử relation đã có as: "vehicle"
          attributes: ["vehicle_id", "license_plate", "model"], // Info cơ bản về xe
          include: [
            {
              model: User,
              as: "owner", // Owner của xe nếu cần
              attributes: ["user_id", "full_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]], // Sắp xếp mới nhất trước
    });
    const message = vehicle_id
      ? "Lấy báo cáo của bạn cho xe này thành công."
      : "Lấy tất cả báo cáo của bạn thành công.";
    res.status(200).json({
      success: true,
      message,
      data: reports.map((report) => ({
        report_id: report.report_id,
        vehicle_id: report.vehicle_id,
        reason: report.reason,
        message: report.message,
        status: report.status,
        admin_note: report.admin_note,
        created_at: report.created_at,
        vehicle: {
          vehicle_id: report.vehicle.vehicle_id,
          license_plate: report.vehicle.license_plate,
          model: report.vehicle.model,
          owner: {
            user_id: report.vehicle.owner.user_id,
            full_name: report.vehicle.owner.full_name,
          },
        },
      })),
      count: reports.length,
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo của user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy báo cáo.",
    });
  }
};

// GET: Lấy tất cả báo cáo xe (dành cho admin) - filter optional theo status hoặc vehicle_id
export const getAllVehicleReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Kiểm tra quyền: Chỉ admin mới xem được tất cả
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền xem tất cả báo cáo. Chỉ admin mới được phép.",
      });
    }

    const { status, vehicle_id } = req.query; // Optional filter
    let whereClause = {};
    if (status) {
      whereClause.status = status; // Filter theo status (pending, reviewing, etc.)
    }
    if (vehicle_id) {
      whereClause.vehicle_id = parseInt(vehicle_id);
      // Kiểm tra xe tồn tại nếu filter theo vehicle_id
      const vehicle = await Vehicle.findByPk(parseInt(vehicle_id));
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Xe không tồn tại.",
        });
      }
    }

    // Lấy tất cả báo cáo (include vehicle info và reporter user)
    const reports = await VehicleReport.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle", // Relation đã có
          attributes: ["vehicle_id", "license_plate", "model", "status"], // Info cơ bản về xe
          include: [
            {
              model: User,
              as: "owner", // Owner của xe
              attributes: ["user_id", "full_name"],
            },
          ],
        },
        {
          model: User,
          as: "user", // Người báo cáo
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]], // Sắp xếp mới nhất trước
    });

    const message =
      status || vehicle_id
        ? "Lấy báo cáo (filter) thành công."
        : "Lấy tất cả báo cáo thành công.";

    res.status(200).json({
      success: true,
      message,
      data: reports.map((report) => ({
        report_id: report.report_id,
        vehicle_id: report.vehicle_id,
        reason: report.reason,
        message: report.message,
        status: report.status,
        admin_note: report.admin_note,
        created_at: report.created_at,
        vehicle: {
          vehicle_id: report.vehicle.vehicle_id,
          license_plate: report.vehicle.license_plate,
          model: report.vehicle.model,
          status: report.vehicle.status, // Để admin biết xe có bị block chưa
          owner: {
            user_id: report.vehicle.owner.user_id,
            full_name: report.vehicle.owner.full_name,
          },
        },
        reporter: {
          // Người báo cáo
          user_id: report.user.user_id,
          full_name: report.user.full_name,
          email: report.user.email,
        },
      })),
      count: reports.length,
    });
  } catch (error) {
    console.error("Lỗi lấy tất cả báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy báo cáo.",
    });
  }
};

// PUT: Cập nhật status và admin_note cho một báo cáo (dành cho admin xử lý)
export const updateVehicleReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status, admin_note = "" } = req.body; // status bắt buộc, admin_note tùy chọn
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Kiểm tra quyền: Chỉ admin
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền cập nhật báo cáo. Chỉ admin mới được phép.",
      });
    }

    // Validation: Kiểm tra status có hợp lệ không (ENUM)
    const validStatuses = ["pending", "reviewing", "resolved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status không hợp lệ. Các status cho phép: pending, reviewing, resolved, rejected.",
      });
    }

    // Tìm báo cáo
    const report = await VehicleReport.findByPk(parseInt(report_id));
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Báo cáo không tồn tại.",
      });
    }

    // Cập nhật báo cáo
    await report.update({
      status,
      admin_note,
    });

    // Logic xử lý vi phạm: Nếu resolved và note chứa từ khóa vi phạm, block xe
    let blockMessage = "";
    if (
      status === "resolved" &&
      (admin_note.toLowerCase().includes("vi phạm") ||
        admin_note.toLowerCase().includes("block"))
    ) {
      const vehicle = await Vehicle.findByPk(report.vehicle_id);
      if (vehicle && vehicle.status === "available") {
        await vehicle.update({
          status: "blocked",
          blocked_by: "admin",
        });
        blockMessage = "Xe đã được block tự động do vi phạm.";
      }
    }

    res.status(200).json({
      success: true,
      message: `Cập nhật báo cáo thành công.${
        blockMessage ? " " + blockMessage : ""
      }`,
      data: {
        report_id: report.report_id,
        status: report.status, // Status mới
        admin_note: report.admin_note, // Note mới
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật báo cáo.",
    });
  }
};
