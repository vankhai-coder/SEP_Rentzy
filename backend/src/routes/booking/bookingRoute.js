import express from "express";
const BookingRoute = express.Router();

import { getVehicleBookedDates } from "../../controllers/booking/bookingController.js";

BookingRoute.get("/:vehicleId", getVehicleBookedDates);
export default BookingRoute;
