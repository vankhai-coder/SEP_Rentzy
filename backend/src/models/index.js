import sequelize from "../config/db.js";

// Bảng cơ sở (không phụ thuộc)
import User from "./User.js";
import Brand from "./Brand.js";
import Voucher from "./Voucher.js";
import SystemSetting from "./SystemSetting.js";
import FeatureFlag from "./FeatureFlag.js";

// Bảng phụ thuộc User
import Bank from "./Bank.js";
import Notification from "./Notification.js";
import PointsTransaction from "./PointsTransaction.js";
import Message from "./Message.js";

// Bảng phụ thuộc Brand và User
import Vehicle from "./Vehicle.js";

// Bảng phụ thuộc Vehicle và User
import Booking from "./Booking.js";
import Favorite from "./Favorite.js";
import VehicleReport from "./VehicleReport.js";
import SearchHistory from "./SearchHistory.js";
import ViewHistory from "./ViewHistory.js";
// Bảng phụ thuộc Booking
import BookingReview from "./BookingReview.js";
import BookingHandover from "./BookingHandover.js";
import BookingContract from "./BookingContract.js";
import BookingCancellation from "./BookingCancellation.js";
import BookingPayout from "./BookingPayout.js";
import Transaction from "./Transaction.js";
import RegisterOwner from "./RegisterOwner.js";
import TrafficFineRequest from "./TrafficFineRequest.js";

// --- RELATIONS ---

// === BẢNG CƠ SỞ ===

// User ↔ Voucher
User.hasMany(Voucher, { foreignKey: "created_by" });
Voucher.belongsTo(User, { as: "creator", foreignKey: "created_by" });

// === BẢNG PHỤ THUỘC USER ===

// User ↔ Bank
User.hasMany(Bank, { foreignKey: "user_id", as: "banks" });
Bank.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

// User ↔ PointsTransaction
User.hasMany(PointsTransaction, { foreignKey: "user_id" });
PointsTransaction.belongsTo(User, { foreignKey: "user_id" });

// User ↔ Message
User.hasMany(Message, { foreignKey: "sender_id", as: "SentMessages" });
User.hasMany(Message, { foreignKey: "receiver_id", as: "ReceivedMessages" });
Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

// User ↔ SearchHistory
User.hasMany(SearchHistory, { foreignKey: "user_id" });
SearchHistory.belongsTo(User, { foreignKey: "user_id" });

// User ↔ ViewHistory
User.hasMany(ViewHistory, { foreignKey: "user_id" });
ViewHistory.belongsTo(User, { foreignKey: "user_id" });
// === BẢNG PHỤ THUỘC BRAND VÀ USER ===

// Brand ↔ Vehicle
Brand.hasMany(Vehicle, { foreignKey: "brand_id" });
Vehicle.belongsTo(Brand, { as: "brand", foreignKey: "brand_id" });

// User ↔ Vehicle
User.hasMany(Vehicle, { foreignKey: "owner_id" });
Vehicle.belongsTo(User, { as: "owner", foreignKey: "owner_id" });

// === BẢNG PHỤ THUỘC VEHICLE VÀ USER ===

// Vehicle ↔ Booking
Vehicle.hasMany(Booking, { foreignKey: "vehicle_id" });
Booking.belongsTo(Vehicle, { foreignKey: "vehicle_id", as: "vehicle" });

// Vehicle ↔ ViewHistory
Vehicle.hasMany(ViewHistory, { foreignKey: "vehicle_id" });
ViewHistory.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

// User ↔ Booking
User.hasMany(Booking, { foreignKey: "renter_id", as: "RenterBookings" });
Booking.belongsTo(User, { as: "renter", foreignKey: "renter_id" });

// Voucher ↔ Booking
Voucher.hasMany(Booking, {
  foreignKey: "voucher_code",
  sourceKey: "code",
  as: "bookings",
});
Booking.belongsTo(Voucher, {
  foreignKey: "voucher_code",
  targetKey: "code",
  as: "voucher",
});

// User ↔ Favorite
User.hasMany(Favorite, { foreignKey: "user_id" });
Favorite.belongsTo(User, { foreignKey: "user_id" });

// Vehicle ↔ Favorite
Vehicle.hasMany(Favorite, { foreignKey: "vehicle_id" });
Favorite.belongsTo(Vehicle, { foreignKey: "vehicle_id" });

// Vehicle ↔ VehicleReport
Vehicle.hasMany(VehicleReport, { foreignKey: "vehicle_id" });
VehicleReport.belongsTo(Vehicle, { foreignKey: "vehicle_id", as: "vehicle" });

// User ↔ VehicleReport
User.hasMany(VehicleReport, { foreignKey: "user_id", as: "reports" });
VehicleReport.belongsTo(User, { foreignKey: "user_id", as: "user" });

// === BẢNG PHỤ THUỘC BOOKING ===

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
Booking.hasOne(BookingCancellation, {
  foreignKey: "booking_id",
  as: "cancellation",
});
BookingCancellation.belongsTo(Booking, {
  foreignKey: "booking_id",
  as: "booking",
});

// Booking ↔ BookingPayout (1:1)
Booking.hasOne(BookingPayout, { foreignKey: "booking_id", as: "payout" });
BookingPayout.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// Booking ↔ Transaction
Booking.hasMany(Transaction, { foreignKey: "booking_id" });
Transaction.belongsTo(Booking, { foreignKey: "booking_id" });

// User ↔ Transaction
User.hasMany(Transaction, {
  foreignKey: "from_user_id",
  as: "SentTransactions",
});
User.hasMany(Transaction, {
  foreignKey: "to_user_id",
  as: "ReceivedTransactions",
});
Transaction.belongsTo(User, { as: "fromUser", foreignKey: "from_user_id" });
Transaction.belongsTo(User, { as: "toUser", foreignKey: "to_user_id" });

// Booking ↔ PointsTransaction (1:1)
Booking.hasOne(PointsTransaction, {
  foreignKey: "reference_id",
  as: "pointsTransaction",
});
PointsTransaction.belongsTo(Booking, {
  foreignKey: "reference_id",
  as: "booking",
});

// User ↔ RegisterOwner (1:1)
User.hasOne(RegisterOwner, { foreignKey: "user_id", as: "registerOwner" });
RegisterOwner.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Booking ↔ TrafficFineRequest
Booking.hasMany(TrafficFineRequest, { foreignKey: "booking_id", as: "trafficFineRequests" });
TrafficFineRequest.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

// User ↔ TrafficFineRequest (owner)
User.hasMany(TrafficFineRequest, { foreignKey: "owner_id", as: "trafficFineRequests" });
TrafficFineRequest.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// User ↔ TrafficFineRequest (reviewer/admin)
User.hasMany(TrafficFineRequest, { foreignKey: "reviewed_by", as: "reviewedTrafficFineRequests" });
TrafficFineRequest.belongsTo(User, { foreignKey: "reviewed_by", as: "reviewer" });

// --- COLLECT MODELS INTO ONE OBJECT ---
const db = {
  sequelize,
  // Bảng cơ sở
  User,
  Brand,
  Voucher,
  SystemSetting,
  FeatureFlag,
  // Bảng phụ thuộc User
  Bank,
  Notification,
  PointsTransaction,
  Message,
  SearchHistory,
  ViewHistory,
  // Bảng phụ thuộc Brand và User
  Vehicle,
  // Bảng phụ thuộc Vehicle và User
  Booking,
  Favorite,
  VehicleReport,
  // Bảng phụ thuộc Booking
  BookingReview,
  BookingHandover,
  BookingContract,
  BookingCancellation,
  BookingPayout,
  Transaction,
  TrafficFineRequest,
};

export default db;
