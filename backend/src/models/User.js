// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    user_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    phone_number: DataTypes.STRING(20),
    phone_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    password_hash: DataTypes.STRING(255),
    google_id: DataTypes.STRING(255),
    avatar_url: DataTypes.STRING(255),
    role: { type: DataTypes.ENUM("renter", "owner", "admin"), defaultValue: "renter" },
    driver_license_number: DataTypes.STRING(50),
    driver_license_name: DataTypes.STRING(100),
    driver_license_dob: DataTypes.DATE,
    driver_license_image_url: DataTypes.STRING(255),
    driver_license_status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending" },
    national_id_number: DataTypes.STRING(50),
    national_id_name: DataTypes.STRING(100),
    national_id_dob: DataTypes.DATE,
    national_id_image_url: DataTypes.STRING(255),
    national_id_status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending" },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "users" }
);

export default User;
