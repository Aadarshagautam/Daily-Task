import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";

import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getCategories,
} from "./controllers/productController.js";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "./controllers/customerController.js";

import {
  createSale,
  getSales,
  getSale,
  refundSale,
  getSaleStats,
} from "./controllers/saleController.js";

import {
  validate,
  createProductSchema,
  updateProductSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createSaleSchema,
} from "./validation.js";

const router = express.Router();

// ─── Products ───
router.get(
  "/products",
  userAuth,
  permissionMiddleware("pos.read"),
  getProducts
);
router.get(
  "/products/low-stock",
  userAuth,
  permissionMiddleware("pos.read"),
  getLowStock
);
router.get(
  "/products/categories",
  userAuth,
  permissionMiddleware("pos.read"),
  getCategories
);
router.get(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getProduct
);
router.post(
  "/products",
  userAuth,
  permissionMiddleware("pos.create"),
  validate(createProductSchema),
  createProduct
);
router.patch(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.update"),
  validate(updateProductSchema),
  updateProduct
);
router.delete(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.delete"),
  deleteProduct
);

// ─── Customers ───
router.get(
  "/customers",
  userAuth,
  permissionMiddleware("pos.read"),
  getCustomers
);
router.get(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getCustomer
);
router.post(
  "/customers",
  userAuth,
  permissionMiddleware("pos.create"),
  validate(createCustomerSchema),
  createCustomer
);
router.patch(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.update"),
  validate(updateCustomerSchema),
  updateCustomer
);
router.delete(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.delete"),
  deleteCustomer
);

// ─── Sales ───
router.get(
  "/sales",
  userAuth,
  permissionMiddleware("pos.read"),
  getSales
);
router.get(
  "/sales/stats",
  userAuth,
  permissionMiddleware("pos.read"),
  getSaleStats
);
router.get(
  "/sales/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getSale
);
router.post(
  "/sales",
  userAuth,
  permissionMiddleware("pos.create"),
  validate(createSaleSchema),
  createSale
);
router.post(
  "/sales/:id/refund",
  userAuth,
  permissionMiddleware("pos.delete"),
  refundSale
);

export default router;
