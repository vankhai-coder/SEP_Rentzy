// models/Brand.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Brand = sequelize.define(
  "Brand",
  {
    brand_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    brand_name: { type: DataTypes.STRING(100), allowNull: false },
  },
  { tableName: "brands" }
);

export default Brand;
