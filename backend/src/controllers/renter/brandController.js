import Brand from "../../models/Brand.js";
import { Op } from "sequelize";
import Vehicle from "../../models/Vehicle.js";
// Lấy tất cả brand
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy brand theo category (car / motorbike / both)
export const getBrandsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ["car", "motorbike", "both"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    let condition = {};
    if (category === "car") {
      condition = { category: { [Op.or]: ["car", "both"] } };
    } else if (category === "motorbike") {
      condition = { category: { [Op.or]: ["motorbike", "both"] } };
    } else {
      condition = { category: "both" }; // nếu gọi trực tiếp both
    }

    const brands = await Brand.findAll({ where: condition });
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/renter/brandController.js
export const getVehiclesByBrand = async (req, res) => {
  try {
    const { brand_id } = req.params; // ← Đây là string từ URL
    const { page = 1, limit = 8, vehicle_type } = req.query;

    // FIX CHÍNH TẠI ĐÂY – ÉP KIỂU VỀ SỐ NGUYÊN
    const brandId = parseInt(brand_id, 10);
    if (isNaN(brandId)) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ message: "Invalid page or limit" });
    }

    // Dùng số nguyên để tìm brand và lọc xe
    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const whereClause = {
      brand_id: brandId, // ← Dùng số, không dùng string
      status: "available",
      approvalStatus: "approved",
    };

    if (vehicle_type && ["car", "motorbike"].includes(vehicle_type)) {
      whereClause.vehicle_type = vehicle_type;
    }

    const totalCount = await Vehicle.count({ where: whereClause });

    const offset = (pageNum - 1) * limitNum;
    const vehicles = await Vehicle.findAll({
      where: whereClause,
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["name", "logo_url", "country"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      brand,
      vehicles,
      count: vehicles.length,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching vehicles by brand:", error);
    res.status(500).json({ message: "Server error" });
  }
};
