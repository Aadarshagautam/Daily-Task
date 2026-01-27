import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary
} from "../controllers/transactionController.js";

const transactionRouter = express.Router();

transactionRouter.get("/", userAuth, getTransactions);
transactionRouter.get("/summary", userAuth, getSummary);
transactionRouter.post("/", userAuth, createTransaction);
transactionRouter.put("/:id", userAuth, updateTransaction);
transactionRouter.delete("/:id", userAuth, deleteTransaction);

export default transactionRouter;