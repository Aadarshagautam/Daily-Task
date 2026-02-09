import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  moveLeadStage,
  convertToCustomer,
  getLeadStats,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("crm.read"), getLeads);
router.get("/stats", userAuth, permissionMiddleware("crm.read"), getLeadStats);
router.get("/:id", userAuth, permissionMiddleware("crm.read"), getLead);
router.post("/", userAuth, permissionMiddleware("crm.create"), createLead);
router.put("/:id", userAuth, permissionMiddleware("crm.update"), updateLead);
router.patch("/:id/stage", userAuth, permissionMiddleware("crm.update"), moveLeadStage);
router.post("/:id/convert", userAuth, permissionMiddleware("crm.create"), convertToCustomer);
router.delete("/:id", userAuth, permissionMiddleware("crm.delete"), deleteLead);

export default router;
