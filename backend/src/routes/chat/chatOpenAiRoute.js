import express from "express";
import { chatWithOpenAi } from "../../controllers/chat/chatOpenAiController.js";

const router = express.Router();

// POST /api/chat/openai
router.post("/openai", chatWithOpenAi);

export default router;
