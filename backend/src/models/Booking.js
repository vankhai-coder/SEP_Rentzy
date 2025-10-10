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
    // Tổng chi phí thuê xe (chưa bao gồm phí khác)
    total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    // Số tiền giảm giá
    discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Phí giao xe
    delivery_fee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Tổng số tiền phải trả (sau khi tính giảm giá và phí)
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    // Tổng số tiền đã thanh toán
    total_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },

    // Mã voucher sử dụng
    voucher_code: { type: DataTypes.STRING(50) },
    // Số điểm đã sử dụng
    points_used: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Số điểm được tích lũy từ đơn hàng này
    points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },

    // Mã đơn hàng còn lại (dùng cho thanh toán)
    order_code_remaining: { type: DataTypes.BIGINT, unique: true },

    // Trạng thái đặt xe
    status: {
      type: DataTypes.ENUM(
        "pending", // Chờ xác nhận
        "deposit_paid", // Đã đặt cọc
        "confirmed", // Đã xác nhận
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
