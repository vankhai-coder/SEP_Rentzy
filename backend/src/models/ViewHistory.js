// models/ViewHistory.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ViewHistory = sequelize.define(
  "ViewHistory",
  {
    view_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true, // Allow null cho guest
    },
    vehicle_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    duration_seconds: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 30,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "view_histories",
    timestamps: false,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["vehicle_id"] },
      { fields: ["created_at"] },
    ],
  }
);

export default ViewHistory;
