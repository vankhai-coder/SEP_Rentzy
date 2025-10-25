import express from "express";
const BookingRoute = express.Router();

import {
  getVehicleBookedDates,
  createBooking,
  getBookingById,
  deleteBooking,
  triggerAutoCancelExpiredBookings,
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
BookingRoute.delete("/:bookingId", verifyJWTToken, deleteBooking);

// Manual trigger for auto-cancel 
BookingRoute.post("/admin/auto-cancel-expired", triggerAutoCancelExpiredBookings);

export default BookingRoute;
