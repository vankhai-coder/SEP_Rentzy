import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const FeatureFlag = sequelize.define(
  "FeatureFlag",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "feature_flags",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["key"] }],
  }
);

export default FeatureFlag;