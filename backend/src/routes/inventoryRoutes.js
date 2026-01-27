import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
    getInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getLowStock
} from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

inventoryRouter.get("/", userAuth, getInventory);
inventoryRouter.get("/low-stock", userAuth, getLowStock);
inventoryRouter.post("/", userAuth, createInventoryItem);
inventoryRouter.put("/:id", userAuth, updateInventoryItem);
inventoryRouter.delete("/:id", userAuth, deleteInventoryItem);

export default inventoryRouter;