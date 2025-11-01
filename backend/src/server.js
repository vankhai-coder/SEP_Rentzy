import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// import all models for sequelize to sync:
import db from "./models/index.js";

// import routes :
import AuthRoute from "./routes/auth/authRoute.js";
import RenterVehicleRoute from "./routes/renter/vehicleRoute.js";
import RenterBrandRoute from "./routes/renter/brandRoute.js";
import RenterFavoriteRoute from "./routes/renter/favoriteRoute.js";
import ChatOpenAiRoute from "./routes/chat/chatOpenAiRoute.js";
import SearchVehicleRoute from "./routes/renter/searchVehicleRoute.js";
import BookingReviewRoute from "./routes/renter/bookingReviewRoute.js";
import BookingHistoryRoute from "./routes/renter/bookingHistoryRoute.js";
import VehicleReportRoute from "./routes/renter/vehicleReportRoute.js";
import TransactionRoute from "./routes/renter/transactionRoute.js";
// booking route

import BookingRoute from "./routes/booking/bookingRoute.js";
import HandoverRoute from "./routes/booking/handoverRoute.js";

// voucher route
import VoucherRoute from "./routes/renter/voucherRoute.js";
import PointsRoute from "./routes/renter/pointsRoute.js";

import OwnerVehicleRoute from "./routes/owner/ownerVehicleRoute.js";
import OwnerBrandRoute from "./routes/owner/ownerBrandRoute.js";
import OwnerDashboardRoute from "./routes/owner/ownerDashboardRoute.js";
import OwnerOverviewRoute from "./routes/owner/ownerOverviewRoute.js";
import RenterInfoRoute from "./routes/renter/renterInformationRoute.js";

// admin routes
import AdminApprovalVehicleRoute from "./routes/admin/adminApprovalVehicleRoute.js";
import AdminManagementVehicleRoute from "./routes/admin/adminManagemnetVehicleRoute.js";

// payment
import PaymentRoute from "./routes/payment/paymentRoute.js";

// bank account
import BankAccountRoute from "./routes/bank/bankAccountRoute.js";

// admin
import AdminRoute from "./routes/admin/adminCancelRoute.js";
import AdminPayoutRoute from "./routes/admin/adminPayoutRoute.js";

// cron jobs
import { initializeCronJobs, stopCronJobs } from "./services/cronService.js";

// init app :
const app = express();

// middleware :
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// static files for uploads
app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// log request :
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ROUTE :

// auth route :
app.use("/api/auth", AuthRoute);
app.use("/api/renter/vehicles/search", SearchVehicleRoute);

// renter route :
app.use("/api/renter/vehicles", RenterVehicleRoute);
app.use("/api/renter/brands", RenterBrandRoute);
app.use("/api/renter/favorites", RenterFavoriteRoute);
app.use("/api/chat", ChatOpenAiRoute);
app.use("/api/renter/reviews", BookingReviewRoute);
app.use("/api/renter/booking-history", BookingHistoryRoute);
app.use("/api/renter/reports", VehicleReportRoute);
app.use("/api/renter/info", RenterInfoRoute);
app.use("/api/renter/transactions", TransactionRoute);
// booking route
app.use("/api/renter/booking", BookingRoute);

// handover route
app.use("/api/handover", HandoverRoute);

// owner route
app.use("/api/owner", OwnerVehicleRoute);
app.use("/api/owner/brands", OwnerBrandRoute);
app.use("/api/owner/dashboard", OwnerDashboardRoute);
app.use("/api/owner/overview", OwnerOverviewRoute);

// admin route
app.use("/api/admin/approval-vehicles", AdminApprovalVehicleRoute);
app.use("/api/admin/management-vehicles", AdminManagementVehicleRoute);

// voucher route
app.use("/api/renter/vouchers", VoucherRoute);

// points route
app.use("/api/renter/points", PointsRoute);

// payment route
app.use("/api/payment", PaymentRoute);

// bank account route
app.use("/api/bank-accounts", BankAccountRoute);

// admin route
app.use("/api/admin", AdminRoute);
app.use("/api/admin", AdminPayoutRoute);

app.get("/", (req, res) => {
  res.send("Hello, Sequelize + MySQL!");
});

// sync database models
(async () => {
  try {
    await db.sequelize.sync({});
    console.log("✅ All models synced!");

    // Initialize cron jobs after database sync
    initializeCronJobs();
  } catch (err) {
    console.error(" Error syncing models:", err);
  }
})();

// run server :
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  stopCronJobs();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  stopCronJobs();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
