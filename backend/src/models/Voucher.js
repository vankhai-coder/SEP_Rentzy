// models/Voucher.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Voucher = sequelize.define(
  "Voucher",
  {
    voucher_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: DataTypes.STRING(255),
    discount_percent: { type: DataTypes.INTEGER, allowNull: false },
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    created_by: DataTypes.BIGINT.UNSIGNED,
  },
  { tableName: "vouchers" }
);

export default Voucher;
