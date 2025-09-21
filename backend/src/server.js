import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// import all models for sequelize to sync:
import db from "./models/index.js";

// import routes :
import AuthRoute from "./routes/auth/authRoute.js";
import RenterVehicleRoute from "./routes/renter/vehicleRoute.js";
import RenterBrandRoute from "./routes/renter/brandRoute.js";
import RenterFavoriteRoute from "./routes/renter/favoriteRoute.js";
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
app.use("/api/renter/vehicles", RenterVehicleRoute);
app.use("/api/renter/brands", RenterBrandRoute);
app.use("/api/renter/favorites", RenterFavoriteRoute);
app.get("/", (req, res) => {
  res.send("Hello, Sequelize + MySQL!");
});

// sync database models
(async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log("✅ All models synced!");
  } catch (err) {
    console.error("❌ Error syncing models:", err);
  }
})();

// run server :
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
