import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getInventory,
  getLowStock,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", userAuth, getInventory);
router.get("/low-stock", userAuth, getLowStock);
router.post("/", userAuth, createInventoryItem);
router.put("/:id", userAuth, updateInventoryItem);
router.delete("/:id", userAuth, deleteInventoryItem);

export default router;