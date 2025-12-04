import express from "express";
import {
    getAllNotes,
    createAllNotes,
    updateAllNotes,
    deleteAllNotes,
} from "../controllers/nodeController.js";

const router = express.Router();

router.get("/", getAllNotes);

router.post("/", createAllNotes);

router.put("/:id", updateAllNotes);

router.delete("/:id", deleteAllNotes);

export default router;
