// models/SystemSetting.js (simple & enum-based)
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Bảng 1: quản lý tất cả loại phí bằng một model đơn giản
// Yêu cầu các loại phí:
// - CANCEL_WITHIN_HOLD_1H: Huỷ trong 1h giữ chỗ
// - CANCEL_BEFORE_7_DAYS: Huỷ trước chuyến đi > 7 ngày (sau 1h giữ chỗ)
// - CANCEL_WITHIN_7_DAYS: Huỷ trong vòng 7 ngày trước chuyến đi (sau 1h giữ chỗ)
// - PLATFORM_FEE_COMPLETE_ORDER: Phí hệ thống khi hoàn thành đơn
// - OTHER_FEES: Các loại phí khác
const SystemSetting = sequelize.define(
  "SystemSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Mã định danh phí (dùng enum để thống nhất, truy vấn đơn giản)
    // Dùng thuộc tính JS 'feeCode', ánh xạ xuống cột DB 'fee_code'
    feeCode: {
      type: DataTypes.ENUM(
        "CANCEL_WITHIN_HOLD_1H",
        "CANCEL_BEFORE_7_DAYS",
        "CANCEL_WITHIN_7_DAYS",
        "PLATFORM_FEE_COMPLETE_ORDER",
        "LATE_RETURN_FEE_PER_HOUR",
        "AUTO_APPROVE_VEHICLE",
        "OTHER_FEES"
      ),
      allowNull: false,
      unique: true,
      field: "fee_code",
      comment:
        "Mã định danh của phí (vd: CANCEL_WITHIN_7_DAYS, PLATFORM_FEE_COMPLETE_ORDER)",
    },

    // Tên hiển thị trong Admin
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Tên hiển thị của loại phí",
    },

    // Phí theo phần trăm (0-100)
    percent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Phần trăm phí áp dụng",
    },

    // Mô tả chính sách
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Mô tả chi tiết về loại phí",
    },
  },
  {
    tableName: "system_settings",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_system_settings_fee_code",
        unique: true,
        fields: ["fee_code"],
      },
    ],
  }
);

export default SystemSetting;
