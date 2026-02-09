import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("todos.read"), getTodos);
router.post("/", userAuth, permissionMiddleware("todos.create"), createTodo);
router.put("/:id", userAuth, permissionMiddleware("todos.update"), updateTodo);
router.delete("/:id", userAuth, permissionMiddleware("todos.delete"), deleteTodo);
router.patch("/:id/toggle", userAuth, permissionMiddleware("todos.update"), toggleTodo);

export default router;
