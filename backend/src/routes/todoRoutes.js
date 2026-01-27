import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo
} from "../controllers/todoController.js";

const todoRouter = express.Router();

todoRouter.get("/", userAuth, getTodos);
todoRouter.post("/", userAuth, createTodo);
todoRouter.put("/:id", userAuth, updateTodo);
todoRouter.delete("/:id", userAuth, deleteTodo);
todoRouter.patch("/:id/toggle", userAuth, toggleTodo);

export default todoRouter;