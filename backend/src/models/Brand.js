// models/Brand.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Brand = sequelize.define(
  "Brand",
  {
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    country: {
      type: DataTypes.STRING(100),
    },
    logo_url: {
      type: DataTypes.STRING(255),
    },
    category: {
      type: DataTypes.ENUM("car", "motorbike", "both"),
      allowNull: false,
      defaultValue: "both",
    },
  },
  {
    tableName: "brands",
    timestamps: true,
  }
);

export default Brand;
