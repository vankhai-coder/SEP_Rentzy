// Set SSL config trước khi import bất kỳ module nào
// Điều này cần thiết để tránh lỗi SSL handshake với csgt.vn
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
import CompareVehicleRoute from "./routes/renter/compareVehicleRoute.js";
import DocusignRoute from "./routes/docusign/docusignRoute.js";
import RecommendationRoute from "./routes/renter/recommendationRoute.js";
// booking route

import BookingRoute from "./routes/booking/bookingRoute.js";
import HandoverRoute from "./routes/booking/handoverRoute.js";

// voucher route
import VoucherRoute from "./routes/renter/voucherRoute.js";
import PointsRoute from "./routes/renter/pointsRoute.js";
// owner routes
import AiRoute from "./routes/ai/aiRoutes.js";
import OwnerVehicleRoute from "./routes/owner/ownerVehicleRoute.js";
import OwnerBrandRoute from "./routes/owner/ownerBrandRoute.js";
import OwnerDashboardRoute from "./routes/owner/ownerDashboardRoute.js";
import OwnerOverviewRoute from "./routes/owner/ownerOverviewRoute.js";
import RenterInfoRoute from "./routes/renter/renterInformationRoute.js";
import RenterSystemSettingRoute from "./routes/renter/systemSettingPublicRoute.js";
import RenterNotificationRoute from "./routes/renter/notificationRoute.js";
import TrafficFineRoute from "./routes/renter/trafficFineRoute.js";
import OwnerPublicRoute from "./routes/renter/ownerPublicRoute.js";

// admin routes
import AdminApprovalVehicleRoute from "./routes/admin/adminApprovalVehicleRoute.js";
import AdminManagementVehicleRoute from "./routes/admin/adminManagemnetVehicleRoute.js";
import AdminOverviewRoute from "./routes/admin/adminOverviewRoute.js";
import AdminUserManagementRoute from "./routes/admin/adminUserManagementRoute.js";
import AdminApproveOwnerRoute from "./routes/admin/adminApproveOwnerRoute.js";
import AdminUserChartRoute from "./routes/admin/adminUserChartRoute.js";
import AdminRevenueRoute from "./routes/admin/adminRevenueRoute.js";
import AdminBrandRoute from "./routes/admin/adminBrandRoute.js";
import AdminChatMessage from './routes/admin/adminChatMessageRoute.js'

// payment
import PaymentRoute from "./routes/payment/paymentRoute.js";

// bank account
import BankAccountRoute from "./routes/bank/bankAccountRoute.js";

// admin
import AdminRoute from "./routes/admin/adminCancelRoute.js";
import AdminPayoutRoute from "./routes/admin/adminPayoutRoute.js";
import AdminVoucherRoute from "./routes/admin/adminVoucherRoute.js";
import AdminTrafficFineRoute from "./routes/admin/adminTrafficFineRoute.js";
import AdminSystemSettingRoute from "./routes/admin/adminSystemSettingRoute.js";
import AdminNotificationRoute from "./routes/admin/adminNotificationRoute.js";

// cron jobs
import { initializeCronJobs, stopCronJobs } from "./services/cronService.js";
import { setupWebSocket } from "./services/wsService.js";

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
app.use("/api/renter/vehicles", CompareVehicleRoute);
app.use("/api/renter/brands", RenterBrandRoute);
app.use("/api/renter/favorites", RenterFavoriteRoute);
app.use("/api/chat", ChatOpenAiRoute);
app.use("/api/renter/reviews", BookingReviewRoute);
app.use("/api/renter/booking-history", BookingHistoryRoute);
app.use("/api/renter/reports", VehicleReportRoute);
app.use("/api/renter/info", RenterInfoRoute);
app.use("/api/renter/system-settings", RenterSystemSettingRoute);
app.use("/api/renter/transactions", TransactionRoute);
app.use("/api/renter", RecommendationRoute);
app.use("/api/renter/notifications", RenterNotificationRoute);
app.use("/api/renter/owner-public", OwnerPublicRoute);
// traffic fine search route (cho cả renter và owner)
app.use("/api/traffic-fine-search", TrafficFineRoute);
// booking route
app.use("/api/renter/booking", BookingRoute);

// handover route
app.use("/api/handover", HandoverRoute);

// owner route
app.use("/api/owner", OwnerVehicleRoute);
app.use("/api/owner/brands", OwnerBrandRoute);
app.use("/api/owner/dashboard", OwnerDashboardRoute);
app.use("/api/owner/overview", OwnerOverviewRoute);
app.use("/api/ai", AiRoute);

// admin route
app.use("/api/admin/approval-vehicles", AdminApprovalVehicleRoute);
app.use("/api/admin/management-vehicles", AdminManagementVehicleRoute);
app.use("/api/admin", AdminRoute);
app.use("/api/admin", AdminPayoutRoute);
// admin - Van Khai :
app.use("/api/admin/overview", AdminOverviewRoute);
app.use("/api/admin/user-management", AdminUserManagementRoute);
app.use("/api/admin/owner-approval", AdminApproveOwnerRoute);
app.use("/api/admin/owner-approval", AdminApproveOwnerRoute);
app.use("/api/admin/voucher-management", AdminVoucherRoute);
app.use("/api/admin/traffic-fine-requests", AdminTrafficFineRoute);
app.use("/api/admin/system-settings", AdminSystemSettingRoute);
app.use("/api/admin/user-chart", AdminUserChartRoute);
app.use("/api/admin/revenue", AdminRevenueRoute);
app.use("/api/admin/brands", AdminBrandRoute);
app.use("/api/admin/notifications", AdminNotificationRoute);
app.use("/api/admin/messages", AdminChatMessage);

// voucher route
app.use("/api/renter/vouchers", VoucherRoute);

// points route
app.use("/api/renter/points", PointsRoute);

// payment route
app.use("/api/payment", PaymentRoute);

// bank account route
app.use("/api/bank-accounts", BankAccountRoute);

app.use("/api/docusign", DocusignRoute);

// test route
app.get("/", (req, res) => {
  res.send("Hello, Sequelize + MySQL!");
});

// sync database models
(async () => {
  try {
    // Use alter: false to avoid "Too many keys" error
    // Only use alter: true when you need to modify table structure
    // For production, use migrations instead of sync with alter
    await db.sequelize.sync({alter: false});
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
setupWebSocket(server);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(" SIGTERM received, shutting down gracefully...");
  stopCronJobs();
  server.close(() => {
    console.log(" Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  stopCronJobs();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});


