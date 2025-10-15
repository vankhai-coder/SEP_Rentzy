import express from "express";
const BookingRoute = express.Router();

import { getVehicleBookedDates, createBooking } from "../../controllers/booking/bookingController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

BookingRoute.get("/getDate/:vehicleId", getVehicleBookedDates);
BookingRoute.post("/", verifyJWTToken, createBooking);

export default BookingRoute;
