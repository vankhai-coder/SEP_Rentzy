// models/PointsTransaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const PointsTransaction = sequelize.define(
  "PointsTransaction",
  {
    transaction_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("earn", "spend"), allowNull: false },
    description: DataTypes.STRING(255),
  },
  { tableName: "points_transactions" }
);

export default PointsTransaction;
