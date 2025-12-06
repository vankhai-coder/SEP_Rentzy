import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  getTrafficFineRequests,
  getTrafficFineRequestStats,
  approveTrafficFineRequest,
  rejectTrafficFineRequest,
  transferTrafficFineToOwner,
  getTrafficFinePayouts,
  getAllTrafficFineRequests,
} from "../../controllers/admin/adminTrafficFineController.js";

const router = express.Router();

// Check JWT token for all admin traffic fine routes
router.use(verifyJWTToken);

// Check admin role for all admin traffic fine routes
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

// All routes below are protected and only accessible by admin users

// GET /api/admin/traffic-fine-requests/stats
router.get("/stats", getTrafficFineRequestStats);

// GET /api/admin/traffic-fine-requests
router.get("/", getTrafficFineRequests);

// GET /api/admin/traffic-fine-requests/all
router.get("/all", getAllTrafficFineRequests);


// PATCH /api/admin/traffic-fine-requests/:id/approve
router.patch("/:id/approve", approveTrafficFineRequest);

// PATCH /api/admin/traffic-fine-requests/:id/reject
router.patch("/:id/reject", rejectTrafficFineRequest);

// GET /api/admin/traffic-fine-requests/payouts
router.get("/payouts", getTrafficFinePayouts);

// PATCH /api/admin/traffic-fine-requests/bookings/:id/transfer
router.patch("/bookings/:id/transfer", transferTrafficFineToOwner);


export default router;
