// models/VehicleReport.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const REASON_ENUM = [
  "fake_info", // Xe không đúng thực tế
  "illegal", // Xe vi phạm pháp luật
  "bad_owner", // Chủ xe không hợp tác
  "dangerous", // Xe nguy hiểm/không an toàn
  "other", // Khác
];

const VehicleReport = sequelize.define(
  "VehicleReport",
  {
    report_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicle_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(...REASON_ENUM),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewing", "resolved", "rejected"),
      defaultValue: "pending",
    },
    admin_note: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "vehicle_reports",
    timestamps: false, // we use created_at only
  }
);

export default VehicleReport;
