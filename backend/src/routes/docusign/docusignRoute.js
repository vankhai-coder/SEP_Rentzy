import express from "express";
import docusignController from "../../controllers/docusign/docusignController.js";

const router = express.Router();

router.use("/", docusignController);

export default router;