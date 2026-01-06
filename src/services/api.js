import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// SKU Services
export const skuService = {
  importSkus: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/import/skus", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAllSkus: () => api.get("/skus"),
  getSkuByNumber: (skuNumber) => api.get(`/skus/${skuNumber}`),
};

// QR Code Services
export const qrService = {
  importQrCodes: (lastGetTime) => api.post("/import/qr-codes", { lastGetTime }),
  getStatistics: () => api.get("/qr-codes/statistics"),
  getByUpc: (upc) => api.get(`/qr-codes/by-upc/${upc}`),
  getAllQrCodes: (params) => api.get("/qr-codes", { params }),
};

// Purchase Order Services
export const poService = {
  importPurchaseOrder: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/import/purchase-orders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAllPurchaseOrders: () => api.get("/purchase-orders"),
  getPoByNumber: (poNumber) => api.get(`/purchase-orders/${poNumber}`),
};

// Carton Services
export const cartonService = {
  getCartonesByPo: (poNumber, estado) => {
    const params = estado ? { estado } : {};
    return api.get(`/cartones/by-po/${poNumber}`, { params });
  },
  getCartonById: (cartonId) => api.get(`/cartones/${cartonId}`),
  startScan: (cartonId) => api.post(`/cartones/${cartonId}/start-scan`),
  scanQr: (cartonId, codigoQr) =>
    api.post("/cartones/scan-qr", { cartonId, codigoQr }),
  getProgress: (cartonId) => api.get(`/cartones/${cartonId}/progress`),
  getHistory: (cartonId) => api.get(`/cartones/${cartonId}/history`),
  getStatistics: () => api.get("/cartones/statistics"),
};

// Trysor/T4 Services
export const trysorService = {
  validatePo: (poNumber) => api.get(`/trysor/validate/${poNumber}`),
  getPreview: (poNumber) => api.get(`/trysor/preview/${poNumber}`),
  sendPo: (poNumber) => api.post(`/trysor/send/${poNumber}`),
  cancelPo: (poNumber) => api.post(`/trysor/cancel/${poNumber}`),
  getHistory: (params) => api.get("/envios-trysor", { params }),
  getEnvioDetail: (id) => api.get(`/envios-trysor/${id}`),
};

// Caja Services (Producción)
export const cajaService = {
  startPacking: (codigoCaja) =>
    api.post("/cajas/start-packing", { codigoCaja }),
  scanQr: (cajaId, codigoQr) =>
    api.post("/cajas/scan-qr", { cajaId, codigoQr }),
  getProgress: (cajaId) => api.get(`/cajas/${cajaId}/progress`),
  completeCaja: (cajaId) => api.put(`/cajas/${cajaId}/complete`),
  getCajasEmpacadas: (sku) => api.get("/cajas/empacadas", { params: { sku } }),
  getCajaById: (cajaId) => api.get(`/cajas/${cajaId}`),
  getStatistics: () => api.get("/cajas/statistics"),
  getCajasByPo: (poNumber) => api.get(`/cajas/by-po/${poNumber}`),
};

// Embarque Services
export const embarqueService = {
  assignBoxToCarton: (codigoCaja, cartonId) =>
    api.post("/embarque/assign-box-to-carton", { codigoCaja, cartonId }),
  getCartonesPendientes: (poNumber) =>
    api.get(`/embarque/cartones-pendientes/${poNumber}`),
  getCartonesByPo: (poNumber) => api.get(`/embarque/cartones/${poNumber}`),
};

export default api;
