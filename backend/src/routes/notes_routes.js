import express from "express";
import {
    getAllNotes,
    createNotes,
    updatedNotes,
    deleteNotes,
    getNoteById,
} from "../controllers/noteController.js";

const router = express.Router();

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", createNotes);
router.put("/:id", updatedNotes);
router.delete("/:id", deleteNotes);


export default router;
