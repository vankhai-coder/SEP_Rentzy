import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import {
  listSystemSettings,
  createSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
} from "../../controllers/admin/adminSystemSettingController.js";

const router = express.Router();

// Protect all routes with JWT and admin role
router.use(verifyJWTToken);
router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

// GET /api/admin/system-settings
router.get("/", listSystemSettings);

// POST /api/admin/system-settings
router.post("/", createSystemSetting);

// PUT /api/admin/system-settings/:id
router.put("/:id", updateSystemSetting);

// DELETE /api/admin/system-settings/:id
router.delete("/:id", deleteSystemSetting);

export default router;