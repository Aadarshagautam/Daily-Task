import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", userAuth, getCustomers);
router.get("/search", userAuth, searchCustomers);
router.get("/:id", userAuth, getCustomer);
router.post("/", userAuth, createCustomer);
router.put("/:id", userAuth, updateCustomer);
router.delete("/:id", userAuth, deleteCustomer);

export default router;
