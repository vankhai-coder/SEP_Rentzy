// models/BookingHandover.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingHandover = sequelize.define(
  "BookingHandover",
  {
    // ID bàn giao xe (khóa chính)
    handover_id: {
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

    // === THÔNG TIN BÀN GIAO XE (PICKUP) ===
    // Chủ xe xác nhận bàn giao
    owner_handover_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Người thuê xác nhận nhận xe
    renter_handover_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Thời gian bàn giao xe
    handover_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Hình ảnh xe trước khi thuê
    pre_rental_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // === THÔNG TIN TRẢ XE (RETURN) ===
    // Chủ xe xác nhận nhận lại xe
    owner_return_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Người thuê xác nhận trả xe
    renter_return_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Thời gian trả xe
    return_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Hình ảnh xe sau khi thuê
    post_rental_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // THÔNG TIN HƯ HỎNG VÀ BỒI THƯỜNG
    // Có báo cáo hư hỏng không
    damage_reported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Mô tả hư hỏng
    damage_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Số tiền bồi thường
    compensation_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // có trễ hay ko
    late_return: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Phí trả xe trễ
    late_return_fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    // Mô tả chi tiết về phí trả trễ
    late_return_fee_description: {
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
  },
  {
    tableName: "booking_handovers",
    timestamps: false,
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["handover_time", "return_time"] },
      { fields: ["damage_reported"] },
    ],
  }
);

export default BookingHandover;
