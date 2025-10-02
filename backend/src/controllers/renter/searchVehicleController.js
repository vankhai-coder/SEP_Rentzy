// controllers/renter/searchVehicleController.js
import { Op } from "sequelize";
import db from "../../models/index.js"; // Import db để lấy sequelize
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";

export const searchVehicles = async (req, res) => {
  try {
    const {
      type, // "car" hoặc "motorbike" - required
      location, // string, optional
      brand_id, // integer, optional
      start_date, // YYYY-MM-DD, optional
      end_date, // YYYY-MM-DD, optional
      min_price, // decimal, optional
      max_price, // decimal, optional
      year_min, // integer, optional
      year_max, // integer, optional
      page = 1,
      limit = 12,
      sort_by = "price_per_day", // "price_per_day" hoặc "year"
      sort_order = "ASC", // "ASC" hoặc "DESC"
    } = req.query;

    // Validation (giữ nguyên)
    if (!type || !["car", "motorbike"].includes(type)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Loại xe không hợp lệ (car hoặc motorbike)",
        });
    }
    if (start_date && end_date) {
      const start = new Date(start_date + "T00:00:00");
      const end = new Date(end_date + "T23:59:59");
      if (end <= start) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Ngày kết thúc phải sau ngày bắt đầu",
          });
      }
    }
    if (min_price && (isNaN(min_price) || parseFloat(min_price) < 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Giá tối thiểu không hợp lệ" });
    }
    if (max_price && (isNaN(max_price) || parseFloat(max_price) < 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Giá tối đa không hợp lệ" });
    }
    if (year_min && (isNaN(year_min) || parseInt(year_min) < 1900)) {
      return res
        .status(400)
        .json({ success: false, message: "Năm tối thiểu không hợp lệ" });
    }
    if (year_max && (isNaN(year_max) || parseInt(year_max) > 2030)) {
      return res
        .status(400)
        .json({ success: false, message: "Năm tối đa không hợp lệ" });
    }

    // Build where clause cơ bản cho Vehicle
    const vehicleWhere = {
      vehicle_type: type,
      status: "available",
      approvalStatus: "approved",
    };

    const andConditions = [];

    if (location) {
      andConditions.push(
        db.sequelize.where(
          db.sequelize.fn("LOWER", db.sequelize.col("location")),
          "LIKE",
          db.sequelize.fn("LOWER", `%${location}%`)
        )
      );
    }
    if (brand_id && !isNaN(brand_id)) {
      vehicleWhere.brand_id = parseInt(brand_id);
    }
    if (min_price) {
      andConditions.push({
        price_per_day: { [Op.gte]: parseFloat(min_price) },
      });
    }
    if (max_price) {
      andConditions.push({
        price_per_day: { [Op.lte]: parseFloat(max_price) },
      });
    }
    if (year_min) {
      andConditions.push({ year: { [Op.gte]: parseInt(year_min) } });
    }
    if (year_max) {
      andConditions.push({ year: { [Op.lte]: parseInt(year_max) } });
    }

    if (andConditions.length > 0) {
      vehicleWhere[Op.and] = andConditions;
    }

    // Xử lý availability nếu có thời gian
    let finalWhere = vehicleWhere;
    if (start_date && end_date) {
      // Fix: Dùng alias Sequelize 'Vehicle.vehicle_id' cho correlated subquery
      const availabilityCondition = db.sequelize.where(
        db.sequelize.literal(`(
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.vehicle_id = Vehicle.vehicle_id 
          AND b.status IN ('confirmed', 'in_progress', 'deposit_paid')
          AND NOT (b.end_date < '${start_date}' OR b.start_date > '${end_date}')
        )`),
        0 // Count phải = 0
      );
      finalWhere[Op.and] = [
        ...(finalWhere[Op.and] || []),
        availabilityCondition,
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Count total
    const total = await Vehicle.count({
      where: finalWhere,
      include: [{ model: Brand }],
    });

    // Fetch data
    const vehicles = await Vehicle.findAll({
      where: finalWhere,
      include: [
        {
          model: Brand,
          attributes: ["name", "logo_url", "category"],
        },
      ],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm xe:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tìm kiếm xe" });
  }
};
