// models/BookingCancellation.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingCancellation = sequelize.define("BookingCancellation", {
  // ID hủy đơn (khóa chính)
  cancellation_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  // ID đặt xe bị hủy
  booking_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true, // Quan hệ 1-1 với booking
    references: {
      model: 'bookings',
      key: 'booking_id'
    }
  },
  
  // === THÔNG TIN HỦY ĐƠN ===
  // Lý do hủy đơn
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  // Thời gian yêu cầu hủy
  cancel_requested_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Phí hủy đơn
  cancellation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Người hủy đơn
  cancelled_by: {
    type: DataTypes.ENUM('renter', 'owner', 'admin', 'system'),
    allowNull: false,
  },

  // Tổng tiền hoàn cho người thuê
  total_refund_for_renter: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  // Trạng thái hoàn tiền cho người thuê
  refund_status_renter: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none',
  },
  // Lý do hoàn tiền cho người thuê
  refund_reason_renter: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Thời gian xử lý hoàn tiền cho người thuê
  refund_processed_at_renter: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // === THÔNG TIN HOÀN TIỀN CHO CHỦ XE (nếu người thuê hủy muộn) ===
  // Tổng tiền hoàn cho chủ xe
  total_refund_for_owner: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  // Trạng thái hoàn tiền cho chủ xe
  refund_status_owner: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none',
  },
  // Thời gian xử lý hoàn tiền cho chủ xe
  refund_processed_at_owner: {
    type: DataTypes.DATE,
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
  tableName: "booking_cancellations",
  timestamps: false,
  indexes: [
    { fields: ["booking_id"] },
    { fields: ["refund_status_renter", "refund_status_owner"] },
    { fields: ["created_at"] },
  ],
});

export default BookingCancellation;