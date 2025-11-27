// models/Vehicle.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Vehicle = sequelize.define(
  "Vehicle",
  {
    vehicle_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    owner_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    vehicle_type: {
      type: DataTypes.ENUM("car", "motorbike"),
      allowNull: false,
    },
    license_plate: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER, // Sequelize has no YEAR type, use INTEGER
      allowNull: false,
    },
    price_per_day: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    main_image_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    extra_images: {
      type: DataTypes.JSON,
    },
    features: {
      type: DataTypes.JSON,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },

    // Car fields
    transmission: {
      type: DataTypes.ENUM("manual", "automatic"),
    },
    body_type: {
      type: DataTypes.ENUM(
        "sedan",
        "suv",
        "hatchback",
        "convertible",
        "coupe",
        "minivan",
        "pickup",
        "van",
        "mpv"
      ),
    },
    seats: {
      type: DataTypes.TINYINT.UNSIGNED,
    },
    fuel_type: {
      type: DataTypes.ENUM("petrol", "diesel", "electric", "hybrid"),
    },

    // Motorbike fields
    bike_type: {
      type: DataTypes.ENUM("scooter", "manual", "clutch", "electric"),
    },
    engine_capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
    },

    // Status fields
    approvalStatus: {
      type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
      defaultValue: "none",
    },
    status: {
      type: DataTypes.ENUM("available", "blocked"),
      defaultValue: "available",
    },
    rent_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    blocked_by: {
      type: DataTypes.ENUM('admin', 'owner'),
      allowNull: true,
      defaultValue: null
    },
    fuel_consumption: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'VD: 6.5 L/100km hoặc 15 kWh/100km'
    },
    // Owner confirmation policy
    require_owner_confirmation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Nếu true: chủ xe cần xác nhận đơn thuê trước khi bắt đầu'
    },
  },
  {
    tableName: "vehicles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "idx_vehicles_owner", fields: ["owner_id"] },
      { name: "idx_vehicles_brand", fields: ["brand_id"] },
      { name: "idx_vehicles_type", fields: ["vehicle_type"] },
      { name: "idx_vehicles_status", fields: ["status"] },
      { name: "idx_vehicles_location", fields: ["location"] },
      { name: "idx_vehicles_approval", fields: ["approvalStatus"] },
    ],
  }
);

export default Vehicle;
