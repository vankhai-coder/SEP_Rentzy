import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
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

    // 3️⃣ Xử lý ngày – giờ đặt xe
    const bookedDates = bookings
      .map((booking) => {
        const { start_date, end_date, start_time, end_time } = booking;

        // Nếu thiếu dữ liệu ngày, bỏ qua
        if (!start_date || !end_date) {
          console.warn("⚠️ Bỏ qua booking do thiếu ngày:", booking);
          return null;
        }

        // Tạo đối tượng Date từ start_date, end_date
        const startDateTime = new Date(start_date);
        const endDateTime = new Date(end_date);

        // Gán thêm giờ bắt đầu – kết thúc
        if (start_time) {
          const [h, m, s] = start_time.split(":").map(Number);
          startDateTime.setUTCHours(h || 0, m || 0, s || 0, 0);
        } else {
          startDateTime.setUTCHours(0, 0, 0, 0);
        }

        if (end_time) {
          const [h, m, s] = end_time.split(":").map(Number);
          endDateTime.setUTCHours(h || 0, m || 0, s || 0, 0);
        } else {
          endDateTime.setUTCHours(23, 59, 59, 999);
        }

        // Kiểm tra hợp lệ
        if (isNaN(startDateTime) || isNaN(endDateTime)) {
          console.warn("⚠️ Invalid Date:", booking);
          return null;
        }

        return {
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
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

export const createBooking = async (req, res) => {
  try {
    const renterId = req.user?.userId;
    console.log("Renter ID:", renterId);
    console.log("Request Body:", req.body);
    if (!renterId) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn phải đăng nhập để đặt xe" });
    }

    const {
      vehicle_id,
      startDate,
      endDate,
      startTime,
      endTime,
      deliveryOption,
      pickupAddress,
      returnAddress,
      deliveryFee,
      voucherCode,
      usePoints,
      pointsToUse,
    } = req.body || {};

    // Validate cơ bản
    if (!vehicle_id || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu vehicle_id hoặc thời gian thuê (startDate/endDate/startTime/endTime)",
      });
    }

    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe" });
    }

    // Parse và kiểm tra thời gian
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu/kết thúc không hợp lệ",
      });
    }
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // Kiểm tra thời gian nhận/trả
    const requestedStart = new Date(`${startDate}T${startTime}:00.000Z`);
    const requestedEnd = new Date(`${endDate}T${endTime}:00.000Z`);
    if (
      Number.isNaN(requestedStart.getTime()) ||
      Number.isNaN(requestedEnd.getTime()) ||
      requestedEnd <= requestedStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian nhận/trả không hợp lệ",
      });
    }

    // Kiểm tra trùng lịch theo giờ
    const intervals = await buildBookedIntervals(vehicle_id);
    const hasOverlap = intervals.some(({ startDateTime, endDateTime }) => {
      // Giao khoảng: [requestedStart, requestedEnd) ∩ [startDateTime, endDateTime) ≠ ∅
      return requestedStart < endDateTime && requestedEnd > startDateTime;
    });
    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message: "Khoảng thời gian nhận/trả xe trùng với lịch đã đặt",
        detail: {
          requestedStart: requestedStart.toISOString(),
          requestedEnd: requestedEnd.toISOString(),
          bookedIntervals: intervals.map((i) => ({
            start: i.startDateTime.toISOString(),
            end: i.endDateTime.toISOString(),
          })),
        },
      });
    }

    // Tính toán chi phí thuê
    const msPerDay = 24 * 60 * 60 * 1000;
    const total_days = Math.max(1, Math.ceil((end - start) / msPerDay));
    const pricePerDay = parseFloat(vehicle.price_per_day || 0);
    const total_cost = Number((total_days * pricePerDay).toFixed(2));

    // Địa điểm và phí giao xe
    let pickup_location = vehicle.location || "";
    let return_location = vehicle.location || "";
    let delivery_fee = 0;

    if (deliveryOption === "delivery") {
      pickup_location = pickupAddress || "";
      return_location = returnAddress || pickupAddress || "";

      if (!pickup_location || !return_location) {
        return res.status(400).json({
          success: false,
          message: "Thiếu địa chỉ giao/nhận khi chọn giao xe",
        });
      }

      const feeFromFE = Number(deliveryFee);
      delivery_fee =
        Number.isFinite(feeFromFE) && feeFromFE >= 0
          ? Math.floor(feeFromFE)
          : 0;
    }

    const subtotal = total_cost + delivery_fee;

    // Áp dụng voucher
    let discount_amount = 0;
    let voucher_code = null;

    if (voucherCode) {
      const voucher = await Voucher.findOne({
        where: { code: voucherCode, is_active: true },
      });
      if (!voucher) {
        return res.status(400).json({
          success: false,
          message: "Voucher không hợp lệ hoặc không hoạt động",
        });
      }

      const now = new Date();
      if (now < voucher.valid_from || now > voucher.valid_to) {
        return res.status(400).json({
          success: false,
          message: "Voucher đã hết hạn hoặc chưa đến thời gian áp dụng",
        });
      }

      if (
        voucher.usage_limit != null &&
        voucher.used_count >= voucher.usage_limit
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Voucher đã đạt giới hạn sử dụng" });
      }

      const minOrder = parseFloat(voucher.min_order_amount || 0);
      if (subtotal < minOrder) {
        return res.status(400).json({
          success: false,
          message: "Không đạt giá trị đơn tối thiểu để dùng voucher",
        });
      }

      const discountValue = parseFloat(voucher.discount_value || 0);
      const maxDiscount =
        voucher.max_discount != null ? parseFloat(voucher.max_discount) : null;

      if (voucher.discount_type === "PERCENT") {
        const raw = (subtotal * discountValue) / 100;
        discount_amount =
          maxDiscount != null ? Math.min(raw, maxDiscount) : raw;
      } else {
        discount_amount = discountValue;
      }

      discount_amount = Math.max(0, Number(discount_amount.toFixed(2)));
      voucher_code = voucher.code;
    }

    // Xử lý điểm thưởng
    let points_used = 0;
    if (usePoints && pointsToUse > 0) {
      const renter = await Renter.findByPk(renterId);
      if (!renter || renter.points < pointsToUse) {
        return res.status(400).json({
          success: false,
          message: "Điểm thưởng không đủ hoặc không hợp lệ",
        });
      }
      points_used = pointsToUse;
    }

    const total_amount = Math.max(
      0,
      Number((subtotal - discount_amount - points_used).toFixed(2))
    );

    // Lưu booking
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
      total_paid: 0,
      voucher_code,
      points_used,
      points_earned: 0,
      status: "pending",
      pickup_location,
      return_location,
    });

    // Cập nhật điểm thưởng (nếu cần)
    if (points_used > 0) {
      await Renter.decrement("points", {
        by: points_used,
        where: { id: renterId },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Tạo booking thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo booking",
      error: error.message,
    });
  }
};
