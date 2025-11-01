import express from "express";
const BookingRoute = express.Router();

import {
  getVehicleBookedDates,
  createBooking,
  getBookingById,
  deleteBooking,
  triggerAutoCancelExpiredBookings,
} from "../../controllers/booking/bookingController.js";
import {
  calculateCancellationFee,
  confirmCancellation,
} from "../../controllers/booking/bookingCancelController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { checkVerificationForBooking } from "../../middlewares/verificationMiddleware.js";
import { requireBankAccount } from "../../middlewares/bankAccountMiddleware.js";

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
BookingRoute.post(
  "/admin/auto-cancel-expired",
  triggerAutoCancelExpiredBookings
);

// Cancellation routes
BookingRoute.get(
  "/:bookingId/cancellation-fee",
  verifyJWTToken,
  calculateCancellationFee
);
BookingRoute.post(
  "/:bookingId/cancel",
  verifyJWTToken,
  requireBankAccount,
  confirmCancellation
);

export default BookingRoute;
