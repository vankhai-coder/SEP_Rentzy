// models/Transaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Transaction = sequelize.define(
  "Transaction",
  {
    transaction_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    from_user_id: DataTypes.BIGINT.UNSIGNED,
    to_user_id: DataTypes.BIGINT.UNSIGNED,
    admin_id: DataTypes.BIGINT.UNSIGNED,
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    type: { type: DataTypes.ENUM("payment", "refund", "fee"), allowNull: false },
  },
  { tableName: "transactions" }
);

export default Transaction;
