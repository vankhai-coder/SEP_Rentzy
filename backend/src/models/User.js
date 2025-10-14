// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phone_number: {
      type: DataTypes.STRING(20),
    },
    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    password_hash: {
      type: DataTypes.STRING(255),
    },
    google_id: {
      type: DataTypes.STRING(255),
    },
    avatar_url: {
      type: DataTypes.STRING(255),
    },
    role: {
      type: DataTypes.ENUM("renter", "owner", "admin"),
      allowNull: false,
      defaultValue: "renter",
    },
    driver_license_number: {
      type: DataTypes.STRING(50),
    },
    driver_license_name: {
      type: DataTypes.STRING(100),
    },
    driver_license_dob: {
      type: DataTypes.DATEONLY,
    },
    driver_license_image_url: { // store key to aws s3 
      type: DataTypes.STRING(255),
    },
    driver_license_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    national_id_number: {
      type: DataTypes.STRING(50),
    },
    national_id_name: {
      type: DataTypes.STRING(100),
    },
    national_id_dob: {
      type: DataTypes.DATEONLY,
    },
    national_id_image_url: {
      type: DataTypes.STRING(255),
    },
    national_id_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    authMethod: {
      type: DataTypes.ENUM('oauth', 'email'),
      allowNull: false
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    verifyEmailToken: {
      type: DataTypes.STRING,
    } ,
    updatedEmail: {
      type: DataTypes.STRING,
      unique : true
    }
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "idx_users_role", fields: ["role"] },
      { name: "idx_users_email_verified", fields: ["email_verified"] },
    ],
  }
);
export default User;
