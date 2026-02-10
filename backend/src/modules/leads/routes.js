import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  updateStage,
  addNote,
  deleteLead,
} from "./controller.js";

const router = express.Router();

router.post("/", userAuth, permissionMiddleware("leads.create"), createLead);
router.get("/", userAuth, permissionMiddleware("leads.read"), getLeads);
router.get("/:id", userAuth, permissionMiddleware("leads.read"), getLead);
router.put("/:id", userAuth, permissionMiddleware("leads.update"), updateLead);
router.patch("/:id/stage", userAuth, permissionMiddleware("leads.update"), updateStage);
router.post("/:id/notes", userAuth, permissionMiddleware("leads.update"), addNote);
router.delete("/:id", userAuth, permissionMiddleware("leads.delete"), deleteLead);

export default router;
