// controllers/renter/vehicleReportController.js

import VehicleReport from "../../models/VehicleReport.js";
import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";

// POST: Tạo báo cáo mới cho xe
export const createVehicleReport = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const { reason, message = "" } = req.body;
    const userId = req.user.userId;

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

    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Xe không tồn tại.",
      });
    }

    const existingReport = await VehicleReport.findOne({
      where: { vehicle_id: parseInt(vehicle_id), user_id: userId },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã báo cáo xe này rồi. Không thể báo cáo lại.",
      });
    }

    const newReport = await VehicleReport.create({
      vehicle_id: parseInt(vehicle_id),
      user_id: userId,
      reason,
      message,
    });

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

// GET: Lấy danh sách báo cáo của một xe (cho owner/admin)
export const getVehicleReports = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Xe không tồn tại.",
      });
    }

    if (userRole !== "admin" && vehicle.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem báo cáo của xe này.",
      });
    }

    const reports = await VehicleReport.findAll({
      where: { vehicle_id: parseInt(vehicle_id) },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
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

// GET: Lấy báo cáo của user có pagination
export const getMyVehicleReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vehicle_id, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = { user_id: userId };

    if (vehicle_id) {
      whereClause.vehicle_id = parseInt(vehicle_id);

      const vehicle = await Vehicle.findByPk(parseInt(vehicle_id));
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Xe không tồn tại.",
        });
      }
    }

    // Lấy tổng count
    const totalReports = await VehicleReport.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalReports / limitNum);

    // Lấy data có pagination
    const reports = await VehicleReport.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "license_plate", "model"],
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["user_id", "full_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      offset,
      limit: limitNum,
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
      totalReports,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo của user:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy báo cáo.",
    });
  }
};

// GET: Lấy tất cả báo cáo (admin) với pagination
export const getAllVehicleReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền xem tất cả báo cáo. Chỉ admin mới được phép.",
      });
    }

    const { status, vehicle_id, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (vehicle_id) {
      whereClause.vehicle_id = parseInt(vehicle_id);

      const vehicle = await Vehicle.findByPk(parseInt(vehicle_id));
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Xe không tồn tại.",
        });
      }
    }

    // Lấy tổng count
    const totalReports = await VehicleReport.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalReports / limitNum);

    // Lấy data có pagination
    const reports = await VehicleReport.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "license_plate", "model", "status"],
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["user_id", "full_name"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      offset,
      limit: limitNum,
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
          status: report.vehicle.status,
          owner: {
            user_id: report.vehicle.owner.user_id,
            full_name: report.vehicle.owner.full_name,
          },
        },
        reporter: {
          user_id: report.user.user_id,
          full_name: report.user.full_name,
          email: report.user.email,
        },
      })),
      count: reports.length,
      totalReports,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Lỗi lấy tất cả báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy báo cáo.",
    });
  }
};

// PUT: Cập nhật status và admin_note
export const updateVehicleReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status, admin_note = "" } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền cập nhật báo cáo. Chỉ admin mới được phép.",
      });
    }

    const validStatuses = ["pending", "reviewing", "resolved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status không hợp lệ. Các status cho phép: pending, reviewing, resolved, rejected.",
      });
    }

    const report = await VehicleReport.findByPk(parseInt(report_id));

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Báo cáo không tồn tại.",
      });
    }

    await report.update({
      status,
      admin_note,
    });

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
        status: report.status,
        admin_note: report.admin_note,
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
