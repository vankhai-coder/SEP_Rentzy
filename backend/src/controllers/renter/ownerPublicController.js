import db from "../../models/index.js";
import { Op, Sequelize } from "sequelize";

const { User, Vehicle, Brand, Booking, BookingReview } = db;

export const getOwnerPublicProfile = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const id = parseInt(ownerId);
    if (!id || isNaN(id) || id < 1) {
      return res.status(400).json({ success: false, message: "ID chủ xe không hợp lệ" });
    }

    const owner = await User.findByPk(id, {
      attributes: ["user_id", "full_name", "avatar_url"],
    });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chủ xe" });
    }

    const vehicles = await Vehicle.findAll({
      where: { owner_id: id, approvalStatus: "approved", status: "available" },
      include: [{ model: Brand, as: "brand", attributes: ["name", "logo_url"] }],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              COALESCE(
                ROUND(
                  (SELECT AVG(br.rating * 1.0)
                   FROM booking_reviews br
                   JOIN bookings b ON br.booking_id = b.booking_id
                   WHERE b.vehicle_id = Vehicle.vehicle_id),
                  1
                ),
                5.0
              )
            )`),
            "rating",
          ],
        ],
      },
      order: [["created_at", "DESC"]],
      limit: 30,
    });

    const tripsCompleted = await Booking.count({
      include: [{ model: Vehicle, as: "vehicle", where: { owner_id: id }, required: true }],
      where: { status: "completed" },
    });

    const ownerReviews = await BookingReview.findAll({
      attributes: ["review_id", "rating", "review_content", "created_at"],
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["vehicle_id", "renter_id"],
          required: true,
          where: { status: "completed" },
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: ["model"],
              where: { owner_id: id },
              required: true,
            },
            { model: User, as: "renter", attributes: ["user_id", "full_name", "avatar_url"] },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    const ratingCount = ownerReviews.length;
    const ratingAvg = ratingCount
      ? Number(
          (
            ownerReviews.reduce((s, rv) => s + Number(rv.rating || 0), 0) /
            ratingCount
          ).toFixed(1)
        )
      : 0;

    const confirmRequiredBookings = await Booking.findAll({
      include: [{ model: Vehicle, as: "vehicle", where: { owner_id: id, require_owner_confirmation: true } }],
      attributes: ["status", "created_at", "updated_at"],
    });
    const totalConfirm = confirmRequiredBookings.length;
    const responded = confirmRequiredBookings.filter((b) => b.status !== "pending");
    const acceptedStatuses = new Set(["confirmed", "deposit_paid", "fully_paid", "in_progress", "completed"]);
    const accepted = responded.filter((b) => acceptedStatuses.has(b.status));
    const responseRate = totalConfirm ? Math.round((responded.length / totalConfirm) * 100) : 0;
    const acceptanceRate = responded.length ? Math.round((accepted.length / responded.length) * 100) : 0;
    const avgResponseMinutes = responded.length
      ? Math.round(
          responded.reduce((sum, b) => sum + (new Date(b.updated_at) - new Date(b.created_at)) / 60000, 0) /
            responded.length
        )
      : 0;

    const normalizedReviews = ownerReviews.map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.review_content || "",
      created_at: r.created_at,
      renter: r.booking?.renter
        ? {
            user_id: r.booking.renter.user_id,
            full_name: r.booking.renter.full_name,
            avatar_url: r.booking.renter.avatar_url,
          }
        : null,
    }));

    return res.json({
      success: true,
      data: {
        owner,
        metrics: {
          trips: tripsCompleted,
          rating_avg: ratingAvg,
          rating_count: ratingCount,
          response_rate: responseRate,
          avg_response_minutes: avgResponseMinutes,
          acceptance_rate: acceptanceRate,
        },
        vehicles,
        reviews: normalizedReviews,
      },
    });
  } catch (error) {
    console.error("Error getOwnerPublicProfile:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};