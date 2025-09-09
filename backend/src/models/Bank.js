// models/Bank.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Bank = sequelize.define(
  "Bank",
  {
    bank_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    bank_name: DataTypes.STRING(100),
    account_number: DataTypes.STRING(50),
    account_holder_name: DataTypes.STRING(100),
  },
  { tableName: "banks" }
);

export default Bank;
