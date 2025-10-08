// models/Bank.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Bank = sequelize.define(
  "Bank",
  {
    bank_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "users", // table name
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    account_holder_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    qr_code_url: {
      type: DataTypes.STRING(255),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "banks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ name: "idx_banks_user", fields: ["user_id"] }],
  }
);

export default Bank;
