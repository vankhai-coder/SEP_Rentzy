// models/BookingContract.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingContract = sequelize.define("BookingContract", {
    // ID hợp đồng (khóa chính)
    contract_id: {
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
    // Số hợp đồng (duy nhất)
    contract_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    // === CHỮ KÝ ĐIỆN TỬ ===
    // Chữ ký người thuê
    renter_signature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Chữ ký chủ xe
    owner_signature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Thời gian người thuê ký
    renter_signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Thời gian chủ xe ký
    owner_signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Trạng thái hợp đồng
    contract_status: {
      type: DataTypes.ENUM(
        "draft",              // Bản nháp
        "pending_signatures", // Chờ ký
        "signed",             // Đã ký
        "completed",          // Hoàn thành
        "terminated"          // Chấm dứt
      ),
      defaultValue: "draft",
    },

    // Đường dẫn file hợp đồng
    contract_file_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // Thời gian tạo hợp đồng
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
  tableName: "booking_contracts",
    timestamps: false,
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["contract_number"] },
      { fields: ["contract_status"] },
      { fields: ["renter_signed_at", "owner_signed_at"] },
      { fields: ["created_at"] },
    ],
  }
);

export default BookingContract;
