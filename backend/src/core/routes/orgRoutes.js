import express from "express";
import userAuth from "../middleware/userAuth.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import {
  getOrganization,
  updateOrganization,
  getMembers,
  updateMemberRole,
} from "../controllers/orgController.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("settings.read"), getOrganization);
router.put("/", userAuth, permissionMiddleware("settings.update"), updateOrganization);
router.get("/members", userAuth, permissionMiddleware("users.read"), getMembers);
router.patch("/members/:memberId/role", userAuth, permissionMiddleware("users.update"), updateMemberRole);

export default router;
