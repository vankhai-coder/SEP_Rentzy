import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import BookingReview from "../../models/BookingReview.js";
import ViewHistory from "../../models/ViewHistory.js";
import { Op } from "sequelize";
import db from "../../models/index.js";
// Lấy tất cả vehicles (filter theo type: car/motorbike, chỉ approved)
export const getAllVehicles = async (req, res) => {
  try {
    const { type, page = 1, limit = 8 } = req.query; // **SỬA: limit default = 16**
    if (type && !["car", "motorbike"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vehicle type" });
    }
    const where = {
      vehicle_type: type || undefined, // Nếu không có type, lấy tất cả
      approvalStatus: "approved", // Chỉ lấy xe đã duyệt
      status: "available", // chỉ lấy xe ở trạng thái available
    };
    // Loại bỏ undefined fields
    Object.keys(where).forEach(
      (key) => where[key] === undefined && delete where[key]
    );
    // Sử dụng findAndCountAll để lấy data + total count cho pagination
    // Giữ nguyên: Attributes include literal để tính average rating
    const { count: total, rows: vehicles } = await Vehicle.findAndCountAll({
      where,
      attributes: {
        include: [
          // MỚI: Tính average rating (không thêm rating_count vì dùng rent_count sẵn)
          [
            db.sequelize.literal(`(
              COALESCE(
                ROUND(
                  (SELECT AVG(br.rating * 1.0)
                   FROM booking_reviews br
                   JOIN bookings b ON br.booking_id = b.booking_id
                   WHERE b.vehicle_id = Vehicle.vehicle_id
                   AND b.status = 'completed'),
                  1
                ),
                5.0
              )
            )`),
            "rating",
          ],
        ],
      },
      limit: parseInt(limit), // Giới hạn số lượng
      offset: (parseInt(page) - 1) * parseInt(limit), // Offset cho page
      order: [["created_at", "DESC"]], // Thêm order để sort mới nhất trước (tùy chọn)
    });
    // Parse JSON strings và tính rating cho mỗi vehicle (giữ nguyên logic cũ)
    const vehicleData = vehicles.map((vehicle) => {
      const data = vehicle.toJSON();
      if (data.extra_images && typeof data.extra_images === "string") {
        try {
          data.extra_images = JSON.parse(data.extra_images);
        } catch (e) {
          data.extra_images = [];
        }
      }
      if (data.features && typeof data.features === "string") {
        try {
          data.features = JSON.parse(data.features);
        } catch (e) {
          data.features = [];
        }
      }
      // Đảm bảo rating là number, fallback 5.0
      data.rating = parseFloat(data.rating) || 5.0;
      return data;
    });
    // Trả về cấu trúc mới với pagination
    res.json({
      success: true,
      data: {
        vehicles: vehicleData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total, // Tổng số xe matching where
          totalPages: Math.ceil(total / parseInt(limit)), // **ĐÃ CÓ: Tự tính số trang**
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Lấy chi tiết 1 vehicle theo id (chỉ nếu approved, hoặc nếu renter là owner của xe)
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    let vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    const owner = await User.findByPk(vehicle.owner_id);

    // Parse JSON strings to arrays
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

    // Include owner data in vehicle object
    vehicleData.owner = owner;

    // === LẤY CÁC ĐÁNH GIÁ VỀ CHỦ XE (chỉ số sao + nội dung + người thuê) ===
    const ownerId = vehicle.owner_id;
    const reviews = await BookingReview.findAll({
      attributes: ["review_id", "rating", "review_content", "created_at"],
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["renter_id"], // tối giản
          include: [
            {
              model: Vehicle,
              attributes: [], // không cần trả dữ liệu xe
              where: { owner_id: ownerId },
              required: true,
              as: "vehicle",
            },
            {
              model: User,
              as: "renter",
              attributes: ["user_id", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    vehicleData.owner_comments = reviews.map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.review_content,
      created_at: r.created_at,
      renter: r.booking?.renter
        ? {
            user_id: r.booking.renter.user_id,
            full_name: r.booking.renter.full_name,
            avatar_url: r.booking.renter.avatar_url,
          }
        : null,
    }));

    // Tóm tắt điểm trung bình và số lượng đánh giá để FE hiển thị nhanh
    const ratings = vehicleData.owner_comments
      .map((rv) => Number(rv.rating) || 0)
      .filter((n) => !Number.isNaN(n));
    vehicleData.owner_rating_summary = {
      average: ratings.length
        ? Number(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          )
        : 0,
      count: ratings.length,
    };

    // Log view history (nếu user logged in) - FIX: Thêm dedup để tránh multiple calls
    if (req.user && req.user.userId) {
      try {
        const userId = req.user.userId;
        // THÊM: Check recent view (trong 10 giây) để dedup
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
        const recentView = await ViewHistory.findOne({
          where: {
            user_id: userId,
            vehicle_id: parseInt(id),
            created_at: { [Op.gte]: tenSecondsAgo },
          },
        });
        if (recentView) {
          // Update duration nếu cần (tăng dần, hoặc giữ nguyên)
          console.log(
            `[DEBUG] Skip duplicate ViewHistory: Recent view exists for user ${userId}, vehicle ${id}`
          );
          // Optional: recentView.duration_seconds += 10; await recentView.save();
        } else {
          // Create new nếu chưa có recent
          console.log(
            `[DEBUG] Creating ViewHistory: user_id=${userId}, vehicle_id=${id}`
          );
          await ViewHistory.create({
            user_id: userId,
            vehicle_id: parseInt(id),
            duration_seconds: 30, // Default, có thể update sau nếu track thời gian
          });
          console.log(`[DEBUG] ViewHistory created successfully`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed ViewHistory:`, error);
      }
    }

    res.json({ success: true, data: vehicleData });
  } catch (error) {
    console.error("Error fetching vehicle by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
