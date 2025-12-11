import db from "../../models/index.js";
import { Op } from "sequelize";
import cloudinary from '../../config/cloudinary.js';
import axios from "axios";

const { Vehicle, Brand, User, Booking } = db;

export const geocodeLocation = async (address) => {
  try {
    console.log("geocodeLocation - address:", address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;
    const res = await axios.get(url);
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocode error:", error.message);
    return null;
  }
};
// GET /api/owner/vehicles - Lấy danh sách xe của owner
export const getOwnerVehicles = async (req, res) => {
  try {
    const {
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
      page = 1,
      limit = 10,
    } = req.query;
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
          { license_plate: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    // Lấy danh sách xe với thông tin brand
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
          attributes: ["user_id", "full_name", "email"],
          where: { user_id: ownerId }, // Đảm bảo chỉ lấy xe của người dùng hiện tại
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
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
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting owner vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách xe",
      error: error.message,
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
        [
          Vehicle.sequelize.fn("COUNT", Vehicle.sequelize.col("vehicle_id")),
          "count",
        ],
      ],
      group: ["status", "approvalStatus"],
      raw: true,
    });

    // Tính tổng số xe
    const totalVehicles = await Vehicle.count({
      where: { owner_id: ownerId },
    });

    // Tính tổng lượt thuê
    const totalRentals = await Vehicle.sum("rent_count", {
      where: { owner_id: ownerId },
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalRentals: totalRentals || 0,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    console.error("Error getting vehicle stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê xe",
      error: error.message,
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
        owner_id: ownerId,
      },
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url", "country"],
        },
      ],
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    // Parse JSON strings to arrays (similar to renter controller)
    const vehicleData = vehicle.toJSON();
    if (
      vehicleData.extra_images &&
      typeof vehicleData.extra_images === "string"
    ) {
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

    res.json({
      success: true,
      data: vehicleData,
      vehicle: vehicleData,
    });
  } catch (error) {
    console.error("Error getting vehicle by id:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin xe",
      error: error.message,
    });
  }
};

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "rentzy/vehicles",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

// POST /api/owner/vehicles - Thêm xe mới
export const createVehicle = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    
    // Extract form data from multipart/form-data
    const {
      vehicle_type,
      brand,
      model,
      year,
      license_plate,
      price_per_day,
      location,
      description,
      fuel_type,
      transmission,
      seats,
      engine_capacity,
      fuel_consumption,
      body_type,
      latitude,
      longitude,
      features,
      require_owner_confirmation,
    } = req.body;

    const parsedYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(parsedYear) || parsedYear > currentYear) {
      return res.status(400).json({
        success: false,
        message: `Năm sản xuất phải nhỏ hơn hoặc bằng ${currentYear}`,
      });
    }

    const mainImageCount = (req.files && req.files.main_image) ? req.files.main_image.length : 0;
    if (mainImageCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Hình ảnh chính bắt buộc và chỉ được chọn 1 ảnh",
      });
    }
    const extraImageCount = (req.files && req.files.extra_images) ? req.files.extra_images.length : 0;
    if (extraImageCount < 5) {
      return res.status(400).json({
        success: false,
        message: "Phần hình ảnh bổ sung phải có tối thiểu 5 ảnh",
      });
    }

    // Handle image uploads
    let main_image_url = null;
    let additional_images = [];

    // Upload main image if provided
    if (req.files && req.files.main_image && req.files.main_image[0]) {
      const mainImageResult = await uploadImageToCloudinary(req.files.main_image[0]);
      main_image_url = mainImageResult.url;
    }

    // Upload additional images if provided
    if (req.files && req.files.extra_images) {
      const results = await Promise.allSettled(
        req.files.extra_images.map((file) => uploadImageToCloudinary(file))
      );
      additional_images = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value.url);
    }

    let vehicleData = {
      vehicle_type,
      model,
      year: parseInt(year),
      license_plate,
      price_per_day: parseFloat(price_per_day),
      location,
      description,
      fuel_type,
      transmission,
      seats: seats ? parseInt(seats) : null,
      engine_capacity,
      fuel_consumption,
      body_type,
      main_image_url,
      additional_images: additional_images.length > 0 ? JSON.stringify(additional_images) : null,
      owner_id: ownerId,
      approvalStatus: "pending", // Mặc định chờ duyệt
      status: "available",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      extra_images: JSON.stringify(additional_images),
      features: features ? JSON.parse(features) : null,
      require_owner_confirmation: require_owner_confirmation === undefined
        ? false
        : String(require_owner_confirmation).toLowerCase() === 'true'
    };

    // Xử lý brand: nếu gửi tên brand thì tìm brand_id
    if (brand && !vehicleData.brand_id) {
      const existingBrand = await Brand.findOne({
        where: {
          name: {
            [Op.like]: `%${brand}%`
          }
        }
      });
      
      if (existingBrand) {
        vehicleData.brand_id = existingBrand.brand_id;
      } else {
        // Nếu không tìm thấy brand, tạo brand mới
        const newBrand = await Brand.create({
          name: brand,
          category: vehicle_type || 'car'
        });
        vehicleData.brand_id = newBrand.brand_id;
      }
    }

    const vehicle = await Vehicle.create(vehicleData);

    // Lấy thông tin brand để trả về
    const vehicleWithBrand = await Vehicle.findByPk(vehicle.vehicle_id, {
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Thêm xe thành công",
      data: vehicleWithBrand,
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    
    // Xử lý lỗi unique constraint cho license_plate
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors && error.errors[0] && error.errors[0].path === 'license_plate') {
        return res.status(400).json({
          success: false,
          message: "Biển số xe đã tồn tại trong hệ thống",
          error: "DUPLICATE_LICENSE_PLATE",
        });
      }
    }
    
    // Xử lý lỗi validation khác
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        error: error.errors.map(err => err.message).join(', '),
      });
    }
    
    // Lỗi server khác
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm xe",
      error: error.message,
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
        owner_id: ownerId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    // Extract form data from multipart/form-data
    const {
      vehicle_type,
      brand,
      model,
      year,
      license_plate,
      price_per_day,
      location,
      description,
      fuel_type,
      transmission,
      seats,
      bike_type,
      engine_capacity,
      fuel_consumption,
      body_type,
      latitude,
      longitude,
      features,
      require_owner_confirmation,
    } = req.body;

    // Handle image uploads
    let main_image_url = vehicle.main_image_url; // Keep existing if no new image
    let additional_images = [];

    // Parse existing extra images
    try {
      if (vehicle.extra_images && typeof vehicle.extra_images === 'string') {
        additional_images = JSON.parse(vehicle.extra_images);
      }
    } catch (e) {
      additional_images = [];
    }

    // Upload new main image if provided
    if (req.files && req.files.main_image && req.files.main_image[0]) {
      const mainImageResult = await uploadImageToCloudinary(req.files.main_image[0]);
      main_image_url = mainImageResult.url;
    }

    // Upload new additional images if provided
    if (req.files && req.files.extra_images) {
      const results = await Promise.allSettled(
        req.files.extra_images.map((file) => uploadImageToCloudinary(file))
      );
      additional_images = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value.url);
    }

    let updateData = {
      model,
      year: year ? parseInt(year) : vehicle.year,
      license_plate,
      price_per_day: price_per_day ? parseFloat(price_per_day) : vehicle.price_per_day,
      location,
      description,
      fuel_type,
      transmission,
      seats: seats ? parseInt(seats) : vehicle.seats,
      bike_type,
      engine_capacity,
      fuel_consumption,
      body_type,
      main_image_url,
      extra_images: JSON.stringify(additional_images),
      latitude: latitude ? parseFloat(latitude) : vehicle.latitude,
      longitude: longitude ? parseFloat(longitude) : vehicle.longitude,
      features: features ? JSON.parse(features) : vehicle.features,
      ...(require_owner_confirmation !== undefined
        ? {
            require_owner_confirmation:
              String(require_owner_confirmation).toLowerCase() === 'true'
          }
        : {})
    };

    // Xử lý brand: nếu gửi tên brand thì tìm brand_id
    if (brand && brand !== vehicle.brand?.name) {
      const existingBrand = await Brand.findOne({
        where: {
          name: {
            [Op.like]: `%${brand}%`
          }
        }
      });
      
      if (existingBrand) {
        updateData.brand_id = existingBrand.brand_id;
      } else {
        // Nếu không tìm thấy brand, tạo brand mới
        const newBrand = await Brand.create({
          name: brand,
          category: vehicle_type || vehicle.vehicle_type || 'car'
        });
        updateData.brand_id = newBrand.brand_id;
      }
    }

    // Cập nhật thông tin xe
    await vehicle.update(updateData);

    // Lấy thông tin xe đã cập nhật
    const updatedVehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["brand_id", "name", "logo_url"],
        },
      ],
    });

    // Parse JSON strings to arrays for response
    const vehicleData = updatedVehicle.toJSON();
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

    res.json({
      success: true,
      message: "Cập nhật xe thành công",
      vehicle: vehicleData,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    
    // Xử lý lỗi unique constraint cho license_plate
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors && error.errors[0] && error.errors[0].path === 'license_plate') {
        return res.status(400).json({
          success: false,
          message: "Biển số xe đã tồn tại trong hệ thống",
          error: "DUPLICATE_LICENSE_PLATE",
        });
      }
    }
    
    // Xử lý lỗi validation khác
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        error: error.errors.map(err => err.message).join(', '),
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật xe",
      error: error.message,
    });
  }
};

// PATCH /api/owner/vehicles/:id/status - Cập nhật trạng thái xe
export const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.userId;
    const userRole = req.user.role; // Lấy role từ token

    // Kiểm tra xe có thuộc về owner không
    const vehicle = await Vehicle.findOne({
      where: {
        vehicle_id: id,
        owner_id: ownerId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    // Kiểm tra nếu owner cố gắng mở khóa xe bị admin khóa
    if (
      status === "available" && 
      vehicle.status === "blocked" && 
      vehicle.blocked_by === "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Không thể mở khóa, xe đã bị khóa bởi admin",
      });
    }

    // Cập nhật trạng thái và người khóa
    await vehicle.update({ 
      status,
      blocked_by: status === "blocked" ? "owner" : null
    });

    res.json({
      success: true,
      message: `Xe đã được ${status === "blocked" ? "khóa" : "mở khóa"}`,
      data: { 
        vehicle_id: id, 
        status,
        blocked_by: status === "blocked" ? "owner" : null
      },
    });
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái xe",
      error: error.message,
    });
  }
};

// PATCH /api/owner/vehicles/:id/confirmation - Bật/tắt yêu cầu chủ xe xác nhận đơn thuê
export const updateRequireOwnerConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const { require_owner_confirmation } = req.body || {};
    const ownerId = req.user.userId;

    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: id, owner_id: ownerId },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    if (require_owner_confirmation === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu trường require_owner_confirmation",
      });
    }

    const value = String(require_owner_confirmation).toLowerCase() === 'true';
    await vehicle.update({ require_owner_confirmation: value });

    return res.json({
      success: true,
      message: value
        ? "Đã bật yêu cầu chủ xe xác nhận đơn thuê"
        : "Đã tắt yêu cầu chủ xe xác nhận đơn thuê",
      data: { vehicle_id: id, require_owner_confirmation: value },
    });
  } catch (error) {
    console.error("Error updating require_owner_confirmation:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật xác nhận chủ xe",
      error: error.message,
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
        owner_id: ownerId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    // Xóa xe
    await vehicle.destroy();

    res.json({
      success: true,
      message: "Xóa xe thành công",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa xe",
      error: error.message,
    });
  }
};
