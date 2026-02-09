import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("customers.read"), getCustomers);
router.get("/search", userAuth, permissionMiddleware("customers.read"), searchCustomers);
router.get("/:id", userAuth, permissionMiddleware("customers.read"), getCustomer);
router.post("/", userAuth, permissionMiddleware("customers.create"), createCustomer);
router.put("/:id", userAuth, permissionMiddleware("customers.update"), updateCustomer);
router.delete("/:id", userAuth, permissionMiddleware("customers.delete"), deleteCustomer);

export default router;
