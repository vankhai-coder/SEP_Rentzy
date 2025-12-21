// controllers/renter/searchVehicleController.js
import { Op } from "sequelize";
import db from "../../models/index.js";
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import SearchHistory from "../../models/SearchHistory.js";

// ✅ CONSTANTS: Buffer time giữa các booking (phút)
const BUFFER_TIME_MINUTES = 60; // 1 giờ để vệ sinh/giao xe

export const searchVehicles = async (req, res) => {
  try {
    const {
      type, // "car" hoặc "motorbike" - required
      location,
      brand_id,
      start_date,
      end_date,
      start_time, // ✅ HH:mm hoặc HH:mm:ss
      end_time, // ✅ HH:mm hoặc HH:mm:ss
      min_price,
      max_price,
      year_min,
      year_max,
      transmission,
      fuel_type,
      seats,
      bike_type,
      engine_capacity,
      body_type,
      page = 1,
      limit = 8,
      sort_by = "price_per_day",
      sort_order = "ASC",
    } = req.query;

    // ==================== VALIDATION CƠ BẢN ====================
    if (!type || !["car", "motorbike"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại xe không hợp lệ (car hoặc motorbike)",
      });
    }

    // ==================== XỬ LÝ NGÀY GIỜ ====================
    let hasValidDateRange = false;
    let searchStartDate = null;
    let searchStartTime = null;
    let searchEndDate = null;
    let searchEndTime = null;

    if (start_date && end_date && start_time && end_time) {
      // ✅ Validate format ngày (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng ngày không hợp lệ (YYYY-MM-DD)",
        });
      }

      // ✅ Chuẩn hóa time format (HH:mm → HH:mm:ss)
      const normalizeTime = (timeStr) => {
        if (!timeStr) return "00:00:00";
        // Nếu chỉ có HH:mm → thêm :00
        if (/^\d{2}:\d{2}$/.test(timeStr)) return `${timeStr}:00`;
        // Nếu đã có HH:mm:ss → giữ nguyên
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
        return "00:00:00";
      };

      searchStartDate = start_date;
      searchStartTime = normalizeTime(start_time);
      searchEndDate = end_date;
      searchEndTime = normalizeTime(end_time);

      // ✅ Validate datetime logic (để kiểm tra trước khi query)
      const startDT = new Date(`${searchStartDate}T${searchStartTime}`);
      const endDT = new Date(`${searchEndDate}T${searchEndTime}`);

      if (isNaN(startDT.getTime()) || isNaN(endDT.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày hoặc giờ không hợp lệ",
        });
      }

      if (endDT <= startDT) {
        return res.status(400).json({
          success: false,
          message: "Thời gian kết thúc phải sau thời gian bắt đầu",
        });
      }

      hasValidDateRange = true;
    }

    // Các validation khác
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
    if (
      year_min &&
      (isNaN(year_min) ||
        parseInt(year_min) < 1900 ||
        parseInt(year_min) > 2030)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Năm tối thiểu không hợp lệ" });
    }
    if (
      year_max &&
      (isNaN(year_max) ||
        parseInt(year_max) < 1900 ||
        parseInt(year_max) > 2030)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Năm tối đa không hợp lệ" });
    }
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
    if (seats && (isNaN(seats) || parseInt(seats) < 1)) {
      return res.status(400).json({
        success: false,
        message: "Số chỗ ngồi không hợp lệ",
      });
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
      engine_capacity &&
      (isNaN(engine_capacity) || parseInt(engine_capacity) < 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dung tích động cơ không hợp lệ",
      });
    }
    if (brand_id && (isNaN(brand_id) || parseInt(brand_id) < 1)) {
      return res
        .status(400)
        .json({ success: false, message: "ID hãng xe không hợp lệ" });
    }
    if (
      body_type &&
      type === "car" &&
      ![
        "sedan",
        "suv",
        "hatchback",
        "convertible",
        "coupe",
        "minivan",
        "pickup",
        "van",
        "mpv",
      ].includes(body_type)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Kiểu dáng thân xe không hợp lệ" });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 8, 100);
    if (isNaN(pageNum) || pageNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Số trang không hợp lệ" });
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

    // ==================== BUILD WHERE CLAUSE ====================
    const baseVehicleWhere = {
      vehicle_type: type,
      status: "available",
      approvalStatus: "approved",
    };

    // Base conditions cho filter options
    const baseConditions = [];
    if (location) {
      baseConditions.push(
        db.sequelize.where(
          db.sequelize.fn("LOWER", db.sequelize.col("location")),
          "LIKE",
          `%${location.toLowerCase()}%`
        )
      );
    }
    if (min_price)
      baseConditions.push({
        price_per_day: { [Op.gte]: parseFloat(min_price) },
      });
    if (max_price)
      baseConditions.push({
        price_per_day: { [Op.lte]: parseFloat(max_price) },
      });
    if (year_min)
      baseConditions.push({ year: { [Op.gte]: parseInt(year_min) } });
    if (year_max)
      baseConditions.push({ year: { [Op.lte]: parseInt(year_max) } });

    // Options where (FULL, chỉ base)
    const optionsWhere = { ...baseVehicleWhere };
    if (baseConditions.length > 0) {
      optionsWhere[Op.and] = baseConditions;
    }

    // Full conditions cho vehicles
    const fullConditions = [...baseConditions];
    if (brand_id && !isNaN(brand_id)) {
      fullConditions.push({ brand_id: parseInt(brand_id) });
    }
    if (type === "car") {
      if (transmission) fullConditions.push({ transmission });
      if (fuel_type) fullConditions.push({ fuel_type });
      if (seats) fullConditions.push({ seats: parseInt(seats) });
      if (body_type) fullConditions.push({ body_type });
    } else if (type === "motorbike") {
      if (bike_type) fullConditions.push({ bike_type });
      if (engine_capacity)
        fullConditions.push({
          engine_capacity: parseInt(engine_capacity),
        });
    }
    let finalWhere = { ...baseVehicleWhere };
    if (fullConditions.length > 0) {
      finalWhere[Op.and] = fullConditions;
    }

    // ==================== ✅ BLOCK XE ĐÃ ĐẶT (CÓ BUFFER TIME 1 GIỜ) ====================
    if (hasValidDateRange) {
      /*
       * LOGIC OVERLAP VỚI BUFFER TIME:
       *
       * Booking cũ: end_date + end_time = endDateTime
       * Buffer: endDateTime + 1 giờ = availableFrom
       *
       * Booking mới CHỈ hợp lệ nếu:
       * 1. Bắt đầu SAU khi booking cũ kết thúc + buffer: searchStart >= availableFrom
       *    HOẶC
       * 2. Kết thúc TRƯỚC khi booking cũ bắt đầu - buffer: searchEnd <= (bookedStart - buffer)
       *
       * SQL: Loại bỏ xe nếu:
       * - Booking cũ bắt đầu (có buffer) < Search kết thúc
       * - Booking cũ kết thúc (có buffer) > Search bắt đầu
       */

      const blockBookedVehicles = db.sequelize.literal(`
        Vehicle.vehicle_id NOT IN (
          SELECT b.vehicle_id
          FROM bookings b
          WHERE b.status IN ('pending', 'confirmed', 'fully_paid', 'in_progress', 'deposit_paid')
            AND (
              TIMESTAMP(b.start_date, b.start_time) - INTERVAL ${BUFFER_TIME_MINUTES} MINUTE < TIMESTAMP('${searchEndDate}', '${searchEndTime}')
              AND
              TIMESTAMP(b.end_date, b.end_time) + INTERVAL ${BUFFER_TIME_MINUTES} MINUTE > TIMESTAMP('${searchStartDate}', '${searchStartTime}')
            )
        )
      `);

      finalWhere[Op.and] = finalWhere[Op.and] || [];
      finalWhere[Op.and].push(blockBookedVehicles);
    }

    // ==================== QUERY DATA ====================
    const offset = (pageNum - 1) * limitNum;

    const total = await Vehicle.count({
      where: finalWhere,
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["name", "logo_url", "category"],
        },
      ],
    });

    const vehicles = await Vehicle.findAll({
      where: finalWhere,
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["name", "logo_url", "category"],
        },
      ],
      order: [[sort_by, sort_order]],
      limit: limitNum,
      offset,
    });

    // ==================== FETCH FILTER OPTIONS ====================
    let filterOptions = { brands: [] };

    if (type === "car") {
      // Unique seats
      const seatsRes = await Vehicle.findAll({
        where: optionsWhere,
        attributes: [
          [db.sequelize.fn("DISTINCT", db.sequelize.col("seats")), "seats"],
        ],
        order: [[db.sequelize.col("seats"), "ASC"]],
        raw: true,
      });
      filterOptions.availableSeats = seatsRes
        .map((r) => r.seats)
        .filter((s) => s != null && s > 0);

      // Unique body_types
      const bodyRes = await Vehicle.findAll({
        where: optionsWhere,
        attributes: [
          [
            db.sequelize.fn("DISTINCT", db.sequelize.col("body_type")),
            "body_type",
          ],
        ],
        order: [[db.sequelize.col("body_type"), "ASC"]],
        raw: true,
      });
      filterOptions.availableBodyTypes = bodyRes
        .map((r) => r.body_type)
        .filter((b) => b != null);

      // Unique brands
      const brandsRes = await Vehicle.findAll({
        where: optionsWhere,
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["brand_id", "name", "logo_url"],
          },
        ],
        group: [
          db.sequelize.col("brand.brand_id"),
          db.sequelize.col("brand.name"),
          db.sequelize.col("brand.logo_url"),
        ],
        raw: true,
      });
      filterOptions.brands = brandsRes.map((r) => ({
        brand_id: r["brand.brand_id"],
        name: r["brand.name"],
        logo_url: r["brand.logo_url"],
      }));
    } else if (type === "motorbike") {
      // Unique bike_types
      const bikeRes = await Vehicle.findAll({
        where: optionsWhere,
        attributes: [
          [
            db.sequelize.fn("DISTINCT", db.sequelize.col("bike_type")),
            "bike_type",
          ],
        ],
        order: [[db.sequelize.col("bike_type"), "ASC"]],
        raw: true,
      });
      filterOptions.availableBikeTypes = bikeRes
        .map((r) => r.bike_type)
        .filter((b) => b != null);

      // Unique engine_capacities
      const engineRes = await Vehicle.findAll({
        where: optionsWhere,
        attributes: [
          [
            db.sequelize.fn("DISTINCT", db.sequelize.col("engine_capacity")),
            "engine_capacity",
          ],
        ],
        order: [[db.sequelize.col("engine_capacity"), "ASC"]],
        raw: true,
      });
      filterOptions.availableEngineCapacities = engineRes
        .map((r) => r.engine_capacity)
        .filter((e) => e != null);

      // Unique brands
      const brandsRes = await Vehicle.findAll({
        where: optionsWhere,
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: ["brand_id", "name", "logo_url"],
          },
        ],
        group: [
          db.sequelize.col("brand.brand_id"),
          db.sequelize.col("brand.name"),
          db.sequelize.col("brand.logo_url"),
        ],
        raw: true,
      });
      filterOptions.brands = brandsRes.map((r) => ({
        brand_id: r["brand.brand_id"],
        name: r["brand.name"],
        logo_url: r["brand.logo_url"],
      }));
    }

    // ==================== LƯU SEARCH HISTORY ====================
    const userId = req.user?.userId || null;
    try {
      const searchParams = {
        type,
        location: location || null,
        brand_id: brand_id ? parseInt(brand_id) : null,
        start_date: searchStartDate,
        end_date: searchEndDate,
        start_time: searchStartTime,
        end_time: searchEndTime,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        year_min: year_min ? parseInt(year_min) : null,
        year_max: year_max ? parseInt(year_max) : null,
        transmission: transmission || null,
        fuel_type: fuel_type || null,
        seats: seats ? parseInt(seats) : null,
        bike_type: bike_type || null,
        engine_capacity: engine_capacity ? parseInt(engine_capacity) : null,
        body_type: body_type || null,
        page: pageNum,
        limit: limitNum,
        sort_by,
        sort_order,
      };
      await SearchHistory.create({
        user_id: userId,
        search_params: searchParams,
        results_count: total,
      });
    } catch (searchError) {
      console.error("[ERROR] Failed to save SearchHistory:", searchError);
    }

    // ==================== RESPONSE ====================
    res.json({
      success: true,
      data: vehicles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum) || 1,
      },
      filterOptions,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm xe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm xe",
    });
  }
};
