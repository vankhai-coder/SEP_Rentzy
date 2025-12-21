import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import User from "../../models/User.js";
import BookingHandover from "../../models/BookingHandover.js";
import BookingContract from "../../models/BookingContract.js";

import { Op } from "sequelize";
import Voucher from "../../models/Voucher.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import Transaction from "../../models/Transaction.js";
import Notification from "../../models/Notification.js";
import { autoCancelExpiredBookings } from "../../services/cronService.js";
import { sendToUser } from "../../services/wsService.js";

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
            "confirmed",
            "deposit_paid",
            "fully_paid",
            "cancel_requested",
            "in_progress",
            // "completed",
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

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Tìm booking với thông tin liên quan đầy đủ
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId,
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "vehicle_id",
            "owner_id",
            "brand_id",
            "vehicle_type",
            "license_plate",
            "model",
            "year",
            "price_per_day",
            "description",
            "main_image_url",
            "extra_images",
            "features",
            "location",
            "latitude",
            "longitude",
            "transmission",
            "body_type",
            "seats",
            "fuel_type",
            "bike_type",
            "engine_capacity",
            "approvalStatus",
            "status",
            "rent_count",
            "created_at",
            "updated_at",
          ],
          include: [
            {
              model: User,
              as: "owner",
              attributes: [
                "user_id",
                "full_name",
                "email",
                "phone_number",
                "avatar_url",
                "role",
                "driver_license_status_for_car",
                "driver_license_status_for_motobike",
                "national_id_status",
                "points",
                "is_active",
                "created_at",
              ],
            },
          ],
        },
        {
          model: User,
          as: "renter",
          attributes: [
            "user_id",
            "full_name",
            "phone_number",
            "email",
            "avatar_url",
            "driver_license_status_for_car",
            "driver_license_status_for_motobike",
            "national_id_status",
            "points",
          ],
        },
        {
          model: Transaction,
          attributes: [
            "transaction_id",
            "amount",
            "type",
            "status",
            "payment_method",
            "note",
            "created_at",
            "processed_at",
          ],
          required: false,
        },
        {
          model: BookingHandover,
          as: "handover",
          attributes: { exclude: [] },
        },
        {
          model: BookingContract,
          as: "contract",
          attributes: [
            "contract_id",
            "contract_number",
            "contract_status",
            "renter_signature",
            "owner_signature",
            "renter_signed_at",
            "owner_signed_at",
            "contract_file_url",
            "created_at",
            "updated_at",
          ],
          required: false,
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin đơn hàng",
      });
    }

    // Tạo response data đầy đủ từ database
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
      pricePerDay: booking.vehicle ? booking.vehicle.price_per_day : "0.00",
      totalCost: booking.total_cost,
      deliveryFee: booking.delivery_fee || 0,
      discountAmount: booking.discount_amount || 0,
      pointsUsed: booking.points_used || 0,
      totalAmount: booking.total_amount,
      totalPaid: booking.total_paid || 0,
      remaining_paid_by_cash_status:
        booking.remaining_paid_by_cash_status || "none",

      // Thông tin phạt nguội
      traffic_fine_amount: booking.traffic_fine_amount || 0,
      traffic_fine_paid: booking.traffic_fine_paid || 0,
      traffic_fine_description: booking.traffic_fine_description || null,
      traffic_fine_images: booking.traffic_fine_images
        ? typeof booking.traffic_fine_images === "string"
          ? JSON.parse(booking.traffic_fine_images)
          : booking.traffic_fine_images
        : [],

      // Thông tin khác
      voucherCode: booking.voucher_code,
      pointsEarned: booking.points_earned || 0,
      orderCode: booking.order_code,
      orderCodeRemaining: booking.order_code_remaining,

      // Thời gian tạo và cập nhật
      created_at: booking.created_at,
      updated_at: booking.updated_at,

      // Thông tin xe đầy đủ
      vehicle: booking.vehicle
        ? {
            vehicle_id: booking.vehicle.vehicle_id,
            owner_id: booking.vehicle.owner_id,
            brand_id: booking.vehicle.brand_id,
            vehicle_type: booking.vehicle.vehicle_type,
            license_plate: booking.vehicle.license_plate,
            model: booking.vehicle.model,
            year: booking.vehicle.year,
            price_per_day: booking.vehicle.price_per_day,
            description: booking.vehicle.description,
            main_image_url: booking.vehicle.main_image_url,
            extra_images: booking.vehicle.extra_images,
            features: booking.vehicle.features,
            location: booking.vehicle.location,
            latitude: booking.vehicle.latitude,
            longitude: booking.vehicle.longitude,
            transmission: booking.vehicle.transmission,
            body_type: booking.vehicle.body_type,
            seats: booking.vehicle.seats,
            fuel_type: booking.vehicle.fuel_type,
            bike_type: booking.vehicle.bike_type,
            engine_capacity: booking.vehicle.engine_capacity,
            approvalStatus: booking.vehicle.approvalStatus,
            status: booking.vehicle.status,
            rent_count: booking.vehicle.rent_count,
            created_at: booking.vehicle.created_at,
            updated_at: booking.vehicle.updated_at,
            owner: booking.vehicle.owner
              ? {
                  user_id: booking.vehicle.owner.user_id,
                  full_name: booking.vehicle.owner.full_name,
                  email: booking.vehicle.owner.email,
                  phone_number: booking.vehicle.owner.phone_number,
                  avatar_url: booking.vehicle.owner.avatar_url,
                  role: booking.vehicle.owner.role,
                  driver_license_status:
                    booking.vehicle.vehicle_type === "car"
                      ? booking.vehicle.owner.driver_license_status_for_car
                      : booking.vehicle.owner.driver_license_status_for_motobike,
                  national_id_status: booking.vehicle.owner.national_id_status,
                  points: booking.vehicle.owner.points,
                  is_active: booking.vehicle.owner.is_active,
                  created_at: booking.vehicle.owner.created_at,
                }
              : null,
          }
        : null,

      renter: booking.renter
        ? {
            user_id: booking.renter.user_id,
            full_name: booking.renter.full_name,
            phone_number: booking.renter.phone_number,
            email: booking.renter.email,
            avatar_url: booking.renter.avatar_url,
            driver_license_status:
              booking.vehicle.vehicle_type === "car"
                ? booking.renter.driver_license_status_for_car
                : booking.renter.driver_license_status_for_motobike,
            national_id_status: booking.renter.national_id_status,
            points: booking.renter.points,
          }
        : null,

      transactions: booking.Transactions
        ? booking.Transactions.map((transaction) => ({
            transaction_id: transaction.transaction_id,
            amount: transaction.amount,
            transaction_type: transaction.type,
            status: transaction.status,
            payment_method: transaction.payment_method,
            note: transaction.note,
            created_at: transaction.created_at,
            processed_at: transaction.processed_at,
          }))
        : [],

      handover: booking.handover || null,

      // Thêm thông tin hợp đồng DocuSign
      contract: booking.contract
        ? {
            contract_id: booking.contract.contract_id,
            contract_number: booking.contract.contract_number,
            contract_status: booking.contract.contract_status,
            renter_signed_at: booking.contract.renter_signed_at,
            owner_signed_at: booking.contract.owner_signed_at,
            contract_file_url: booking.contract.contract_file_url,
          }
        : null,
    };

    return res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error getBookingById:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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

      // Tạo datetime theo múi giờ Việt Nam
      // Lấy ngày từ database (đã lưu theo VN timezone)
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      // Format ngày theo định dạng YYYY-MM-DD
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Tạo datetime string với múi giờ Việt Nam
      const startTimeStr = start_time || "00:00:00";
      const endTimeStr = end_time || "23:59:59";

      // Tạo datetime với timezone +07:00 (Việt Nam)
      const startDateTime = new Date(`${startDateStr}T${startTimeStr}+07:00`);
      const endDateTime = new Date(`${endDateStr}T${endTimeStr}+07:00`);

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
    //  BƯỚC 1: XÁC THỰC NGƯỜI DÙNG
    const renterId = req.user?.userId;
    console.log("🔍 Renter ID:", renterId);
    console.log("📝 Request Body:", req.body);

    if (!renterId) {
      return res.status(401).json({
        success: false,
        message: "Bạn phải đăng nhập để đặt xe",
      });
    }

    //  BƯỚC 2: EXTRACT VÀ VALIDATE DỮ LIỆU ĐẦU VÀO
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

    //  BƯỚC 3: KIỂM TRA XE CÓ TỒN TẠI
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe với ID đã cung cấp",
      });
    }
    // BƯỚC 4: PARSE VÀ VALIDATE THỜI GIAN
    console.log("📅 Dữ liệu thời gian nhận được:", {
      startDate,
      endDate,
      startTime,
      endTime,
    });

    // Tạo datetime theo múi giờ Việt Nam (UTC+7)
    // Sử dụng format ISO với timezone offset để đảm bảo đúng múi giờ
    const vietnamOffset = "+07:00";
    const normalizeTime = (t) => {
      if (!t) return "00:00:00";
      return /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t;
    };
    const extractDateOnly = (d) => {
      if (!d) return "";
      if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
      return d;
    };
    const startDateOnlyForParse = extractDateOnly(startDate);
    const endDateOnlyForParse = extractDateOnly(endDate);
    const startTimeNorm = normalizeTime(startTime);
    const endTimeNorm = normalizeTime(endTime);
    const startDateTimeStr = `${startDateOnlyForParse}T${startTimeNorm}${vietnamOffset}`;
    const endDateTimeStr = `${endDateOnlyForParse}T${endTimeNorm}${vietnamOffset}`;

    const start = new Date(startDateTimeStr);
    const end = new Date(endDateTimeStr);

    console.log("🕐 Datetime sau khi parse với múi giờ VN:", {
      startInput: startDateTimeStr,
      endInput: endDateTimeStr,
      start: start.toISOString(),
      end: end.toISOString(),
      startVN: start.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      endVN: end.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    });

    // Kiểm tra định dạng ngày hợp lệ
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Định dạng ngày/giờ không hợp lệ. Vui lòng sử dụng format YYYY-MM-DD và HH:mm:ss",
      });
    }

    // Kiểm tra logic thời gian: ngày kết thúc phải sau ngày bắt đầu
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Ngày trả xe phải sau ngày nhận xe",
      });
    }

    // Kiểm tra thời gian bắt đầu không được trong quá khứ
    // Lấy thời gian hiện tại theo múi giờ Việt Nam
    const now = new Date();
    const nowVN = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    console.log("⏰ So sánh thời gian:", {
      currentTimeUTC: now.toISOString(),
      currentTimeVN: nowVN.toISOString(),
      currentTimeVNLocal: now.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      startTime: start.toISOString(),
      startTimeVN: start.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      isStartInPast: start < now,
    });

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: "Không thể đặt xe trong quá khứ",
      });
    }

    //  BƯỚC 5: KIỂM TRA XUNG ĐỘT LỊCH ĐẶT
    console.log("🔍 Kiểm tra xung đột lịch đặt...");

    // Lấy danh sách các khoảng thời gian đã được đặt
    const bookedIntervals = await buildBookedIntervals(vehicle_id);

    // Sử dụng trực tiếp start và end đã được parse đúng múi giờ Việt Nam
    const requestStart = start;
    const requestEnd = end;

    console.log("📅 Khoảng thời gian request:", {
      start: requestStart.toISOString(),
      end: requestEnd.toISOString(),
      startVN: requestStart.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      endVN: requestEnd.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    });

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

    // Kiểm tra xung đột với các booking hiện có
    // Logic: Hai khoảng thời gian xung Đột nếu: requestStart < bookedEnd && requestEnd > bookedStart
    const hasConflict = bookedIntervals.some(
      ({ startDateTime, endDateTime }) => {
        const isConflict =
          requestStart < endDateTime && requestEnd > startDateTime;
        if (isConflict) {
          console.log("⚠️ Phát hiện xung đột với booking:", {
            bookedStart: startDateTime.toISOString(),
            bookedEnd: endDateTime.toISOString(),
            bookedStartVN: startDateTime.toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
            bookedEndVN: endDateTime.toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
            requestStart: requestStart.toISOString(),
            requestEnd: requestEnd.toISOString(),
            requestStartVN: requestStart.toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
            requestEndVN: requestEnd.toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
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

    //  BƯỚC 6: TÍNH TOÁN CHI PHÍ CƠ BẢN

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

    //  BƯỚC 7: XỬ LÝ ĐỊA ĐIỂM VÀ PHÍ GIAO XE
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

    // BƯỚC 8: XỬ LÝ VOUCHER GIẢM GIÁ
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

    //BƯỚC 10: TÍNH TỔNG TIỀN CUỐI CÙNG
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

    // BƯỚC 11: TẠO BOOKING TRONG DATABASE
    console.log("💾 Tạo booking trong database...");

    // Tách ngày và giờ để lưu đúng format theo múi giờ Việt Nam
    // Lưu trực tiếp string date để tránh timezone conversion
    const startDateOnly = startDateOnlyForParse;
    const endDateOnly = endDateOnlyForParse;

    // Xác định trạng thái ban đầu dựa trên yêu cầu duyệt của chủ xe
    // Nếu xe yêu cầu chủ xe duyệt: tạo booking ở trạng thái "pending"
    // Nếu không yêu cầu duyệt: tạo booking ở trạng thái "confirmed"
    const initialStatus = vehicle.require_owner_confirmation
      ? "pending"
      : "confirmed";

    const booking = await Booking.create({
      renter_id: renterId,
      vehicle_id,
      start_date: startDateOnly,
      end_date: endDateOnly,
      start_time: startTimeNorm,
      end_time: endTimeNorm,
      total_days,
      total_cost,
      discount_amount,
      delivery_fee,
      total_amount,
      total_paid: 0, // Chưa thanh toán
      voucher_code,
      points_used,
      points_earned: 0, // Sẽ tính sau khi hoàn thành booking
      status: initialStatus, // Trạng thái ban đầu tùy theo chính sách duyệt của chủ xe
      pickup_location,
      return_location,
    });

    console.log("✅ Booking đã được tạo với ID:", booking.booking_id);

    if (vehicle && vehicle.owner_id) {
      try {
        const notif = await Notification.create({
          user_id: vehicle.owner_id,
          title: "Có booking mới cho xe của bạn . Vui lòng kiểm tra ngay !" ,
          content: `Booking #${booking.booking_id} cho xe ${vehicle.model}`,
          type: "rental",
          is_read: false,
        });
        sendToUser(vehicle.owner_id, {
          type: "NEW_NOTIFICATION",
          data: {
            notification_id: notif.notification_id,
            title: notif.title,
            content: notif.content,
            created_at: notif.created_at,
          },
        });
      } catch {}
    }

    //  BƯỚC 12: CẬP NHẬT ĐIỂM THƯỞNG NGƯỜI DÙNG
    if (points_used > 0) {
      console.log("🔄 Cập nhật điểm thưởng người dùng...");

      await User.decrement("points", {
        by: points_used,
        where: { user_id: renterId },
      });

      console.log(` Đã trừ ${points_used} điểm từ tài khoản người dùng`);
    }

    // BƯỚC 13: TRẢ VỀ KẾT QUẢ
    // Gửi email thông báo cho chủ xe về booking mới
    try {
      const owner = vehicle?.owner_id
        ? await User.findByPk(vehicle.owner_id)
        : null;
      const renter = await User.findByPk(renterId);

      if (owner?.email) {
        const vehicleName =
          vehicle?.model || vehicle?.vehicle_name || "Xe của bạn";
        const statusText =
          initialStatus === "pending"
            ? "Booking mới cần bạn xác nhận"
            : "Booking mới đã được xác nhận";
        const frontURL = process.env.FRONTEND_URL || "";
        const ownerPortalLink = frontURL ? `${frontURL}/owner` : "";

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Thông báo booking mới</title>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; }
                h2 { color: #333333; margin: 0 0 12px 0; }
                p { color: #555555; font-size: 15px; line-height: 1.6; margin: 6px 0; }
                .details { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; }
                .row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
                .row:last-child { border-bottom: none; }
                .label { color: #64748b; }
                .value { color: #334155; font-weight: 500; }
                .cta { display: inline-block; margin-top: 16px; padding: 12px 18px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .footer { margin-top: 24px; font-size: 12px; color: #888888; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>${statusText}</h2>
                <p>Xin chào${owner.full_name ? ` ${owner.full_name}` : ""},</p>
                <p>Người thuê${
                  renter?.full_name ? ` ${renter.full_name}` : ""
                } vừa đặt xe <strong>${vehicleName}</strong>.</p>

                <div class="details">
                  <div class="row"><span class="label">Mã booking:</span><span class="value">#${
                    booking.booking_id
                  }</span></div>
                  <div class="row"><span class="label">Thời gian nhận:</span><span class="value">${startDateOnly} ${startTime}</span></div>
                  <div class="row"><span class="label">Thời gian trả:</span><span class="value">${endDateOnly} ${endTime}</span></div>
                  <div class="row"><span class="label">Tổng tiền:</span><span class="value">${Number(
                    total_amount
                  ).toLocaleString("vi-VN")} VNĐ</span></div>
                  <div class="row"><span class="label">Trạng thái:</span><span class="value">${initialStatus}</span></div>
                </div>

                ${
                  ownerPortalLink
                    ? `<a class="cta" href="${ownerPortalLink}" target="_blank">Đăng nhập để xem/duyệt</a>`
                    : ""
                }

                <div class="footer">© ${new Date().getFullYear()} Rentzy. Mọi quyền được bảo lưu.</div>
              </div>
            </body>
          </html>
        `;

        await sendEmail({
          from: process.env.GMAIL_USER,
          to: owner.email,
          subject: `Có booking mới cho xe của bạn - #${booking.booking_id}`,
          html,
        });
      }
    } catch (emailErr) {
      console.error("Error sending owner booking notification:", emailErr);
    }

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
    console.error("Error creating booking:", error);

    // Log chi tiết lỗi để debug
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi tạo booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// lấy thông tin booking theo id để hiện thị trên contract page
const getBookingByIdContract = async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Tìm booking trong database
    const booking = await Booking.findByPk(booking_id, {
      include: [
        { model: User, as: "renter", attributes: ["user_name", "phone"] },
        { model: User, as: "owner", attributes: ["user_name", "phone"] },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_name", "license_plate"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking không tồn tại",
      });
    }

    // Trả về thông tin booking
    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(" Error fetching booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin booking",
    });
  }
};

export { getBookingByIdContract };


export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user?.userId;

    console.log("Delete booking request:", { bookingId, renterId });

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!renterId) {
      return res.status(401).json({
        success: false,
        message: "Bạn phải đăng nhập để hủy booking",
      });
    }

    // Tìm booking với thông tin liên quan
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        renter_id: renterId, // Đảm bảo chỉ renter có thể hủy booking của mình
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "model", "owner_id"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy booking hoặc bạn không có quyền hủy booking này",
      });
    }

    // Kiểm tra trạng thái booking - chỉ cho phép hủy booking ở trạng thái chờ thanh toán 
    if ( booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy booking ở trạng thái chờ xác nhận",
      });
    }

    // Cập nhật trạng thái booking thành "cancelled"
    await booking.update({
      status: "canceled",
      updated_at: new Date(),
    });

    // Hoàn lại điểm thưởng nếu có sử dụng
    if (booking.points_used > 0) {
      await User.increment("points", {
        by: booking.points_used,
        where: { user_id: renterId },
      });
      console.log(
        `Đã hoàn lại ${booking.points_used} điểm cho user ${renterId}`
      );
    }

    // Tạo thông báo cho owner (nếu cần)
    if (booking.vehicle && booking.vehicle.owner_id) {
      await Notification.create({
        user_id: booking.vehicle.owner_id,
        title: "Booking đã bị hủy",
        content: `Booking cho xe ${booking.vehicle.model} đã bị hủy bởi người thuê.`,
        type: "rental",
        is_read: false,
      });
    }

    console.log("Booking đã được hủy thành công:", bookingId);

    return res.status(200).json({
      success: true,
      message: "Đã hủy booking thành công",
      data: {
        booking_id: booking.booking_id,
        status: "cancelled",
        points_refunded: booking.points_used || 0,
      },
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi hủy booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//  MANUAL TRIGGER AUTO-CANCEL (FOR TESTING)
export const triggerAutoCancelExpiredBookings = async (req, res) => {
  try {
    console.log("🔧 [MANUAL] Triggering auto-cancel expired bookings...");

    await autoCancelExpiredBookings();

    return res.status(200).json({
      success: true,
      message: "Auto-cancel process completed successfully",
    });
  } catch (error) {
    console.error("❌ [MANUAL] Error triggering auto-cancel:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi thực hiện auto-cancel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
