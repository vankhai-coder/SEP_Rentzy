// controllers/renter/searchVehicleController.js
import { Op } from "sequelize";
import db from "../../models/index.js"; // Import db để lấy sequelize
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import SearchHistory from "../../models/SearchHistory.js";
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
      // New filters based on slide filters
      transmission, // "manual" or "automatic" for cars
      fuel_type, // "petrol", "diesel", "electric", "hybrid" for cars
      min_seats, // integer, optional for cars (FIX: Đổi từ seats sang min_seats để match frontend)
      max_seats, // integer, optional for cars
      bike_type, // "scooter", "manual", "clutch", "electric" for motorbikes
      min_engine_capacity, // integer, optional for motorbikes
      max_engine_capacity, // integer, optional for motorbikes
      page = 1,
      limit = 12,
      sort_by = "price_per_day", // "price_per_day" hoặc "year"
      sort_order = "ASC", // "ASC" hoặc "DESC"
    } = req.query;

    // Validation (giữ nguyên và thêm mới)
    if (!type || !["car", "motorbike"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại xe không hợp lệ (car hoặc motorbike)",
      });
    }
    if (start_date && end_date) {
      const start = new Date(start_date + "T00:00:00");
      const end = new Date(end_date + "T23:59:59");
      if (end <= start) {
        return res.status(400).json({
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
    // FIX: Thêm check cho "undefined" string từ frontend (an toàn, dù frontend đã fix)
    if (transmission === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid transmission param" });
    }
    // New validations
    if (
      transmission &&
      type === "car" &&
      !["manual", "automatic"].includes(transmission)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Loại hộp số không hợp lệ" });
    }
    if (
      fuel_type &&
      type === "car" &&
      !["petrol", "diesel", "electric", "hybrid"].includes(fuel_type)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Loại nhiên liệu không hợp lệ" });
    }
    if (min_seats && (isNaN(min_seats) || parseInt(min_seats) < 1)) {
      // FIX: Đổi từ seats sang min_seats
      return res.status(400).json({
        success: false,
        message: "Số chỗ ngồi tối thiểu không hợp lệ",
      });
    }
    if (max_seats && (isNaN(max_seats) || parseInt(max_seats) < 1)) {
      return res
        .status(400)
        .json({ success: false, message: "Số chỗ ngồi tối đa không hợp lệ" });
    }
    if (
      bike_type &&
      type === "motorbike" &&
      !["scooter", "manual", "clutch", "electric"].includes(bike_type)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Loại xe máy không hợp lệ" });
    }
    if (
      min_engine_capacity &&
      (isNaN(min_engine_capacity) || parseInt(min_engine_capacity) < 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dung tích động cơ tối thiểu không hợp lệ",
      });
    }
    if (
      max_engine_capacity &&
      (isNaN(max_engine_capacity) || parseInt(max_engine_capacity) < 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dung tích động cơ tối đa không hợp lệ",
      });
    }
    if (brand_id && (isNaN(brand_id) || parseInt(brand_id) < 1)) {
      return res
        .status(400)
        .json({ success: false, message: "ID hãng xe không hợp lệ" });
    }
    // Thêm validation cho pagination và sort
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Số trang không hợp lệ" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      // Giới hạn max 100 để tránh overload
      return res
        .status(400)
        .json({ success: false, message: "Giới hạn trang không hợp lệ" });
    }
    if (!["price_per_day", "year"].includes(sort_by)) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu chí sắp xếp không hợp lệ" });
    }
    if (!["ASC", "DESC"].includes(sort_order)) {
      return res
        .status(400)
        .json({ success: false, message: "Thứ tự sắp xếp không hợp lệ" });
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

    // New filter conditions
    if (type === "car") {
      if (transmission) {
        andConditions.push({ transmission });
      }
      if (fuel_type) {
        andConditions.push({ fuel_type });
      }
      if (min_seats) {
        // FIX: Sử dụng min_seats cho filter >= (không còn seats)
        andConditions.push({ seats: { [Op.gte]: parseInt(min_seats) } });
      }
      if (max_seats) {
        andConditions.push({ seats: { [Op.lte]: parseInt(max_seats) } });
      }
    } else if (type === "motorbike") {
      if (bike_type) {
        andConditions.push({ bike_type });
      }
      if (min_engine_capacity) {
        andConditions.push({
          engine_capacity: { [Op.gte]: parseInt(min_engine_capacity) },
        });
      }
      if (max_engine_capacity) {
        andConditions.push({
          engine_capacity: { [Op.lte]: parseInt(max_engine_capacity) },
        });
      }
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
    const offset = (pageNum - 1) * limitNum;

    // Count total - FIX: Thêm as: 'brand' vào include để khớp alias
    const total = await Vehicle.count({
      where: finalWhere,
      include: [{ model: Brand, as: "brand" }], // SỬA: Thêm as: 'brand'
    });

    // Fetch data - FIX: Thêm as: 'brand' vào include
    const vehicles = await Vehicle.findAll({
      where: finalWhere,
      include: [
        {
          model: Brand,
          attributes: ["name", "logo_url", "category"],
          as: "brand", // SỬA: Thêm as: 'brand'
        },
      ],
      order: [[sort_by, sort_order]],
      limit: limitNum,
      offset,
    });

    // Log search (nếu user logged in)
    const userId = req.user ? req.user.userId : null;
    try {
      const searchParams = {
        type,
        location,
        brand_id: brand_id ? parseInt(brand_id) : null,
        start_date,
        end_date,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        year_min: year_min ? parseInt(year_min) : null,
        year_max: year_max ? parseInt(year_max) : null,
        transmission,
        fuel_type,
        min_seats: min_seats ? parseInt(min_seats) : null,
        max_seats: max_seats ? parseInt(max_seats) : null,
        bike_type,
        min_engine_capacity: min_engine_capacity
          ? parseInt(min_engine_capacity)
          : null,
        max_engine_capacity: max_engine_capacity
          ? parseInt(max_engine_capacity)
          : null,
        page: pageNum,
        limit: limitNum,
        sort_by,
        sort_order,
      };
      console.log(
        `[DEBUG] Creating SearchHistory: user_id=${userId}, params=${JSON.stringify(
          searchParams
        )}`
      );
      await SearchHistory.create({
        user_id: userId, // Có thể null cho guest
        search_params: searchParams,
        results_count: total,
      });
      console.log(`[DEBUG] SearchHistory created successfully`);
    } catch (searchError) {
      console.error(
        `[ERROR] Failed to create SearchHistory for user ${userId}:`,
        searchError
      );
      // Không throw error để tránh break API
    }

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm xe:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tìm kiếm xe" });
  }
};
