// models/Booking.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Booking = sequelize.define("Booking", {
  booking_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  renter_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  owner_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  vehicle_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },

  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE, allowNull: false },
  total_days: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  delivery_fee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  total_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },

  voucher_code: { type: DataTypes.STRING(50) },
  user_voucher_id: { type: DataTypes.BIGINT.UNSIGNED },

  order_code: { type: DataTypes.BIGINT, unique: true },
  order_code_remaining: { type: DataTypes.BIGINT, unique: true },

  status: {
    type: DataTypes.ENUM(
      "pending",
      "deposit_paid",
      "confirmed",
      "in_progress",
      "completed",
      "cancel_requested",
      "canceled"
    ),
    defaultValue: "pending",
  },

  pickup_location: { type: DataTypes.STRING(255), allowNull: false },
  return_location: { type: DataTypes.STRING(255), allowNull: false },

  owner_handover_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  renter_handover_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  owner_return_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  renter_return_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },

  renter_signature: { type: DataTypes.STRING(255) },
  owner_signature: { type: DataTypes.STRING(255) },

  cancellation_reason: { type: DataTypes.TEXT },
  cancelled_at: { type: DataTypes.DATE },
  cancel_requested_at: { type: DataTypes.DATE },
  cancelled_by: { type: DataTypes.ENUM("renter", "system") },

  owner_approved_cancel_at: { type: DataTypes.DATE },
  owner_approved_cancel_by: { type: DataTypes.BIGINT.UNSIGNED },

  totalRefundForRenterCancel: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  totalRefundForOwnerCancel: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },

  refundStatusRenter: {
    type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
    defaultValue: "none",
  },
  refundStatusOwner: {
    type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
    defaultValue: "none",
  },

  payoutStatus: {
    type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
    defaultValue: "none",
  },

  rating: { type: DataTypes.TINYINT.UNSIGNED, validate: { min: 1, max: 5 } },
  review: { type: DataTypes.TEXT },

  pre_rental_images: { type: DataTypes.JSON },
  post_rental_images: { type: DataTypes.JSON },

  points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "bookings",
  timestamps: false, // we use created_at / updated_at manually
  indexes: [
    { fields: ["renter_id"] },
    { fields: ["owner_id"] },
    { fields: ["vehicle_id"] },
    { fields: ["status"] },
    { fields: ["start_date"] },
    { fields: ["end_date"] },
  ],
});

export default Booking;
