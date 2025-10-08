// models/Transaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Transaction = sequelize.define("Transaction", {
  transaction_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  booking_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  from_user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  to_user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      "DEPOSIT",       // Đặt cọc từ renter
      "RENTAL",        // Thanh toán tiền thuê từ renter
      "REFUND",        // Hoàn tiền từ admin cho renter
      "PAYOUT",        // Thanh toán tiền thuê từ admin cho owner
      "COMPENSATION",  // Bồi thường từ renter cho owner
      "WITHDRAWAL",    // Rút tiền từ owner về ngân hàng
      "TOPUP"          // Nạp tiền vào tài khoản
    ),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "CANCELLED"),
    defaultValue: "PENDING",
  },
  payment_method: {
    type: DataTypes.ENUM(
      "PAYOS",
      "CASH",
      "BANK_TRANSFER",
      "MOMO",
      "VNPAY",
      "ZALOPAY"
    ),
    allowNull: false,
  },
  processed_at: { type: DataTypes.DATE },
  note: { type: DataTypes.TEXT },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "transactions",
  timestamps: false, // we already manage created_at / updated_at
  indexes: [
    { fields: ["booking_id"] },
    { fields: ["from_user_id"] },
    { fields: ["to_user_id"] },
    { fields: ["type", "status"] },
  ],
});

export default Transaction;
