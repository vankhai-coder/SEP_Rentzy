// models/UserVoucher.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const UserVoucher = sequelize.define(
  "UserVoucher",
  {
    user_voucher_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    voucher_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "user_vouchers" }
);

export default UserVoucher;
