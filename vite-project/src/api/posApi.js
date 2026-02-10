import api from "../Pages/lib/axios";

// ─── Products ───
export const posProductApi = {
  list: (params) => api.get("/pos/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/products", data).then((r) => r.data),
  update: (id, data) => api.patch(`/pos/products/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pos/products/${id}`).then((r) => r.data),
  lowStock: () => api.get("/pos/products/low-stock").then((r) => r.data),
  categories: () => api.get("/pos/products/categories").then((r) => r.data),
};

// ─── Customers ───
export const posCustomerApi = {
  list: (params) => api.get("/pos/customers", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/customers/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/customers", data).then((r) => r.data),
  update: (id, data) => api.patch(`/pos/customers/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pos/customers/${id}`).then((r) => r.data),
};

// ─── Sales ───
export const posSaleApi = {
  list: (params) => api.get("/pos/sales", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/sales/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/sales", data).then((r) => r.data),
  refund: (id) => api.post(`/pos/sales/${id}/refund`).then((r) => r.data),
  stats: () => api.get("/pos/sales/stats").then((r) => r.data),
};
