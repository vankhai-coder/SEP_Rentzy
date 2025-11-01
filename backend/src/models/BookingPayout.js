// models/BookingPayout.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingPayout = sequelize.define("BookingPayout", {
    // ID thanh toán (khóa chính)
    payout_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    // ID đặt xe liên quan
    booking_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true, // Quan hệ 1-1 với booking
    },

    // === THÔNG TIN TÀI CHÍNH ===
    // Tổng số tiền thuê xe
    total_rental_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    // Tỷ lệ hoa hồng nền tảng
    platform_commission_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: "Tỷ lệ hoa hồng (ví dụ: 0.1000 cho 10%)",
    },


    // === THÔNG TIN GIẢI NGÂN ===
    // Trạng thái thanh toán
    payout_status: {
      type: DataTypes.ENUM(
        "pending",     // Chờ xử lý
        "processing",  // Đang xử lý
        "completed",   // Hoàn thành
        "failed",      // Thất bại
        "cancelled"    // Đã hủy
      ),
      defaultValue: "pending",
    },
    // Phương thức thanh toán
    payout_method: {
      type: DataTypes.ENUM("bank_transfer", "momo", "zalopay", "vnpay"),
      allowNull: false,
    },
    // Thông tin tài khoản nhận tiền
    payout_account_info: {
      type: DataTypes.JSON,
      // "bank_name": "Vietcombank",
    //"account_number": "1234567890", 
    //"account_holder": "Nguyen Van A",
    //"branch": "Chi nhánh Hà Nội"
      allowNull: true,
      comment: "Thông tin tài khoản ngân hàng hoặc ví điện tử",
    },

    // Thời gian yêu cầu thanh toán
    requested_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Thời gian bắt đầu xử lý
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Thời gian hoàn thành
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Lý do thất bại (nếu có)
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },


    // Thời gian tạo bản ghi
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Thời gian cập nhật cuối
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
  tableName: "booking_payouts",
    timestamps: false,
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["payout_status"] },
      { fields: ["payout_method"] },
      { fields: ["requested_at"] },
      { fields: ["processed_at"] },
    ],
  }
);

export default BookingPayout;
