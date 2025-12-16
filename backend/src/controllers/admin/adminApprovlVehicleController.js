import db from "../../models/index.js";
import { Op } from "sequelize";
import { sendEmail } from "../../utils/email/sendEmail.js";
import {
  vehicleApprovalNotificationTemplate,
  vehicleRejectionNotificationTemplate,
} from "../../utils/email/templates/emailTemplate.js";

const { Vehicle, User, Brand, Notification, FeatureFlag } = db;

// GET /api/admin/approval-vehicles - Lấy danh sách xe chờ duyệt
export const getPendingVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      sortOrder = "DESC",
      search = "",
    } = req.query;

    const offset = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm - chỉ lấy xe có trạng thái pending
    let whereCondition = {
      approvalStatus: "pending"
    };

    if (search) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { model: { [Op.like]: `%${search}%` } },
          { license_plate: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    // Lấy danh sách xe chờ duyệt với thông tin owner và brand
    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Parse JSON strings to arrays for response
    const vehiclesData = vehicles.map(vehicle => {
      const vehicleData = vehicle.toJSON();
      if (vehicleData.extra_images && typeof vehicleData.extra_images === "string") {
        try {
          vehicleData.extra_images = JSON.parse(vehicleData.extra_images);
        } catch (e) {
          vehicleData.extra_images = [];
        }
      }
      if (vehicleData.features && typeof vehicleData.features === "string") {
        try {
          vehicleData.features = JSON.parse(vehicleData.features);
        } catch (e) {
          vehicleData.features = [];
        }
      }
      return vehicleData;
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        vehicles: vehiclesData,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting pending vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách xe chờ duyệt",
      error: error.message,
    });
  }
};

// PATCH /api/admin/approval-vehicles/:id/approve - Chấp nhận xe
export const approveVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm xe cần duyệt
    const vehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email", "updatedEmail"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["name"]
        }
      ],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    if (vehicle.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Xe không ở trạng thái chờ duyệt",
      });
    }

    // Cập nhật trạng thái thành approved
    await vehicle.update({ 
      approvalStatus: "approved",
      updated_at: new Date()
    });

    try {
      await Notification.create({
        user_id: vehicle.owner?.user_id,
        title: "Xe đã được duyệt",
        content: `Xe ${vehicle.model} (${vehicle.license_plate}) đã được duyệt, bây giờ người dùng có thể thuê.`,
        type: "rental",
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } catch (e) {
      console.error("Error creating notification for approved vehicle:", e);
    }

    try {
      const to = (vehicle.owner?.email || vehicle.owner?.updatedEmail || "").trim();
      if (to) {
        const dashboardLink = `${process.env.CLIENT_ORIGIN}/owner/vehicle-management`;
        const v = vehicle?.toJSON ? vehicle.toJSON() : vehicle;
        const detailsText = [
          `- Loại phương tiện: ${v.vehicle_type || ""}`,
          `- Hãng xe: ${v.brand?.name || ""}`,
          `- Mẫu xe: ${v.model || ""}`,
          `- Biển số: ${v.license_plate || ""}`,
          `- Năm sản xuất: ${v.year || ""}`,
          `- Giá/ngày: ${typeof v.price_per_day !== "undefined" ? Number(v.price_per_day).toLocaleString("vi-VN") + " VNĐ" : ""}`,
          `- Vị trí: ${v.location || ""}`,
          `- Truyền động: ${v.transmission || ""}`,
          `- Kiểu thân xe: ${v.body_type || ""}`,
          `- Số chỗ ngồi: ${typeof v.seats !== "undefined" ? v.seats : ""}`,
          `- Nhiên liệu: ${v.fuel_type || ""}`,
          `- Loại xe máy: ${v.bike_type || ""}`,
          `- Dung tích động cơ: ${typeof v.engine_capacity !== "undefined" ? v.engine_capacity : ""}`,
          `- Mức tiêu thụ: ${v.fuel_consumption || ""}`,
          `- Yêu cầu chủ xe xác nhận: ${v.require_owner_confirmation ? "Có" : "Không"}`,
          `- Trạng thái: ${v.status || ""}`,
          `- Trạng thái duyệt: ${v.approvalStatus || ""}`,
          `- Số lượt thuê: ${typeof v.rent_count !== "undefined" ? v.rent_count : 0}`,
          `- Tọa độ: ${[v.latitude, v.longitude].filter((x) => typeof x !== "undefined" && x !== null).join(", ")}`,
          `- Tính năng: ${Array.isArray(v.features) ? v.features.join(", ") : (typeof v.features === "object" ? JSON.stringify(v.features) : (v.features || ""))}`,
        ].filter(Boolean).join("\n");
        const html = vehicleApprovalNotificationTemplate({
          ownerName: vehicle.owner?.full_name || "",
          vehicleModel: vehicle.model || "",
          licensePlate: vehicle.license_plate || "",
          dashboardLink,
          detailsText,
        });
        await sendEmail({
          from: process.env.GMAIL_USER,
          to,
          subject: "Xe của bạn đã được duyệt",
          html,
        });
      } else {
        console.warn("Owner email is missing. Skipped sending approval email for vehicle:", id);
      }
    } catch (emailErr) {
      console.error("Error sending approval email:", emailErr);
    }

    res.json({
      success: true,
      message: "Xe đã được chấp nhận",
      data: {
        vehicle_id: id,
        approvalStatus: "approved",
        owner: vehicle.owner,
      },
    });
  } catch (error) {
    console.error("Error approving vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chấp nhận xe",
      error: error.message,
    });
  }
};

// PATCH /api/admin/approval-vehicles/:id/reject - Từ chối xe
export const rejectVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {}; // Lý do từ chối (tùy chọn)

    // Tìm xe cần duyệt
    const vehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email", "updatedEmail"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["name"]
        }
      ],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    if (vehicle.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Xe không ở trạng thái chờ duyệt",
      });
    }

  // Cập nhật trạng thái thành rejected
  await vehicle.update({ 
    approvalStatus: "rejected",
    updated_at: new Date()
  });

    try {
      await Notification.create({
        user_id: vehicle.owner?.user_id,
        title: "Xe bị từ chối",
        content: `Xe ${vehicle.model} (${vehicle.license_plate}) đã bị từ chối.\n${(reason || "")
          .replace(/\s*-\s*/g, '\n- ')
          .trim()}`,
        type: "alert",
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (e) {
      console.error("Error creating notification for rejected vehicle:", e);
    }

    try {
      const to = (vehicle.owner?.email || vehicle.owner?.updatedEmail || "").trim();
      if (to) {
        const dashboardLink = `${process.env.CLIENT_ORIGIN}/owner/vehicle-management`;
        const v = vehicle?.toJSON ? vehicle.toJSON() : vehicle;
        const detailsText = [
          `- Loại phương tiện: ${v.vehicle_type || ""}`,
          `- Hãng xe: ${v.brand?.name || ""}`,
          `- Mẫu xe: ${v.model || ""}`,
          `- Biển số: ${v.license_plate || ""}`,
          `- Năm sản xuất: ${v.year || ""}`,
          `- Giá/ngày: ${typeof v.price_per_day !== "undefined" ? Number(v.price_per_day).toLocaleString("vi-VN") + " VNĐ" : ""}`,
          `- Vị trí: ${v.location || ""}`,
          `- Truyền động: ${v.transmission || ""}`,
          `- Kiểu thân xe: ${v.body_type || ""}`,
          `- Số chỗ ngồi: ${typeof v.seats !== "undefined" ? v.seats : ""}`,
          `- Nhiên liệu: ${v.fuel_type || ""}`,
          `- Loại xe máy: ${v.bike_type || ""}`,
          `- Dung tích động cơ: ${typeof v.engine_capacity !== "undefined" ? v.engine_capacity : ""}`,
          `- Mức tiêu thụ: ${v.fuel_consumption || ""}`,
          `- Yêu cầu chủ xe xác nhận: ${v.require_owner_confirmation ? "Có" : "Không"}`,
          `- Trạng thái: ${v.status || ""}`,
          `- Trạng thái duyệt: ${v.approvalStatus || ""}`,
          `- Số lượt thuê: ${typeof v.rent_count !== "undefined" ? v.rent_count : 0}`,
          `- Tọa độ: ${[v.latitude, v.longitude].filter((x) => typeof x !== "undefined" && x !== null).join(", ")}`,
          `- Tính năng: ${Array.isArray(v.features) ? v.features.join(", ") : (typeof v.features === "object" ? JSON.stringify(v.features) : (v.features || ""))}`,
        ].filter(Boolean).join("\n");
        const html = vehicleRejectionNotificationTemplate({
          ownerName: vehicle.owner?.full_name || "",
          vehicleModel: vehicle.model || "",
          licensePlate: vehicle.license_plate || "",
          dashboardLink,
          reason: (reason || "").replace(/\s*-\s*/g, '\n- ').trim(),
          detailsText,
        });
        await sendEmail({
          from: process.env.GMAIL_USER,
          to,
          subject: "Xe của bạn đã bị từ chối",
          html,
        });
      } else {
        console.warn("Owner email is missing. Skipped sending rejection email for vehicle:", id);
      }
    } catch (emailErr) {
      console.error("Error sending rejection email:", emailErr);
    }

    res.json({
      success: true,
      message: "Xe đã bị từ chối",
      data: {
        vehicle_id: id,
        approvalStatus: "rejected",
        reason: reason || null,
        owner: vehicle.owner,
      },
    });
  } catch (error) {
    console.error("Error rejecting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối xe",
      error: error.message,
    });
  }
};

// GET /api/admin/approval-vehicles/stats - Thống kê xe theo trạng thái duyệt
export const getApprovalStats = async (req, res) => {
  try {
    const stats = await Vehicle.findAll({
      attributes: [
        'approvalStatus',
        [db.sequelize.fn('COUNT', db.sequelize.col('vehicle_id')), 'count']
      ],
      group: ['approvalStatus'],
      raw: true
    });

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      none: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.approvalStatus] = parseInt(stat.count);
    });

    res.json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Error getting approval stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê duyệt xe",
      error: error.message,
    });
  }
};

// PATCH /api/admin/approval-vehicles/auto-approve-flag - Bật/tắt tự động duyệt
export const setAutoApproveFlag = async (req, res) => {
  try {
    const { enabled } = req.body || {};
    const value = Boolean(enabled);
    const [flag, created] = await FeatureFlag.findOrCreate({
      where: { key: "AUTO_APPROVE_VEHICLE" },
      defaults: {
        key: "AUTO_APPROVE_VEHICLE",
        enabled: value,
        description: "Bật/tắt cron tự động kiểm tra AI và duyệt/từ chối xe chờ duyệt",
      },
    });
    if (!created) {
      await flag.update({ enabled: value, updated_at: new Date() });
    }
    return res.json({ success: true, enabled: value });
  } catch (error) {
    console.error("Error setting auto-approve flag:", error);
    return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái tự động duyệt" });
  }
};

// GET /api/admin/approval-vehicles/auto-approve-flag - Lấy trạng thái tự động duyệt
export const getAutoApproveFlag = async (req, res) => {
  try {
    const flag = await FeatureFlag.findOne({ where: { key: "AUTO_APPROVE_VEHICLE" } });
    return res.json({ success: true, enabled: !!(flag && flag.enabled) });
  } catch (error) {
    console.error("Error getting auto-approve flag:", error);
    return res.status(500).json({ success: false, message: "Lỗi khi lấy trạng thái tự động duyệt" });
  }
};
