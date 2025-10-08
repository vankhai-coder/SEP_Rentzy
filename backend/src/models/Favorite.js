// models/Favorite.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Favorite = sequelize.define("Favorite", {
  favorite_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  vehicle_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "favorites",
  timestamps: false, // we manage created_at manually
  indexes: [
    { fields: ["user_id"] },
    { fields: ["vehicle_id"] },
    { unique: true, fields: ["user_id", "vehicle_id"] }, // unique constraint
  ],
});

export default Favorite;
