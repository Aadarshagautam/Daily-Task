import express from "express";
import {
    getAllNotes,
    createNotes,
    updatedNotes,
    deleteNotes,
    getNoteById,
} from "../controllers/noteController.js";
import userAuth from "../middleware/userAuth.js";
const router = express.Router();

router.get("/",userAuth, getAllNotes);
router.get("/:id",userAuth, getNoteById);
router.post("/",userAuth, createNotes);
router.put("/:id",userAuth, updatedNotes);
router.delete("/:id",userAuth, deleteNotes);


export default router;
