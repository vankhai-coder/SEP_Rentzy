import express from "express";
import { oauthLogin, oauthCallback, requireToken, sendContract, signRecipientView, getStatus, getCombinedDocuments, contractTemplate, bookingSend, webhook } from "../../controllers/docusign/docusignController.js";
import { verifyJWTToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Explicit routing to controller handlers
router.get("/oauth/login", oauthLogin);
router.get("/oauth/callback", oauthCallback);
router.post("/send-contract", verifyJWTToken, requireToken, sendContract);
router.get("/sign/:envelopeId", verifyJWTToken, requireToken, signRecipientView);
router.get("/status/:id", verifyJWTToken, requireToken, getStatus);
router.get("/documents/:id/combined", verifyJWTToken, requireToken, getCombinedDocuments);
router.get("/contract-template/:bookingId", verifyJWTToken, contractTemplate);
router.post("/booking/:bookingId/send", verifyJWTToken, requireToken, bookingSend);
router.post("/webhook", webhook);

export default router;
