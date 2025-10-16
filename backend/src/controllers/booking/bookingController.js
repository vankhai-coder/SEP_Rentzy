import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";
import { Op } from "sequelize";
import Voucher from "../../models/Voucher.js";

// Lấy lịch xe đã đặt theo vehicleId
export const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    console.log("🔍 Vehicle ID:", vehicleId);

    // 1️⃣ Kiểm tra xe có tồn tại không
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe.",
      });
    }

    // 2️⃣ Lấy các booking đang hoạt động hoặc đã được xác nhận
    const bookings = await Booking.findAll({
      where: {
        vehicle_id: vehicleId,
        status: {
          [Op.in]: [
            "pending",
            "deposit_paid",
            "rental_paid",
            "accepted",
            "in_progress",
          ],
        },
      },
      attributes: ["start_date", "end_date", "start_time", "end_time"],
      raw: true,
    });

    // 3️⃣ Xử lý ngày – giờ đặt xe (trả về local time format)
    const bookedDates = bookings
      .map((booking) => {
        const { start_date, end_date, start_time, end_time } = booking;

        // Nếu thiếu dữ liệu ngày, bỏ qua
        if (!start_date || !end_date) {
          console.warn("⚠️ Bỏ qua booking do thiếu ngày:", booking);
          return null;
        }

        // Tạo string datetime theo format local (không convert UTC)
        const startDateStr = new Date(start_date).toISOString().split("T")[0]; // YYYY-MM-DD
        const endDateStr = new Date(end_date).toISOString().split("T")[0]; // YYYY-MM-DD

        const startTimeStr = start_time || "00:00:00";
        const endTimeStr = end_time || "23:59:59";

        // Tạo datetime string theo format local
        const startDateTime = `${startDateStr}T${startTimeStr}`;
        const endDateTime = `${endDateStr}T${endTimeStr}`;

        return {
          startDateTime,
          endDateTime,
          pickupTime: start_time || "00:00:00",
          returnTime: end_time || "23:59:59",
        };
      })
      .filter(Boolean); // loại bỏ các bản ghi null

    // 4️⃣ Trả kết quả
    return res.status(200).json({
      success: true,
      bookedDates,
    });
  } catch (error) {
    console.error("❌ Error getting vehicle booked dates:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin lịch đặt xe",
      error: error.message,
    });
  }
};

// ==================== GET BOOKING BY ID ====================
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const renterId = req.user?.userId;
    console.log("🔍 Renter ID:", renterId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Tìm booking với thông tin liên quan
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId, // Đảm bảo chỉ lấy booking của user hiện tại
      },
      include: [
        {
          model: Vehicle,
          attributes: [
            "vehicle_id",
            "model",
            "location",
            "price_per_day",
            "main_image_url",
            "extra_images",
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: ["user_id", "full_name", "phone_number", "email"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin đơn hàng",
      });
    }

    // Tạo response data đơn giản từ database
    const responseData = {
      booking_id: booking.booking_id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      pickupLocation: booking.pickup_location,
      returnLocation: booking.return_location,

      // Thông tin tài chính
      totalDays: booking.total_days,
      pricePerDay: booking.Vehicle ? booking.Vehicle.price_per_day : "0.00",
      totalCost: booking.total_cost,
      deliveryFee: booking.delivery_fee || 0,
      discountAmount: booking.discount_amount || 0,
      pointsUsed: booking.points_used || 0,
      totalAmount: booking.total_amount,
      totalPaid: booking.total_paid || 0,

      // Thông tin khác
      voucherCode: booking.voucher_code,
      pointsEarned: booking.points_earned || 0,

      // Thông tin xe
      vehicle: {
        vehicle_id: booking.Vehicle.vehicle_id,
        model: booking.Vehicle.model,
        location: booking.Vehicle.location,
        price_per_day: booking.Vehicle.price_per_day,
        main_image_url: booking.Vehicle.main_image_url,
        extra_images: booking.Vehicle.extra_images,
      },

      // Thông tin người thuê
      renter: {
        user_id: booking.renter.user_id,
        full_name: booking.renter.full_name,
        phone_number: booking.renter.phone_number,
        email: booking.renter.email,
      },

      // Giao dịch
      transactions: [],
    };

    return res.status(200).json({
      success: true,
      booking: responseData,
    });
  } catch (error) {
    console.error("❌ Error getting booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper: chuẩn hóa danh sách khoảng thời gian đã đặt theo giờ
const buildBookedIntervals = async (vehicleId) => {
  const bookings = await Booking.findAll({
    where: {
      vehicle_id: vehicleId,
      status: {
        [Op.in]: [
          "pending",
          "deposit_paid",
          "rental_paid",
          "accepted",
          "in_progress",
        ],
      },
    },
    attributes: ["start_date", "end_date", "start_time", "end_time"],
    raw: true,
  });

  return bookings
    .map((b) => {
      const { start_date, end_date, start_time, end_time } = b;
      if (!start_date || !end_date) return null;

      const startDateTime = new Date(start_date);
      const endDateTime = new Date(end_date);

      // Set start time (default to 00:00 if not provided)
      if (start_time) {
        const [h, m, s] = start_time.split(":").map(Number);
        startDateTime.setHours(h || 0, m || 0, s || 0, 0);
      } else {
        startDateTime.setHours(0, 0, 0, 0);
      }

      // Set end time (default to 23:59:59 if not provided)
      if (end_time) {
        const [h, m, s] = end_time.split(":").map(Number);
        endDateTime.setHours(h || 23, m || 59, s || 59, 999);
      } else {
        endDateTime.setHours(23, 59, 59, 999);
      }

      // Remove the 1-hour buffer to align with getDate API
      // Ensure the interval matches exactly what getDate returns
      if (isNaN(startDateTime) || isNaN(endDateTime)) return null;
      return {
        startDateTime,
        endDateTime,
        pickupTime: start_time,
        returnTime: end_time,
      };
    })
    .filter(Boolean);
};

/**
 * API TẠO BOOKING MỚI
 *
 * Chức năng: Tạo một booking mới cho việc thuê xe
 *
 * Quy trình xử lý:
 * 1. Xác thực người dùng và validate dữ liệu đầu vào
 * 2. Kiểm tra xe có tồn tại và khả dụng
 * 3. Validate thời gian thuê (không trong quá khứ, logic thời gian hợp lệ)
 * 4. Kiểm tra xung đột lịch đặt với các booking hiện có
 * 5. Tính toán chi phí (giá thuê, phí giao xe, voucher, điểm thưởng)
 * 6. Tạo booking trong database
 * 7. Cập nhật điểm thưởng của người dùng (nếu có sử dụng)
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response với thông tin booking đã tạo
 */
export const createBooking = async (req, res) => {
  try {
    // ==================== BƯỚC 1: XÁC THỰC NGƯỜI DÙNG ====================
    const renterId = req.user?.userId;
    console.log("🔍 Renter ID:", renterId);
    console.log("📝 Request Body:", req.body);

    if (!renterId) {
      return res.status(401).json({
        success: false,
        message: "Bạn phải đăng nhập để đặt xe",
      });
    }

    // ==================== BƯỚC 2: EXTRACT VÀ VALIDATE DỮ LIỆU ĐẦU VÀO ====================
    const {
      vehicle_id, // ID xe cần thuê
      startDate, // Ngày bắt đầu thuê (YYYY-MM-DD)
      endDate, // Ngày kết thúc thuê (YYYY-MM-DD)
      startTime, // Giờ bắt đầu thuê (HH:mm:ss)
      endTime, // Giờ kết thúc thuê (HH:mm:ss)
      deliveryOption, // Tùy chọn giao xe: "pickup" | "delivery"
      pickupAddress, // Địa chỉ giao xe (nếu chọn delivery)
      returnAddress, // Địa chỉ nhận xe trả (nếu chọn delivery)
      deliveryFee, // Phí giao xe
      voucherCode, // Mã voucher giảm giá
      usePoints, // Có sử dụng điểm thưởng không
      pointsToUse, // Số điểm thưởng muốn sử dụng
    } = req.body || {};

    console.log("⏰ Thời gian đặt xe:", {
      startDate,
      endDate,
      startTime,
      endTime,
    });

    // Validate dữ liệu bắt buộc
    if (!vehicle_id || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc: vehicle_id, startDate, endDate, startTime, endTime",
      });
    }

    // ==================== BƯỚC 3: KIỂM TRA XE CÓ TỒN TẠI ====================
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe với ID đã cung cấp",
      });
    }

    console.log("🚗 Thông tin xe:", {
      id: vehicle.vehicle_id,
      name: vehicle.vehicle_name,
      price_per_day: vehicle.price_per_day,
      location: vehicle.location,
    });

    // ==================== BƯỚC 4: PARSE VÀ VALIDATE THỜI GIAN ====================
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Kiểm tra định dạng ngày hợp lệ
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Định dạng ngày không hợp lệ. Vui lòng sử dụng format YYYY-MM-DD",
      });
    }

    // Kiểm tra logic thời gian: ngày kết thúc phải sau ngày bắt đầu
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Ngày trả xe phải sau ngày nhận xe",
      });
    }

    // Kiểm tra không được đặt xe trong quá khứ
    const now = new Date();
    if (start < now) {
      return res.status(400).json({
        success: false,
        message: "Không thể đặt xe trong quá khứ",
      });
    }

    // ==================== BƯỚC 5: KIỂM TRA XUNG ĐỘT LỊCH ĐẶT ====================
    console.log("🔍 Kiểm tra xung đột lịch đặt...");

    // Lấy danh sách các khoảng thời gian đã được đặt
    const bookedIntervals = await buildBookedIntervals(vehicle_id);

    // Tạo khoảng thời gian request với giờ cụ thể
    const requestStart = new Date(start);
    const requestEnd = new Date(end);

    // Set thời gian cụ thể cho request
    if (startTime) {
      const [h, m, s] = startTime.split(":").map(Number);
      requestStart.setHours(h || 0, m || 0, s || 0, 0);
    }
    if (endTime) {
      const [h, m, s] = endTime.split(":").map(Number);
      requestEnd.setHours(h || 23, m || 59, s || 59, 999);
    }

    if (
      Number.isNaN(requestStart.getTime()) ||
      Number.isNaN(requestEnd.getTime()) ||
      requestEnd <= requestStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian nhận/trả không hợp lệ",
      });
    }

    console.log("📅 Khoảng thời gian request:", {
      start: requestStart.toISOString(),
      end: requestEnd.toISOString(),
    });

    // Kiểm tra xung đột với các booking hiện có
    // Logic: Hai khoảng thời gian xung đột nếu: requestStart < bookedEnd && requestEnd > bookedStart
    const hasConflict = bookedIntervals.some(
      ({ startDateTime, endDateTime }) => {
        const isConflict =
          requestStart < endDateTime && requestEnd > startDateTime;
        if (isConflict) {
          console.log("⚠️ Phát hiện xung đột với booking:", {
            bookedStart: startDateTime.toISOString(),
            bookedEnd: endDateTime.toISOString(),
          });
        }
        return isConflict;
      }
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: "Thời gian đã được đặt, vui lòng chọn thời gian khác",
      });
    }

    console.log("✅ Không có xung đột lịch đặt");

    // ==================== BƯỚC 6: TÍNH TOÁN CHI PHÍ CƠ BẢN ====================

    // Tính số ngày thuê (làm tròn lên)
    const timeDiff = end.getTime() - start.getTime();
    const total_days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (total_days <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số ngày thuê phải lớn hơn 0",
      });
    }

    // Tính chi phí thuê xe cơ bản
    const pricePerDay = parseFloat(vehicle.price_per_day || 0);
    const total_cost = Number((total_days * pricePerDay).toFixed(2));

    console.log("💰 Chi phí cơ bản:", {
      total_days,
      pricePerDay,
      total_cost,
    });

    // ==================== BƯỚC 7: XỬ LÝ ĐỊA ĐIỂM VÀ PHÍ GIAO XE ====================
    let pickup_location = vehicle.location || "";
    let return_location = vehicle.location || "";
    let delivery_fee = 0;

    if (deliveryOption === "delivery") {
      // Nếu chọn giao xe tận nơi
      pickup_location = pickupAddress || "";
      return_location = returnAddress || pickupAddress || "";

      // Validate địa chỉ giao xe
      if (!pickup_location || !return_location) {
        return res.status(400).json({
          success: false,
          message: "Thiếu địa chỉ giao/nhận khi chọn giao xe tận nơi",
        });
      }

      // Parse phí giao xe từ frontend
      const feeFromFE = Number(deliveryFee);
      delivery_fee =
        Number.isFinite(feeFromFE) && feeFromFE >= 0
          ? Math.floor(feeFromFE)
          : 0;
    }

    // Tính subtotal (chưa bao gồm giảm giá và điểm)
    const subtotal = total_cost + delivery_fee;

    console.log("🚚 Thông tin giao xe:", {
      deliveryOption,
      pickup_location,
      return_location,
      delivery_fee,
      subtotal,
    });

    // ==================== BƯỚC 8: XỬ LÝ VOUCHER GIẢM GIÁ ====================
    let discount_amount = 0;
    let voucher_code = null;

    if (voucherCode) {
      console.log("🎫 Xử lý voucher:", voucherCode);

      // Tìm voucher trong database
      const voucher = await Voucher.findOne({
        where: { code: voucherCode, is_active: true },
      });

      if (!voucher) {
        return res.status(400).json({
          success: false,
          message: "Voucher không hợp lệ hoặc không hoạt động",
        });
      }

      // Kiểm tra thời hạn voucher
      const now = new Date();
      if (now < voucher.valid_from || now > voucher.valid_to) {
        return res.status(400).json({
          success: false,
          message: "Voucher đã hết hạn hoặc chưa đến thời gian áp dụng",
        });
      }

      // Kiểm tra giới hạn sử dụng
      if (
        voucher.usage_limit != null &&
        voucher.used_count >= voucher.usage_limit
      ) {
        return res.status(400).json({
          success: false,
          message: "Voucher đã đạt giới hạn sử dụng",
        });
      }

      // Kiểm tra giá trị đơn hàng tối thiểu
      const minOrder = parseFloat(voucher.min_order_amount || 0);
      if (subtotal < minOrder) {
        return res.status(400).json({
          success: false,
          message: `Không đạt giá trị đơn tối thiểu ${minOrder.toLocaleString()}đ để dùng voucher`,
        });
      }

      // Tính toán giảm giá
      const discountValue = parseFloat(voucher.discount_value || 0);
      const maxDiscount =
        voucher.max_discount != null ? parseFloat(voucher.max_discount) : null;

      if (voucher.discount_type === "PERCENT") {
        // Giảm theo phần trăm
        const raw = (subtotal * discountValue) / 100;
        discount_amount =
          maxDiscount != null ? Math.min(raw, maxDiscount) : raw;
      } else {
        // Giảm theo số tiền cố định
        discount_amount = discountValue;
      }

      discount_amount = Math.max(0, Number(discount_amount.toFixed(2)));
      voucher_code = voucher.code;

      console.log("💸 Thông tin voucher:", {
        code: voucher.code,
        type: voucher.discount_type,
        value: discountValue,
        maxDiscount,
        discount_amount,
      });
    }

    // ==================== BƯỚC 9: XỬ LÝ ĐIỂM THƯỞNG ====================
    let points_used = 0;

    if (usePoints && pointsToUse > 0) {
      console.log("⭐ Xử lý điểm thưởng:", pointsToUse);

      // Tìm thông tin người dùng để kiểm tra điểm
      const user = await User.findByPk(renterId);
      if (!user || user.points < pointsToUse) {
        return res.status(400).json({
          success: false,
          message: "Điểm thưởng không đủ hoặc không hợp lệ",
        });
      }

      points_used = pointsToUse;
      console.log("✅ Sử dụng điểm thưởng:", points_used);
    }

    // ==================== BƯỚC 10: TÍNH TỔNG TIỀN CUỐI CÙNG ====================
    const total_amount = Math.max(
      0,
      Number((subtotal - discount_amount - points_used).toFixed(2))
    );

    console.log("💳 Tổng kết chi phí:", {
      total_cost,
      delivery_fee,
      subtotal,
      discount_amount,
      points_used,
      total_amount,
    });

    // ==================== BƯỚC 11: TẠO BOOKING TRONG DATABASE ====================
    console.log("💾 Tạo booking trong database...");

    const booking = await Booking.create({
      renter_id: renterId,
      vehicle_id,
      start_date: start,
      end_date: end,
      start_time: startTime,
      end_time: endTime,
      total_days,
      total_cost,
      discount_amount,
      delivery_fee,
      total_amount,
      total_paid: 0, // Chưa thanh toán
      voucher_code,
      points_used,
      points_earned: 0, // Sẽ tính sau khi hoàn thành booking
      status: "pending", // Trạng thái chờ xác nhận
      pickup_location,
      return_location,
    });

    console.log("✅ Booking đã được tạo với ID:", booking.booking_id);

    // ==================== BƯỚC 12: CẬP NHẬT ĐIỂM THƯỞNG NGƯỜI DÙNG ====================
    if (points_used > 0) {
      console.log("🔄 Cập nhật điểm thưởng người dùng...");

      await User.decrement("points", {
        by: points_used,
        where: { user_id: renterId },
      });

      console.log(`✅ Đã trừ ${points_used} điểm từ tài khoản người dùng`);
    }

    // ==================== BƯỚC 13: TRẢ VỀ KẾT QUẢ ====================
    return res.status(201).json({
      success: true,
      message: "Tạo booking thành công",
      data: {
        booking_id: booking.booking_id,
        vehicle_id: booking.vehicle_id,
        renter_id: booking.renter_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        total_days: booking.total_days,
        total_cost: booking.total_cost,
        delivery_fee: booking.delivery_fee,
        discount_amount: booking.discount_amount,
        points_used: booking.points_used,
        total_amount: booking.total_amount,
        status: booking.status,
        pickup_location: booking.pickup_location,
        return_location: booking.return_location,
        created_at: booking.created_at,
      },
    });
  } catch (error) {
    // ==================== XỬ LÝ LỖI ====================
    console.error("❌ Error creating booking:", error);

    // Log chi tiết lỗi để debug
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi tạo booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
