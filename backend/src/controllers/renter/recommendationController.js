// controllers/renter/recommendationController.js
import db from "../../models/index.js";
import Vehicle from "../../models/Vehicle.js";
import Brand from "../../models/Brand.js";
import BookingReview from "../../models/BookingReview.js";
import Booking from "../../models/Booking.js";
import { Op } from "sequelize";

export const getRecommendations = async (req, res) => {
  try {
    const { limit = 8 } = req.query; // Mặc định 8
    const userId = req.user ? req.user.userId : null; // Từ softAuth middleware
    let totalHistoryItems = 0;
    let historyItems = [];
    let message = "Gợi ý xe phổ biến (dựa trên đánh giá cao nhất)";
    let recommendations = [];
    if (userId) {
      // Bước 1: Lấy lịch sử từ 3 nguồn trong 1 tuần (7 ngày) - Chỉ cho logged-in user
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const historyWhere = {
        user_id: userId,
        created_at: { [Op.gte]: oneWeekAgo },
      };
      const recentSearches = await db.SearchHistory.findAll({
        where: historyWhere,
        order: [["created_at", "DESC"]],
        limit: 20, // Giới hạn 20 để perf, đủ cho score
      });
      const recentViews = await db.ViewHistory.findAll({
        where: historyWhere,
        order: [["created_at", "DESC"]],
        limit: 20,
        include: [{ model: Vehicle, as: "Vehicle" }],
      });
      const completedBookings = await db.Booking.findAll({
        where: {
          renter_id: userId,
          status: "completed",
          end_date: { [Op.gte]: oneWeekAgo },
        },
        order: [["end_date", "DESC"]],
        limit: 20,
        include: [{ model: Vehicle, as: "vehicle" }],
      });
      totalHistoryItems =
        recentSearches.length + recentViews.length + completedBookings.length;
      // Bước 2: Chuẩn bị history items
      recentSearches.forEach((s) =>
        historyItems.push({ type: "search", data: s.search_params })
      );
      recentViews.forEach((v) => {
        const veh = v.Vehicle;
        historyItems.push({
          type: "view",
          data: {
            type: veh.vehicle_type,
            brand_id: veh.brand_id,
            price_per_day: veh.price_per_day,
            location: veh.location,
            transmission: veh.transmission,
            fuel_type: veh.fuel_type,
            vehicle_id: veh.vehicle_id, // Thêm để match exact
          },
        });
      });
      completedBookings.forEach((b) => {
        const veh = b.vehicle;
        historyItems.push({
          type: "booking",
          data: {
            type: veh.vehicle_type,
            brand_id: veh.brand_id,
            price_per_day: veh.price_per_day,
            location: veh.location,
            transmission: veh.transmission,
            fuel_type: veh.fuel_type,
            vehicle_id: veh.vehicle_id, // Thêm để match exact
          },
        });
      });
      if (totalHistoryItems > 0) {
        // Bước 3: Lấy tất cả vehicles available
        const allVehicles = await Vehicle.findAll({
          where: {
            approvalStatus: "approved",
            status: "available",
          },
          include: [{ model: Brand, as: "brand" }],
          limit: 100, // Giới hạn để perf
        });
        // Bước 4: Tính similarity score (cải thiện)
        const scoredVehicles = allVehicles
          .map((vehicle) => {
            let totalScore = 0;
            let count = 0;
            historyItems.forEach((historyItem) => {
              let score = 0;
              const hData = historyItem.data;
              // Type match (cao nhất)
              if (hData.type === vehicle.vehicle_type) score += 1;
              // Brand match
              if (hData.brand_id === vehicle.brand_id) score += 0.5;
              // Price match: Cải thiện cho search (range) và view/booking (exact tolerance)
              if (hData.price_per_day) {
                // View/booking: tolerance 20%
                const tolerance = hData.price_per_day * 0.2;
                if (
                  Math.abs(vehicle.price_per_day - hData.price_per_day) <=
                  tolerance
                )
                  score += 0.3;
              } else if (hData.min_price && hData.max_price) {
                // Search: check trong range
                if (
                  vehicle.price_per_day >= parseFloat(hData.min_price) &&
                  vehicle.price_per_day <= parseFloat(hData.max_price)
                )
                  score += 0.3;
              }
              // Location: Full lowercase match (cải thiện)
              if (
                hData.location &&
                vehicle.location
                  .toLowerCase()
                  .includes(hData.location.toLowerCase())
              )
                score += 0.2;
              // Transmission (car only)
              if (
                vehicle.vehicle_type === "car" &&
                hData.transmission === vehicle.transmission
              )
                score += 0.15;
              // Fuel type (car only)
              if (
                vehicle.vehicle_type === "car" &&
                hData.fuel_type === vehicle.fuel_type
              )
                score += 0.15;
              // Exact vehicle match (view/booking)
              if (
                (historyItem.type === "view" ||
                  historyItem.type === "booking") &&
                hData.vehicle_id === vehicle.vehicle_id
              )
                score += 2; // Boost cao cho exact
              totalScore += score;
              count++;
            });
            const averageScore = count > 0 ? totalScore / count : 0;
            return { vehicle, averageScore };
          })
          .filter((item) => item.averageScore > 0.2) // Giảm threshold để match history ít
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, parseInt(limit)) // Top N matching
          .map((item) => item.vehicle);
        // Bước 5: Pad nếu scored < limit: Thêm xe rating cao (không overlap)
        let finalRecommendations = scoredVehicles;
        if (scoredVehicles.length < parseInt(limit)) {
          const needed = parseInt(limit) - scoredVehicles.length;
          const scoredIds = new Set(scoredVehicles.map((v) => v.vehicle_id));
          // Lấy xe rating cao để pad (tương tự fallback, nhưng không overlap)
          const ratingVehicles = await Vehicle.findAll({
            where: {
              approvalStatus: "approved",
              status: "available",
              vehicle_id: { [Op.notIn]: Array.from(scoredIds) },
            },
            include: [{ model: Brand, as: "brand" }],
            limit: needed * 2, // Lấy dư để sort rating
          });
          const paddedWithRating = await Promise.all(
            ratingVehicles.map(async (vehicle) => {
              const ownerId = vehicle.owner_id;
              const reviews = await BookingReview.findAll({
                attributes: ["rating"],
                include: [
                  {
                    model: Booking,
                    as: "booking",
                    attributes: ["renter_id"],
                    include: [
                      {
                        model: Vehicle,
                        attributes: [],
                        where: { owner_id: ownerId },
                        required: true,
                        as: "vehicle",
                      },
                    ],
                  },
                ],
                limit: 50,
              });
              const ratings = reviews
                .map((r) => Number(r.rating) || 0)
                .filter((n) => !Number.isNaN(n));
              const averageRating = ratings.length
                ? Number(
                    (
                      ratings.reduce((a, b) => a + b, 0) / ratings.length
                    ).toFixed(1)
                  )
                : 0;
              return {
                ...vehicle.toJSON(),
                rating: averageRating,
                owner_rating_summary: {
                  average: averageRating,
                  count: ratings.length,
                },
              };
            })
          );
          // Sort padded by rating DESC
          paddedWithRating.sort((a, b) => b.rating - a.rating);
          const padded = paddedWithRating.slice(0, needed);
          finalRecommendations = [...scoredVehicles, ...padded];
        } else {
          // Nếu >= limit, chỉ compute rating cho top scored
          finalRecommendations = await Promise.all(
            scoredVehicles.map(async (vehicle) => {
              const ownerId = vehicle.owner_id;
              const reviews = await BookingReview.findAll({
                attributes: ["rating"],
                include: [
                  {
                    model: Booking,
                    as: "booking",
                    attributes: ["renter_id"],
                    include: [
                      {
                        model: Vehicle,
                        attributes: [],
                        where: { owner_id: ownerId },
                        required: true,
                        as: "vehicle",
                      },
                    ],
                  },
                ],
                limit: 50,
              });
              const ratings = reviews
                .map((r) => Number(r.rating) || 0)
                .filter((n) => !Number.isNaN(n));
              const averageRating = ratings.length
                ? Number(
                    (
                      ratings.reduce((a, b) => a + b, 0) / ratings.length
                    ).toFixed(1)
                  )
                : 0;
              return {
                ...vehicle.toJSON(),
                rating: averageRating,
                owner_rating_summary: {
                  average: averageRating,
                  count: ratings.length,
                },
              };
            })
          );
        }
        recommendations = finalRecommendations;
        message = `Gợi ý dựa trên hành vi của bạn trong 1 tuần qua (${totalHistoryItems} items)`;
      } else {
        // User logged in nhưng no history: Fallback global (giữ nguyên rating)
        message =
          "Chào mừng! Gợi ý xe phổ biến cho bạn (dựa trên đánh giá cao nhất)";
      }
    } else {
      // Guest: Force fallback global (top rent_count)
      message = "Gợi ý xe phổ biến cho bạn (dựa trên số lượt thuê cao nhất)";
    }
    // Fallback global: Chỉ chạy nếu chưa có recommendations
    if (recommendations.length === 0) {
      if (userId) {
        // User logged-in no history: Giữ nguyên fallback rating (như cũ)
        const allVehicles = await Vehicle.findAll({
          where: {
            approvalStatus: "approved",
            status: "available",
          },
          include: [{ model: Brand, as: "brand" }],
          limit: 50, // Tăng để cover top
        });
        recommendations = await Promise.all(
          allVehicles.map(async (vehicle) => {
            const ownerId = vehicle.owner_id;
            const reviews = await BookingReview.findAll({
              attributes: ["rating"],
              include: [
                {
                  model: Booking,
                  as: "booking",
                  attributes: ["renter_id"],
                  include: [
                    {
                      model: Vehicle,
                      attributes: [],
                      where: { owner_id: ownerId },
                      required: true,
                      as: "vehicle",
                    },
                  ],
                },
              ],
              limit: 50,
            });
            const ratings = reviews
              .map((r) => Number(r.rating) || 0)
              .filter((n) => !Number.isNaN(n));
            const averageRating = ratings.length
              ? Number(
                  (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(
                    1
                  )
                )
              : 0;
            return {
              ...vehicle.toJSON(),
              rating: averageRating,
              owner_rating_summary: {
                average: averageRating,
                count: ratings.length,
              },
            };
          })
        );
        recommendations.sort((a, b) => b.rating - a.rating);
        recommendations = recommendations.slice(0, parseInt(limit));
      } else {
        // Guest: Top rent_count DESC (không rating, nhanh hơn)
        recommendations = await Vehicle.findAll({
          where: {
            approvalStatus: "approved",
            status: "available",
          },
          include: [{ model: Brand, as: "brand" }],
          order: [["rent_count", "DESC"]], // FIX: Sort theo rent_count DESC
          limit: parseInt(limit), // Trực tiếp limit 8
        });
        // Map để toJSON() nếu cần (giữ nguyên data)
        recommendations = recommendations.map((v) => v.toJSON());
      }
    }
    // Response
    res.json({
      success: true,
      data: recommendations,
      message,
      debug:
        process.env.NODE_ENV === "development"
          ? {
              // Chỉ debug ở dev
              userId: userId ? "logged_in" : "guest",
              totalHistoryItems,
              historyTypes:
                historyItems.length > 0
                  ? [...new Set(historyItems.map((h) => h.type))]
                  : [],
            }
          : undefined,
    });
  } catch (error) {
    console.error("Lỗi gợi ý:", error);
    res.status(500).json({ success: false, message: "Lỗi server gợi ý xe" });
  }
};
