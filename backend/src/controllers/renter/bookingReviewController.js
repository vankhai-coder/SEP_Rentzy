// controllers/renter/bookingReviewController.js
import db from "../../models/index.js";

const { Booking, BookingReview, Vehicle, User, PointsTransaction } = db;

export const createBookingReview = async (req, res) => {
  const transaction = await db.sequelize.transaction(); // ⚙️ dùng transaction để đảm bảo tính toàn vẹn
  try {
    const { booking_id, rating, review_content } = req.body;
    const renter_id = req.user.userId; // từ verifyJWTToken middleware

    // 1️⃣ Kiểm tra thông tin đầu vào
    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (booking_id, rating)",
      });
    }

    // 2️⃣ Kiểm tra booking có tồn tại và thuộc về renter này
    const booking = await Booking.findOne({
      where: { booking_id, renter_id },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn thuê này." });
    }

    // 3️⃣ Kiểm tra trạng thái booking (phải completed)
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá sau khi đơn thuê đã hoàn tất.",
      });
    }

    // 4️⃣ Kiểm tra xem đã đánh giá đơn này chưa
    const existingReview = await BookingReview.findOne({
      where: { booking_id },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá đơn thuê này rồi.",
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

    // Lấy user hiện tại
    const user = await User.findByPk(renter_id, { transaction });

    if (!user) {
      throw new Error("Không tìm thấy người dùng.");
    }

    // Cập nhật điểm
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

    // 8️⃣ Lấy thông tin xe để trả về cho FE
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
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating booking review:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá.",
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
            // ✅ THÊM MỚI: Nested include Vehicle để tránh alias mismatch và cung cấp data đầy đủ cho FE (model, image, plate)
            {
              model: Vehicle,
              as: "vehicle", // ✅ SỬA: Bắt buộc dùng 'as: "vehicle"' để khớp association (tránh EagerLoadingError)
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

// Lấy tất cả review của người dùng đang đăng nhập (các đánh giá mà renter đã đánh giá)
export const getMyReviews = async (req, res) => {
  try {
    const renter_id = req.user.userId; // từ verifyJWTToken middleware
    const { sortBy = "created_at" } = req.query; //Query param sortBy (mặc định: created_at DESC - đánh giá mới nhất trước)

    // Xây dựng order clause dựa trên sortBy (linh hoạt: created_at, start_date, rating)
    let orderClause = [["created_at", "DESC"]];
    if (sortBy === "start_date") {
      orderClause = [["booking", "start_date", "DESC"]]; // Sắp xếp theo ngày bắt đầu booking (nested sort)
    } else if (sortBy === "rating") {
      orderClause = [["rating", "DESC"]]; // Đánh giá cao nhất trước
    } // Else: Giữ created_at DESC

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
              as: "vehicle", // Giả sử có association Booking -> Vehicle as "vehicle"
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
      order: orderClause, // Áp dụng order động (trước đây chỉ fixed created_at)
    });

    res.json({
      success: true,
      reviews,
      totalReviews: reviews.length,
      sortBy, // Trả về info sort để FE biết (optional)
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá của người dùng: ", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá của bạn.",
    });
  }
};
