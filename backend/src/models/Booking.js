// models/Booking.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const Booking = sequelize.define(
  "Booking",
  {
    booking_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    renter_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    owner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    vehicle_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"), defaultValue: "pending" },
    user_voucher_id: DataTypes.BIGINT.UNSIGNED,
  },
  { tableName: "bookings" }
);

export default Booking;
