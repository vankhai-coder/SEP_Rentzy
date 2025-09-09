// models/Favorite.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Favorite = sequelize.define(
  "Favorite",
  {
    favorite_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    vehicle_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  },
  { tableName: "favorites" }
);

export default Favorite;
