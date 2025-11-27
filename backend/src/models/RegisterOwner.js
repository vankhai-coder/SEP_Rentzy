// models/RegisterOwner.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RegisterOwner = sequelize.define(
  "RegisterOwner",
  {
    register_owner_id: {
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
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    reason_rejected: {
      type: DataTypes.STRING(255),
    },
    is_agree_to_terms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "register_owners",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default RegisterOwner;