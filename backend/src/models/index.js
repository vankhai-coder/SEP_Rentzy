import sequelize from "../config/db.js";
import User from "./User.js";
import Bank from "./Bank.js";
import Brand from "./Brand.js";
import Vehicle from "./Vehicle.js";
import Voucher from "./Voucher.js";
import UserVoucher from "./UserVoucher.js";
import PointsTransaction from "./PointsTransaction.js";
import Notification from "./Notification.js";
import Booking from "./Booking.js";
import Transaction from "./Transaction.js";
import Favorite from "./Favorite.js";
import Message from "./Message.js";
import VehicleReport from "./VehicleReport.js";

// --- RELATIONS ---

// Users ↔ Banks
User.hasMany(Bank, { foreignKey: "user_id" });
Bank.belongsTo(User, { foreignKey: "user_id" });

// Users ↔ Vehicles
User.hasMany(Vehicle, { foreignKey: "owner_id" });
Vehicle.belongsTo(User, { as: "owner", foreignKey: "owner_id" });

// Brands ↔ Vehicles
Brand.hasMany(Vehicle, { foreignKey: "brand_id" });
Vehicle.belongsTo(Brand, { foreignKey: "brand_id" });

// Users ↔ Vouchers
User.hasMany(Voucher, { foreignKey: "created_by" });
Voucher.belongsTo(User, { as: "creator", foreignKey: "created_by" });

// Users ↔ UserVouchers ↔ Vouchers
User.hasMany(UserVoucher, { foreignKey: "user_id" });
UserVoucher.belongsTo(User, { foreignKey: "user_id" });
Voucher.hasMany(UserVoucher, { foreignKey: "voucher_id" });
UserVoucher.belongsTo(Voucher, { foreignKey: "voucher_id" });

// Users ↔ PointsTransactions
User.hasMany(PointsTransaction, { foreignKey: "user_id" });
PointsTransaction.belongsTo(User, { foreignKey: "user_id" });

// Users ↔ Notifications
User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

// Bookings ↔ Users
User.hasMany(Booking, { foreignKey: "renter_id", as: "RenterBookings" });
User.hasMany(Booking, { foreignKey: "owner_id", as: "OwnerBookings" });
Booking.belongsTo(User, { as: "renter", foreignKey: "renter_id" });
Booking.belongsTo(User, { as: "owner", foreignKey: "owner_id" });

// Bookings ↔ Vehicles
Vehicle.hasMany(Booking, { foreignKey: "vehicle_id" });
Booking.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

// Bookings ↔ UserVouchers
UserVoucher.hasMany(Booking, { foreignKey: "user_voucher_id" });
Booking.belongsTo(UserVoucher, { foreignKey: "user_voucher_id" });

// Bookings ↔ Messages
Booking.hasMany(Message, { foreignKey: "booking_id" });
Message.belongsTo(Booking, { foreignKey: "booking_id" });

// Users ↔ Messages
User.hasMany(Message, { foreignKey: "sender_id", as: "SentMessages" });
User.hasMany(Message, { foreignKey: "receiver_id", as: "ReceivedMessages" });
Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

// Bookings ↔ Transactions
Booking.hasMany(Transaction, { foreignKey: "booking_id" });
Transaction.belongsTo(Booking, { foreignKey: "booking_id" });

// Users ↔ Transactions
User.hasMany(Transaction, { foreignKey: "from_user_id", as: "SentTransactions" });
User.hasMany(Transaction, { foreignKey: "to_user_id", as: "ReceivedTransactions" });
User.hasMany(Transaction, { foreignKey: "admin_id", as: "AdminTransactions" });
Transaction.belongsTo(User, { as: "fromUser", foreignKey: "from_user_id" });
Transaction.belongsTo(User, { as: "toUser", foreignKey: "to_user_id" });
Transaction.belongsTo(User, { as: "admin", foreignKey: "admin_id" });

// Favorites
User.hasMany(Favorite, { foreignKey: "user_id" });
Favorite.belongsTo(User, { foreignKey: "user_id" });
Vehicle.hasMany(Favorite, { foreignKey: "vehicle_id" });
Favorite.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

// Vehicle ↔ VehicleReports
Vehicle.hasMany(VehicleReport, { foreignKey: "vehicle_id" });
VehicleReport.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

// User ↔ VehicleReports
User.hasMany(VehicleReport, { foreignKey: "user_id" });
VehicleReport.belongsTo(User, { foreignKey: "user_id" });

// --- COLLECT MODELS INTO ONE OBJECT ---
const db = {
  sequelize,
  User,
  Bank,
  Brand,
  Vehicle,
  Voucher,
  UserVoucher,
  PointsTransaction,
  Notification,
  Booking,
  Transaction,
  Favorite,
  Message,
};

export default db;
