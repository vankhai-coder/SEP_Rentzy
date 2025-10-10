import express from "express";
const router = express.Router();

import { getVehicleBookedDates } from "../../controllers/booking/bookingController.js";
router.get("/:vehicleId", getVehicleBookedDates);
export default router;
