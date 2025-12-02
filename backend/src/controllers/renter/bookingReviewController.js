// controllers/renter/bookingReviewController.js
import db from "../../models/index.js";
import { checkContentModeration } from "../../services/contentModerationService.js";

const { Booking, BookingReview, Vehicle, User, PointsTransaction } = db;

export const createBookingReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { booking_id, rating, review_content } = req.body;
    const renter_id = req.user.userId;

    // 1️⃣ Kiểm tra thông tin đầu vào
    if (!booking_id || !rating) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (booking_id, rating)",
        isModerationError: false,
      });
    }

    // 🆕 1.5️⃣ KIỂM TRA NỘI DUNG BẰNG AI
    if (review_content && review_content.trim()) {
      console.log("🔍 Đang kiểm tra nội dung đánh giá bằng AI...");

      try {
        const moderationResult = await checkContentModeration(review_content);

        if (!moderationResult.isValid) {
          console.log("⛔ Nội dung bị từ chối:", moderationResult.reason);
          await transaction.rollback();

          // ✅ FIX: Trả về status 400 + JSON đầy đủ với flag và reason
          return res.status(400).json({
            success: false,
            message: "Nội dung đánh giá không phù hợp",
            reason: moderationResult.reason,
            isModerationError: true,
          });
        }

        console.log("✅ Nội dung đánh giá hợp lệ");
      } catch (aiError) {
        console.error("⚠️ AI moderation failed:", aiError.message);
        // Không return, cho phép đánh giá tiếp tục
      }
    }

    // 2️⃣ Kiểm tra booking có tồn tại và thuộc về renter này
    const booking = await Booking.findOne({
      where: { booking_id, renter_id },
      transaction,
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn thuê này.",
        isModerationError: false,
      });
    }

    // 3️⃣ Kiểm tra trạng thái booking (phải completed)
    if (booking.status !== "completed") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá sau khi đơn thuê đã hoàn tất.",
        isModerationError: false,
      });
    }

    // 4️⃣ Kiểm tra xem đã đánh giá đơn này chưa
    const existingReview = await BookingReview.findOne({
      where: { booking_id },
      transaction,
    });

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá đơn thuê này rồi.",
        isModerationError: false,
      });
    }

    // 5️⃣ Tạo review
    const newReview = await BookingReview.create(
      {
        booking_id,
        rating,
        review_content,
      },
      { transaction }
    );

    // 6️⃣ Cộng điểm cho renter
    const POINTS_REWARD = 5000;
    const user = await User.findByPk(renter_id, { transaction });

    if (!user) {
      throw new Error("Không tìm thấy người dùng.");
    }

    const newBalance = user.points + POINTS_REWARD;
    await user.update({ points: newBalance }, { transaction });

    // 7️⃣ Ghi lịch sử điểm
    await PointsTransaction.create(
      {
        user_id: renter_id,
        transaction_type: "earn",
        points_amount: POINTS_REWARD,
        balance_after: newBalance,
        reference_type: "booking",
        reference_id: booking_id,
        description: "Thưởng điểm khi đánh giá xe",
      },
      { transaction }
    );

    // 8️⃣ Lấy thông tin xe
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: booking.vehicle_id },
      attributes: ["vehicle_id", "model", "main_image_url", "owner_id"],
      transaction,
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Đánh giá thành công! Bạn được thưởng 5,000 điểm.",
      review: newReview,
      vehicle,
      points_rewarded: POINTS_REWARD,
      new_balance: newBalance,
      isModerationError: false,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating booking review:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá.",
      error: error.message,
      isModerationError: false,
    });
  }
};

// Lấy tất cả review của 1 xe (để hiện ở View xe)
export const getReviewsByVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.params;

    const reviews = await BookingReview.findAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { vehicle_id },
          attributes: ["vehicle_id", "renter_id"],
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: [
                "vehicle_id",
                "model",
                "main_image_url",
                "license_plate",
                "price_per_day",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy đánh giá." });
  }
};

// ✅ CẬP NHẬT: Lấy tất cả review của người dùng với PHÂN TRANG
export const getMyReviews = async (req, res) => {
  try {
    const renter_id = req.user.userId;
    const { sortBy = "created_at", page = 1, limit = 3 } = req.query;

    // Tính offset
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Xác định thứ tự sắp xếp
    let orderClause = [["created_at", "DESC"]];
    if (sortBy === "start_date") {
      orderClause = [["booking", "start_date", "DESC"]];
    } else if (sortBy === "rating") {
      orderClause = [["rating", "DESC"]];
    }

    // Lấy tổng số reviews để tính totalPages
    const totalReviews = await BookingReview.count({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { renter_id },
          attributes: [],
        },
      ],
    });

    // Lấy reviews theo phân trang
    const reviews = await BookingReview.findAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: { renter_id },
          attributes: [
            "booking_id",
            "vehicle_id",
            "start_date",
            "end_date",
            "total_amount",
            "status",
          ],
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: [
                "vehicle_id",
                "model",
                "main_image_url",
                "license_plate",
                "price_per_day",
              ],
            },
          ],
        },
      ],
      order: orderClause,
      limit: limitNum,
      offset: offset,
    });

    const totalPages = Math.max(1, Math.ceil(totalReviews / limitNum));

    res.json({
      success: true,
      reviews,
      totalReviews,
      currentPage: pageNum,
      totalPages,
      itemsPerPage: limitNum,
      sortBy,
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá của người dùng: ", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá của bạn.",
    });
  }
};

// Xóa đánh giá booking
export const deleteBookingReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { review_id } = req.params;
    const renter_id = req.user.userId;

    // 1️⃣ Tìm review và kiểm tra thuộc về renter
    const review = await BookingReview.findOne({
      where: { review_id },
      include: [
        {
          model: Booking,
          as: "booking",
          where: { renter_id },
          attributes: ["booking_id", "renter_id"],
        },
      ],
      transaction,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá của bạn.",
      });
    }

    // 2️⃣ Tìm lịch sử điểm thưởng liên quan
    const pointsTrans = await PointsTransaction.findOne({
      where: {
        user_id: renter_id,
        reference_type: "booking",
        reference_id: review.booking_id,
        description: "Thưởng điểm khi đánh giá xe",
      },
      transaction,
    });

    // 3️⃣ Trừ điểm cho renter
    const POINTS_DEDUCT = 5000;
    const user = await User.findByPk(renter_id, { transaction });

    if (!user) {
      throw new Error("Không tìm thấy người dùng.");
    }

    const newBalance = Math.max(0, user.points - POINTS_DEDUCT);
    await user.update({ points: newBalance }, { transaction });

    // 4️⃣ Xóa lịch sử điểm
    if (pointsTrans) {
      await pointsTrans.destroy({ transaction });
    }

    // 5️⃣ Xóa review
    await review.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Xóa đánh giá thành công!",
      points_deducted: pointsTrans ? POINTS_DEDUCT : 0,
      new_balance: newBalance,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error deleting booking review:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa đánh giá.",
    });
  }
};
