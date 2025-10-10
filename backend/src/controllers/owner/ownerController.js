import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import User from "../../models/User.js";
import { Op } from "sequelize";

// GET /api/owner/vehicles - Lấy danh sách xe của owner
export const getOwnerVehicles = async (req, res) => {
  try {
    const { search, sortBy = "created_at", sortOrder = "DESC", page = 1, limit = 10 } = req.query;
    const ownerId = req.user.userId;
    
    console.log("getOwnerVehicles - ownerId:", ownerId);
    console.log("getOwnerVehicles - req.user:", req.user);

    // Tính offset cho phân trang
    const offset = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm
    let whereCondition = { owner_id: ownerId };
    
    if (search) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { model: { [Op.like]: `%${search}%` } },
          { location: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Lấy danh sách xe với thông tin brand
    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"]
        },
        {
          model: User,
          as: "owner",
          attributes: ["user_id", "full_name", "email"],
          where: { user_id: ownerId } // Đảm bảo chỉ lấy xe của người dùng hiện tại
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting owner vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách xe",
      error: error.message
    });
  }
};

// GET /api/owner/vehicles/stats - Lấy thống kê xe của owner
export const getOwnerVehicleStats = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    
    console.log("getOwnerVehicleStats - ownerId:", ownerId);
    console.log("getOwnerVehicleStats - req.user:", req.user);

    const stats = await Vehicle.findAll({
      where: { owner_id: ownerId },
      attributes: [
        "status",
        "approvalStatus",
        [Vehicle.sequelize.fn("COUNT", Vehicle.sequelize.col("vehicle_id")), "count"]
      ],
      group: ["status", "approvalStatus"],
      raw: true
    });

    // Tính tổng số xe
    const totalVehicles = await Vehicle.count({
      where: { owner_id: ownerId }
    });

    // Tính tổng lượt thuê
    const totalRentals = await Vehicle.sum("rent_count", {
      where: { owner_id: ownerId }
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalRentals: totalRentals || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error("Error getting vehicle stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê xe",
      error: error.message
    });
  }
};

// GET /api/owner/vehicles/:id - Lấy thông tin chi tiết xe
export const getOwnerVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    const vehicle = await Vehicle.findOne({
      where: { 
        vehicle_id: id,
        owner_id: ownerId 
      },
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url", "country"]
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe"
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error("Error getting vehicle by id:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin xe",
      error: error.message
    });
  }
};

// POST /api/owner/vehicles - Thêm xe mới
export const createVehicle = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const vehicleData = {
      ...req.body,
      owner_id: ownerId,
      approvalStatus: "pending", // Mặc định chờ duyệt
      status: "available"
    };

    const vehicle = await Vehicle.create(vehicleData);

    // Lấy thông tin brand để trả về
    const vehicleWithBrand = await Vehicle.findByPk(vehicle.vehicle_id, {
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Thêm xe thành công",
      data: vehicleWithBrand
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm xe",
      error: error.message
    });
  }
};

// PUT /api/owner/vehicles/:id - Cập nhật thông tin xe
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra xe có thuộc về owner không
    const vehicle = await Vehicle.findOne({
      where: { 
        vehicle_id: id,
        owner_id: ownerId 
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe"
      });
    }

    // Cập nhật thông tin xe
    await vehicle.update(req.body);

    // Lấy thông tin xe đã cập nhật
    const updatedVehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"]
        }
      ]
    });

    res.json({
      success: true,
      message: "Cập nhật xe thành công",
      data: updatedVehicle
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật xe",
      error: error.message
    });
  }
};

// PATCH /api/owner/vehicles/:id/status - Cập nhật trạng thái xe
export const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.userId;

    // Kiểm tra xe có thuộc về owner không
    const vehicle = await Vehicle.findOne({
      where: { 
        vehicle_id: id,
        owner_id: ownerId 
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe"
      });
    }

    // Cập nhật trạng thái
    await vehicle.update({ status });

    res.json({
      success: true,
      message: `Xe đã được ${status === "blocked" ? "khóa" : "mở khóa"}`,
      data: { vehicle_id: id, status }
    });
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái xe",
      error: error.message
    });
  }
};

// DELETE /api/owner/vehicles/:id - Xóa xe
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.userId;

    // Kiểm tra xe có thuộc về owner không
    const vehicle = await Vehicle.findOne({
      where: { 
        vehicle_id: id,
        owner_id: ownerId 
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe"
      });
    }

    // Xóa xe
    await vehicle.destroy();

    res.json({
      success: true,
      message: "Xóa xe thành công"
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa xe",
      error: error.message
    });
  }
};



