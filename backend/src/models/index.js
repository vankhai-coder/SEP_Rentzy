import sequelize from "../config/db.js";
import User from "./User.js";
import Bank from "./Bank.js";
import Brand from "./Brand.js";
import Vehicle from "./Vehicle.js";
import Voucher from "./Voucher.js";
import PointsTransaction from "./PointsTransaction.js";
import Notification from "./Notification.js";
import Booking from "./Booking.js";
import BookingReview from "./BookingReview.js";
import BookingHandover from "./BookingHandover.js";
import BookingContract from "./BookingContract.js";
import BookingCancellation from "./BookingCancellation.js";
import BookingPayout from "./BookingPayout.js";
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

// Users ↔ PointsTransactions
User.hasMany(PointsTransaction, { foreignKey: "user_id" });
PointsTransaction.belongsTo(User, { foreignKey: "user_id" });

// Booking ↔ PointsTransaction (1:1)
Booking.hasOne(PointsTransaction, { foreignKey: "reference_id", as: "pointsTransaction" });
PointsTransaction.belongsTo(Booking, { foreignKey: "reference_id", as: "booking" });

// Users ↔ Notifications
User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

// Bookings ↔ Users
User.hasMany(Booking, { foreignKey: "renter_id", as: "RenterBookings" });
Booking.belongsTo(User, { as: "renter", foreignKey: "renter_id" });

// Booking ↔ BookingReview (1:1)
Booking.hasOne(BookingReview, { foreignKey: "booking_id", as: "review" });
BookingReview.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Booking ↔ BookingHandover (1:1)
Booking.hasOne(BookingHandover, { foreignKey: "booking_id", as: "handover" });
BookingHandover.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Booking ↔ BookingContract (1:1)
Booking.hasOne(BookingContract, { foreignKey: "booking_id", as: "contract" });
BookingContract.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Booking ↔ BookingCancellation (1:1)
Booking.hasOne(BookingCancellation, { foreignKey: "booking_id", as: "cancellation" });
BookingCancellation.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Booking ↔ BookingPayout (1:1)
Booking.hasOne(BookingPayout, { foreignKey: "booking_id", as: "payout" });
BookingPayout.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Bookings ↔ Vehicles
Vehicle.hasMany(Booking, { foreignKey: "vehicle_id" });
Booking.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

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
Transaction.belongsTo(User, { as: "fromUser", foreignKey: "from_user_id" });
Transaction.belongsTo(User, { as: "toUser", foreignKey: "to_user_id" });

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

// Voucher ↔ Booking
Voucher.hasMany(Booking, { foreignKey: "voucher_code", as: "bookings" });
Booking.belongsTo(Voucher, { foreignKey: "voucher_code", as: "voucher" });

// --- COLLECT MODELS INTO ONE OBJECT ---
const db = {
  sequelize,
  User,
  Bank,
  Brand,
  Vehicle,
  Voucher,
  PointsTransaction,
  Notification,
  Booking,
  BookingReview,
  BookingHandover,
  BookingContract,
  BookingCancellation,
  BookingPayout,
  Transaction,
  Favorite,
  Message,
  VehicleReport,
};

export default db;
