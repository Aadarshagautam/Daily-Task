import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  addNote,
  getAllNotes,
  updateNote,
  deleteNote
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("notes.read"), getAllNotes);
router.post("/", userAuth, permissionMiddleware("notes.create"), addNote);
router.put("/:id", userAuth, permissionMiddleware("notes.update"), updateNote);
router.delete("/:id", userAuth, permissionMiddleware("notes.delete"), deleteNote);

export default router;
