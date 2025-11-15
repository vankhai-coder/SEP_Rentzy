import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";
import Booking from "../../models/Booking.js";
import BookingReview from "../../models/BookingReview.js";

// Lấy tất cả vehicles (filter theo type: car/motorbike, chỉ approved)
export const getAllVehicles = async (req, res) => {
  try {
    const { type } = req.query; // Ví dụ: /api/renter/vehicles?type=car
    if (type && !["car", "motorbike"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vehicle type" });
    }
    const where = {
      vehicle_type: type || undefined, // Nếu không có type, lấy tất cả
      approvalStatus: "approved",// Chỉ lấy xe đã duyệt
      status: "available", // chỉ lấy xe ở trạng thái available
    };
    // Loại bỏ undefined fields
    Object.keys(where).forEach(
      (key) => where[key] === undefined && delete where[key]
    );

    const vehicles = await Vehicle.findAll({ where });
    res.json({ success: true, data: vehicles });
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

    res.json({ success: true, data: vehicleData });
  } catch (error) {
    console.error("Error fetching vehicle by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
