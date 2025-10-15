import Booking from "../../models/Booking.js";
import Vehicle from "../../models/Vehicle.js";
import { Op } from "sequelize";
import Voucher from "../../models/Voucher.js";

// Lấy lịch xe đã đặt theo vehicleId
export const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    console.log(vehicleId);

    // Kiểm tra xe có tồn tại không
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    console.log("id của vehicle", vehicle.vehicle_id);

    // Lấy các booking đã được xác nhận
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
    });

    const bookedDates = bookings.map((booking) => {
      const startDateTime = new Date(
        `${booking.start_date}T${booking.start_time || "00:00:00"}`
      );
      const endDateTime = new Date(
        `${booking.end_date}T${booking.end_time || "23:59:59"}`
      );

      // Thêm 1 giờ vào thời gian kết thúc như yêu cầu
      endDateTime.setHours(endDateTime.getHours() + 1);

      return {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        pickupTime: booking.start_time,
        returnTime: booking.end_time,
      };
    });

    res.status(200).json({
      success: true,
      bookedDates,
    });
  } catch (error) {
    console.error("Error getting vehicle booked dates:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin lịch đặt xe",
      error: error.message,
    });
  }
};

// Tạo booking mới
export const createBooking = async (req, res) => {
  try {
    const renterId = req.user?.userId;
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
      deliveryOption, // 'pickup' | 'delivery'
      pickupAddress,  // string khi delivery
      returnAddress,  // string khi delivery
      deliveryFee,    // number (VND) do FE tính và gửi
      voucherCode,
    } = req.body || {};

    // Validate cơ bản
    if (!vehicle_id || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu vehicle_id hoặc thời gian thuê (startDate/endDate)",
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

    // Kiểm tra trùng lịch
    const overlappingCount = await Booking.count({
      where: {
        vehicle_id,
        status: {
          [Op.in]: [
            "pending",
            "deposit_paid",
            "rental_paid",
            "confirmed",
            "in_progress",
          ],
        },
        [Op.and]: [
          { start_date: { [Op.lte]: end } },
          { end_date: { [Op.gte]: start } },
        ],
      },
    });
    if (overlappingCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Xe đã có lịch trùng trong khoảng thời gian này",
      });
    }

    // Tính toán chi phí thuê
    const msPerDay = 24 * 60 * 60 * 1000;
    const total_days = Math.max(1, Math.ceil((end - start) / msPerDay));
    const pricePerDay = parseFloat(vehicle.price_per_day || 0);
    const total_cost = Number((total_days * pricePerDay).toFixed(2));

    // Địa điểm và phí giao xe (nhận từ FE)
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

    // Áp dụng voucher (nếu có)
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

    const total_amount = Math.max(
      0,
      Number((subtotal - discount_amount).toFixed(2))
    );

    // Lưu booking
    const booking = await Booking.create({
      renter_id: renterId,
      vehicle_id,
      start_date: start,
      end_date: end,
      start_time: `${startTime || "09:00"}:00`,
      end_time: `${endTime || "18:00"}:00`,
      total_days,
      total_cost,
      discount_amount,
      delivery_fee,
      total_amount,
      total_paid: 0,
      voucher_code,
      points_used: 0,
      points_earned: 0,
      status: "pending",
      pickup_location,
      return_location,
    });

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
