// models/Voucher.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Voucher = sequelize.define(
  "Voucher",
  {
    voucher_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    discount_type: {
      type: DataTypes.ENUM("PERCENT", "AMOUNT"),
      allowNull: false,
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    min_order_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    max_discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: null,
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    usage_limit: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: null,
    },
    used_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    image_url: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "vouchers",

    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "idx_vouchers_active", fields: ["is_active", "valid_to"] },
      { name: "idx_vouchers_creator", fields: ["created_by"] },
    ],
  }
);

export default Voucher;
