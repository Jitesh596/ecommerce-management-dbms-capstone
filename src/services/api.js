import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach Authorization JWT token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fashionista_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fallback image for missing/broken product photos
export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

// Adapter: normalize backend MySQL product format to frontend expectations
export const adaptProduct = (item) => {
  if (!item) return null;
  const numPrice = Number(item.price) || 0;
  return {
    id: item.product_id,
    product_id: item.product_id,
    title: item.product_name,
    product_name: item.product_name,
    description: item.description || "Premium quality fashion wear.",
    category: item.category || "Fashion",
    price: numPrice,
    stock: typeof item.stock === "number" ? item.stock : Number(item.stock) || 0,
    image: item.image_url && item.image_url.trim() !== "" ? item.image_url : DEFAULT_PRODUCT_IMAGE,
    image_url: item.image_url && item.image_url.trim() !== "" ? item.image_url : DEFAULT_PRODUCT_IMAGE,
    seller_id: item.seller_id,
    seller_name: item.seller_name || `Seller #${item.seller_id}`,
    is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
    rating: {
      rate: (4.0 + ((item.product_id % 10) * 0.1)).toFixed(1),
      count: 24 + (item.product_id * 7)
    }
  };
};

// ==========================================
// PRODUCTS API
// ==========================================
export const getProducts = async (params = {}) => {
  try {
    const response = await apiClient.get("/products", { params });
    const list = Array.isArray(response.data) ? response.data : (response.data.products || []);
    return list.map(adaptProduct);
  } catch (error) {
    console.error("Error fetching products from MySQL API:", error.message);
    return [];
  }
};

export const getSingleProduct = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return adaptProduct(response.data);
  } catch (error) {
    console.error(`Error fetching product #${id}:`, error.message);
    return null;
  }
};

export const getCategories = async () => {
  try {
    const response = await apiClient.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    return [];
  }
};

// ==========================================
// AUTHENTICATION API
// ==========================================
export const registerUser = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/customers/me");
  return response.data;
};

export const updateMe = async (data) => {
  const response = await apiClient.put("/customers/me", data);
  return response.data;
};

// ==========================================
// ORDERS & CHECKOUT API
// ==========================================
export const placeOrder = async (orderPayload) => {
  const response = await apiClient.post("/orders/checkout", orderPayload);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await apiClient.get("/orders");
  return response.data;
};

export const getOrderDetail = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await apiClient.put(`/orders/${orderId}/cancel`);
  return response.data;
};

// ==========================================
// ADMIN & REPORTS API
// ==========================================
export const getAdminOverview = async () => {
  const response = await apiClient.get("/admin/overview");
  return response.data;
};

export const getAdminProducts = async () => {
  const response = await apiClient.get("/admin/products");
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await apiClient.post("/admin/products", productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/admin/products/${id}`, productData);
  return response.data;
};

export const getAdminSellers = async () => {
  const response = await apiClient.get("/admin/sellers");
  return response.data;
};

export const createSeller = async (sellerData) => {
  const response = await apiClient.post("/admin/sellers", sellerData);
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await apiClient.get("/admin/orders");
  return response.data;
};

export const updateOrderStatus = async (orderId, statusData) => {
  const response = await apiClient.put(`/admin/orders/${orderId}/status`, statusData);
  return response.data;
};

export const getReport = async (reportName) => {
  const response = await apiClient.get(`/reports/${reportName}`);
  return response.data;
};

export const getDbmsInsights = async () => {
  const response = await apiClient.get("/dbms-insights");
  return response.data;
};

export default apiClient;
