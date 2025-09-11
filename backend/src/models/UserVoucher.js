// models/UserVoucher.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserVoucher = sequelize.define(
  "UserVoucher",
  {
    user_voucher_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    voucher_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    points_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    booking_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    acquired_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_vouchers",
    timestamps: false, // because only acquired_at, used_at, expires_at exist
    indexes: [
      { name: "idx_user_vouchers_user", fields: ["user_id", "is_used"] },
      { name: "idx_user_vouchers_voucher", fields: ["voucher_id"] },
      { name: "idx_user_vouchers_expires", fields: ["expires_at"] },
    ],
  }
);

export default UserVoucher;
