import express from "express";
import userAuth from "../middleware/userAuth.js";
import { 
  addNote, 
  getAllNotes, 
  updateNote, 
  deleteNote 
} from "../controllers/notesController.js";

const router = express.Router();

// Get all notes
router.get("/", userAuth, getAllNotes);

// Add new note
router.post("/", userAuth, addNote);

// Update note
router.put("/:id", userAuth, updateNote);

// Delete note
router.delete("/:id", userAuth, deleteNote);

export default router;