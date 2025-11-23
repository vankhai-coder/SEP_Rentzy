import express from "express";
import db from "../../models/index.js";

const router = express.Router();

// GET /api/renter/system-settings/cancellation-policy
router.get("/cancellation-policy", async (req, res) => {
  try {
    const codes = [
      "CANCEL_WITHIN_HOLD_1H",
      "CANCEL_BEFORE_7_DAYS",
      "CANCEL_WITHIN_7_DAYS",
    ];
    const items = await db.SystemSetting.findAll({
      where: { feeCode: codes },
      order: [["updated_at", "DESC"]],
      attributes: ["id", "feeCode", "name", "percent", "description", "updated_at"],
    });

    return res.status(200).json(items);
  } catch (error) {
    console.error("public cancellation-policy error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;