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
// booking route
import BookingRoute from "./routes/booking/bookingRoute.js";

import OwnerVehicleRoute from "./routes/owner/ownerVehicleRoute.js";
import RenterInfoRoute from "./routes/renter/renterInformationRoute.js";

// init app :
const app = express();

// middleware :
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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
// booking route
app.use("/api/renter/booking", BookingRoute);

app.use("/api/owner", OwnerVehicleRoute);
app.use("/api/renter/info", RenterInfoRoute);

app.get("/", (req, res) => {
  res.send("Hello, Sequelize + MySQL!");
});

// sync database models
(async () => {
  try {
    await db.sequelize.sync({  });
    console.log("✅ All models synced!");
  } catch (err) {
    console.error("❌ Error syncing models:", err);
  }
})();

// run server :
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
