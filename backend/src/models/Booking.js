// models/Booking.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Booking = sequelize.define(
  "Booking",
  {
    // ID đặt xe (khóa chính)
    booking_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    // ID người thuê xe
    renter_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    // ID xe được thuê
    vehicle_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    // Ngày bắt đầu thuê
    start_date: { type: DataTypes.DATE, allowNull: false },
    // Giờ bắt đầu thuê
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "09:00:00",
    },

    // Ngày kết thúc thuê
    end_date: { type: DataTypes.DATE, allowNull: false },
    // Giờ kết thúc thuê
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: "18:00:00",
    },
    // Tổng số ngày thuê
    total_days: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    // Tổng chi phí thuê xe (chưa bao gồm phí khác) ngày * tiền thuê xe 1 ngày  ( 3 ngày *400)
    total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    // Số tiền giảm giá
    discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Phí giao xe
    delivery_fee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Phí phạt nguội (traffic fine)
    traffic_fine_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Số tiền phạt nguội đã thanh toán
    traffic_fine_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Mô tả phạt nguội (lưu thông tin vi phạm)
    traffic_fine_description: { type: DataTypes.TEXT, allowNull: true },
    // Hình ảnh phạt nguội (lưu dưới dạng JSON array)
    traffic_fine_images: { type: DataTypes.TEXT, allowNull: true },
    // Tổng số tiền phải trả (sau khi tính giảm giá và phí)
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    // Tổng số tiền đã thanh toán
    total_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // trạng thái thanh toán bằng tiền mặt bởi renter thanh toán 70% còn lại
    remaining_paid_by_cash_status: {
      type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
      defaultValue: "none",
    },
    // Mã voucher sử dụng
    voucher_code: { type: DataTypes.STRING(50) },
    // Số điểm đã sử dụng
    points_used: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Số điểm được tích lũy từ đơn hàng này
    points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },

    // Mã đơn hàng cho thanh toán đặt cọc
    order_code: { type: DataTypes.BIGINT, unique: true },
    // Mã đơn hàng còn lại (dùng cho thanh toán)
    order_code_remaining: { type: DataTypes.BIGINT, unique: true },

    // Trạng thái đặt xe
    status: {
      type: DataTypes.ENUM(
        "pending", // Chờ xác nhận
        "confirmed", // Đã xác nhận đặt xe (owner đã chấp nhận)
        "deposit_paid", // Đã đặt cọc
        "fully_paid", // Đã thanh toán toàn bộ
        "in_progress", // Đang thuê
        "completed", // Hoàn thành
        "cancel_requested", // Yêu cầu hủy
        "canceled" // Đã hủy
      ),
      defaultValue: "pending",
    },

    // Địa điểm nhận xe
    pickup_location: { type: DataTypes.STRING(255), allowNull: false },
    // Địa điểm trả xe
    return_location: { type: DataTypes.STRING(255), allowNull: false },

    // Thời gian tạo đơn
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // Thời gian cập nhật cuối
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "bookings",
    timestamps: false, // we use created_at / updated_at manually
    indexes: [
      { fields: ["renter_id"] },
      { fields: ["vehicle_id"] },
      { fields: ["start_date", "end_date"] },
      { fields: ["created_at"] },
    ],
  }
);

export default Booking;
