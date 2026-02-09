import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getInventory,
  getLowStock,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("inventory.read"), getInventory);
router.get("/low-stock", userAuth, permissionMiddleware("inventory.read"), getLowStock);
router.post("/", userAuth, permissionMiddleware("inventory.create"), createInventoryItem);
router.put("/:id", userAuth, permissionMiddleware("inventory.update"), updateInventoryItem);
router.delete("/:id", userAuth, permissionMiddleware("inventory.delete"), deleteInventoryItem);

export default router;
