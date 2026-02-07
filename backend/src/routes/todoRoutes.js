import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
} from "../controllers/todoController.js";

const router = express.Router();

router.get("/", userAuth, getTodos);
router.post("/", userAuth, createTodo);
router.put("/:id", userAuth, updateTodo);
router.delete("/:id", userAuth, deleteTodo);
router.patch("/:id/toggle", userAuth, toggleTodo);

export default router;