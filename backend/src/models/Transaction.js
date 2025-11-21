// models/Transaction.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Transaction = sequelize.define(
  "Transaction",
  {
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
        "DEPOSIT", // Đặt cọc từ renter thanh toán trước 30%
        "RENTAL", // Thanh toán tiền thuê 70% còn lại từ renter
        "REFUND", // Hoàn tiền từ admin cho renter khi mà huỷ chuêyns
        "COMPENSATION", // Bồi thường từ renter cho owner khi renter huỷ chuyến (admin chuyển tiền)
        "PAYOUT", // Thanh toán tiền thuê từ admin cho owner khi hoàn thành chuyến (admin chuyển tiền )
        "TRAFFIC_FINE" // Thanh toán phí phạt nguội từ renter
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
    checkout_url: { 
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "PayOS checkout URL for payment"
    },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "transactions",
    timestamps: false, // we already manage created_at / updated_at
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["from_user_id"] },
      { fields: ["to_user_id"] },
      { fields: ["type", "status"] },
    ],
  }
);

export default Transaction;
