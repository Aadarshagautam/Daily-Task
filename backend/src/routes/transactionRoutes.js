import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", userAuth, getTransactions);
router.get("/summary", userAuth, getSummary);
router.post("/", userAuth, createTransaction);
router.put("/:id", userAuth, updateTransaction);
router.delete("/:id", userAuth, deleteTransaction);

export default router;