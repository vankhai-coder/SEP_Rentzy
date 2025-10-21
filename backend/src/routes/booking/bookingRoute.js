import express from "express";
const BookingRoute = express.Router();

import {
  getVehicleBookedDates,
  createBooking,
  getBookingById,
} from "../../controllers/booking/bookingController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { checkVerificationForBooking } from "../../middlewares/verificationMiddleware.js";

BookingRoute.get("/getDate/:vehicleId", getVehicleBookedDates);
BookingRoute.get("/:bookingId", verifyJWTToken, getBookingById);
BookingRoute.post(
  "/createBooking",
  verifyJWTToken,
  checkVerificationForBooking,
  createBooking
);

export default BookingRoute;
