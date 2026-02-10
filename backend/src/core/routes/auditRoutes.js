import express from "express";
import userAuth from "../middleware/userAuth.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("settings.read"), getAuditLogs);

export default router;
