import db from "../../models/index.js";
import { Op } from "sequelize";

const { Vehicle, User, Brand, Notification } = db;

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
          attributes: ["user_id", "full_name", "email"],
        },
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
          attributes: ["user_id", "full_name", "email"],
        },
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
        content: `Xe ${vehicle.model} (${vehicle.license_plate}) đã bị từ chối. Lý do: ${reason || "không cung cấp"}.`,
        type: "alert",
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (e) {
      console.error("Error creating notification for rejected vehicle:", e);
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