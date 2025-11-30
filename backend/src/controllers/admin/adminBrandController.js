import Brand from "../../models/Brand.js";
import Vehicle from "../../models/Vehicle.js";
import { Op } from "sequelize";
import cloudinary from "../../config/cloudinary.js";

export const getAllBrands = async (req, res) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 10,
      sortBy = "newest",
    } = req.query;
    const where = {};

    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { country: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    if (category && ["car", "motorbike", "both"].includes(category)) {
      where.category = category;
    }

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(Math.min(parseInt(limit), 50), 1);
    const offset = (pageNum - 1) * limitNum;

    // === Sắp xếp theo tùy chọn ===
    let orderClause;
    switch (sortBy) {
      case "newest":
        orderClause = [["createdAt", "DESC"]]; // Mới nhất trước
        break;
      case "oldest":
        orderClause = [["createdAt", "ASC"]]; // Cũ nhất trước
        break;
      case "name":
        orderClause = [["name", "ASC"]]; // Tên A-Z
        break;
      default:
        orderClause = [["createdAt", "DESC"]]; // Mặc định: mới nhất
    }

    const { count, rows } = await Brand.findAndCountAll({
      where,
      order: orderClause,
      limit: limitNum,
      offset,
    });

    // === Thêm vehicle_count cho mỗi brand ===
    const brandsWithCount = await Promise.all(
      rows.map(async (brand) => {
        const vehicleCount = await Vehicle.count({
          where: { brand_id: brand.brand_id },
        });
        return {
          ...brand.toJSON(),
          vehicle_count: vehicleCount,
        };
      })
    );

    const stats = {
      total: await Brand.count({ where: {} }),
      car: await Brand.count({ where: { category: "car" } }),
      motorbike: await Brand.count({ where: { category: "motorbike" } }),
      both: await Brand.count({ where: { category: "both" } }),
    };

    return res.status(200).json({
      items: brandsWithCount,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
      },
      stats,
    });
  } catch (error) {
    console.error("admin getAllBrands error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name, country, logo_url, category = "both" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên thương hiệu là bắt buộc" });
    }

    if (!["car", "motorbike", "both"].includes(category)) {
      return res.status(400).json({ message: "Loại xe không hợp lệ" });
    }

    // === Check trùng tên (case-insensitive) ===
    const normalizedName = name.trim().toLowerCase();
    const exists = await Brand.findOne({
      where: {
        name: {
          [Op.like]: normalizedName,
        },
      },
    });
    if (exists) {
      return res.status(409).json({
        message: `Thương hiệu "${name.trim()}" đã tồn tại trong hệ thống`,
      });
    }

    let finalLogoUrl = logo_url?.trim() || null;

    // === Upload to Cloudinary if file exists ===
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "brands", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });
      finalLogoUrl = uploadResult.secure_url;
    }

    const brand = await Brand.create({
      name: name.trim(),
      country: country?.trim() || null,
      logo_url: finalLogoUrl,
      category,
    });

    return res.status(201).json({
      ...brand.toJSON(),
      vehicle_count: 0,
    });
  } catch (error) {
    console.error("admin createBrand error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { name, country, logo_url, category } = req.body;

    if (category && !["car", "motorbike", "both"].includes(category)) {
      return res.status(400).json({ message: "Loại xe không hợp lệ" });
    }

    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Thương hiệu không tồn tại" });
    }

    // === Check trùng tên khi update (nếu name thay đổi) ===
    if (
      name &&
      name.trim() &&
      name.trim().toLowerCase() !== brand.name.toLowerCase()
    ) {
      const normalizedNewName = name.trim().toLowerCase();
      const duplicate = await Brand.findOne({
        where: {
          brand_id: { [Op.ne]: brandId },
          name: {
            [Op.like]: normalizedNewName,
          },
        },
      });
      if (duplicate) {
        return res.status(409).json({
          message: `Thương hiệu "${name.trim()}" đã tồn tại trong hệ thống`,
        });
      }
    }

    const payload = {};

    if (typeof name === "string" && name.trim()) {
      payload.name = name.trim();
    }
    if (typeof country === "string") {
      payload.country = country.trim();
    }
    if (typeof logo_url === "string" && !req.file) {
      // Only set logo_url if no file is being uploaded
      payload.logo_url = logo_url.trim();
    }
    if (category) {
      payload.category = category;
    }

    // === Upload to Cloudinary if file exists ===
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "brands", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });
      payload.logo_url = uploadResult.secure_url;
    }

    await brand.update(payload);

    // === Get vehicle count ===
    const vehicleCount = await Vehicle.count({
      where: { brand_id: brand.brand_id },
    });

    return res.status(200).json({
      message: "Cập nhật thành công",
      brand: {
        ...brand.toJSON(),
        vehicle_count: vehicleCount,
      },
    });
  } catch (error) {
    console.error("admin updateBrand error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // === Check if brand has vehicles ===
    const vehicleCount = await Vehicle.count({
      where: { brand_id: brandId },
    });

    if (vehicleCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa thương hiệu này vì có ${vehicleCount} xe sử dụng thương hiệu này`,
      });
    }

    await brand.destroy();

    return res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("admin deleteBrand error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
