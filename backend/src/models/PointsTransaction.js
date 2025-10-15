// models/PointsTransaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PointsTransaction = sequelize.define(
  "PointsTransaction",
  {
    transaction_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM("earn", "spend", "expire", "refund"),
      allowNull: false,
    },
    points_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Âm nếu tiêu, dương nếu tích",
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference_type: {
      type: DataTypes.ENUM("booking", "voucher", "bonus", "penalty"),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "points_transactions",
    timestamps: false,
    indexes: [
      { fields: ["user_id", "created_at"] },
      { fields: ["transaction_type"] },
      { fields: ["reference_type", "reference_id"] },
    ],
  }
);

export default PointsTransaction;
