import express from "express";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";
import { getConversationWithPartner, getLatestMessagesForUser, sendMessageToPartner } from "../../controllers/admin/adminChatMessageController.js";


const router = express.Router();

router.use(verifyJWTToken);

// GET all chat messages for specific user by userId : 
router.get("/", getLatestMessagesForUser);

// GEt conversation with partner
router.get("/conversation/:partnerId", getConversationWithPartner);

// POST send message to partner
router.post("/send", sendMessageToPartner);


export default router;
