import express from "express";
import { getOwnerPublicProfile } from "../../controllers/renter/ownerPublicController.js";
import { softAuth } from "../../middlewares/softAuthMiddleware.js";

const router = express.Router();

router.get("/:ownerId", softAuth, getOwnerPublicProfile);

export default router;