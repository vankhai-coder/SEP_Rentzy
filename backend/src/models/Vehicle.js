// models/Vehicle.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Vehicle = sequelize.define(
  "Vehicle",
  {
    vehicle_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    owner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    brand_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    model: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM("car", "motorbike", "bicycle"), allowNull: false },
    license_plate: DataTypes.STRING(20),
    price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    location: DataTypes.STRING(255),
    description: DataTypes.TEXT,
    status: { type: DataTypes.ENUM("available", "unavailable"), defaultValue: "available" },
  },
  { tableName: "vehicles" }
);

export default Vehicle;
