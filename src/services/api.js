import axios from "axios";

// Primary API client configured for MySQL backend through Vite proxy (/api)
// or directly to port 5000
const API_BASE = "/api";

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach JWT Bearer token to all outgoing database API requests
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

// Normalization helper: Ensures seamless dual-compatibility with both
// database schema column names (product_id, product_name, image_url)
// and UI component properties (id, title, image)
const formatProduct = (p) => {
    if (!p) return null;
    const priceNum = Number(p.price || 0);
    const rateNum = typeof p.rating === "object" ? Number(p.rating?.rate || 4.5) : Number(p.rating || 4.5);
    const countNum = typeof p.rating === "object" ? Number(p.rating?.count || 0) : Number(p.rating_count || 0);

    return {
        ...p,
        // Dual-support identifiers
        id: p.product_id || p.id,
        product_id: p.product_id || p.id,
        // Dual-support titles
        title: p.product_name || p.title || "Fashion Item",
        product_name: p.product_name || p.title || "Fashion Item",
        // Pricing & Discounts
        price: priceNum,
        discount_price: p.discount_price !== undefined && p.discount_price !== null 
            ? Number(p.discount_price) 
            : null,
        description: p.description || "",
        category: p.category || "Fashion",
        category_id: p.category_id || null,
        // Dual-support images
        image: p.image_url || p.image,
        image_url: p.image_url || p.image,
        // Ratings
        rating: rateNum,
        rating_count: countNum,
        // Inventory & styling attributes from MySQL
        brand: p.brand || "Fashionista",
        stock: p.stock !== undefined ? Number(p.stock) : 0,
        sizes: p.sizes || "S, M, L, XL",
        colors: p.colors || "Black, White, Navy",
        is_active: p.is_active !== undefined ? p.is_active : 1,
        is_featured: p.is_featured !== undefined ? p.is_featured : 0,
        is_trending: p.is_trending !== undefined ? p.is_trending : 0,
        is_new_arrival: p.is_new_arrival !== undefined ? p.is_new_arrival : 0,
        seller_name: p.seller_name || "Fashionista Retail",
        reviews: p.reviews || [],
        related: (p.related || []).map(r => ({
            ...r,
            id: r.product_id || r.id,
            title: r.product_name || r.title,
            image: r.image_url || r.image
        }))
    };
};

/* ==================== PRODUCTS API (MYSQL-DRIVEN) ==================== */

// Get all products from MySQL with database filtering, searching, and sorting
export const getProducts = async (params = {}) => {
    try {
        const response = await apiClient.get("/products", { params });
        const data = response.data;
        return Array.isArray(data) ? data.map(formatProduct) : [];
    } catch (error) {
        console.error("Error fetching products from MySQL backend:", error);
        return [];
    }
};

// Get single product by ID from MySQL with reviews and category-related products
export const getSingleProduct = async (id) => {
    try {
        const response = await apiClient.get(`/products/${id}`);
        return response.data ? formatProduct(response.data) : null;
    } catch (error) {
        console.error("Error fetching product details from MySQL:", error);
        return null;
    }
};

// Create product in MySQL (Admin)
export const createProduct = async (productData) => {
    const response = await apiClient.post("/products", productData);
    return formatProduct(response.data.product || response.data);
};

// Update product in MySQL (Admin)
export const updateProduct = async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return formatProduct(response.data.product || response.data);
};

// Delete product from MySQL (Admin - Soft or Permanent Delete)
export const deleteProduct = async (id, permanent = false) => {
    const response = await apiClient.delete(`/products/${id}`, {
        params: { permanent: permanent ? "true" : "false" }
    });
    return response.data;
};

/* ==================== CATEGORIES API (MYSQL-DRIVEN) ==================== */

// Get categories with product counts calculated via SQL JOIN & GROUP BY
export const getCategories = async () => {
    try {
        const response = await apiClient.get("/categories");
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    } catch (e) {
        console.error("Error fetching categories from MySQL:", e);
        return [];
    }
};

// Create category in MySQL (Admin)
export const createCategory = async (categoryData) => {
    const response = await apiClient.post("/categories", categoryData);
    return response.data;
};

// Update category in MySQL (Admin)
export const updateCategory = async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
};

// Delete category from MySQL (Admin)
export const deleteCategory = async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
};

/* ==================== AUTH & PROFILE API (MYSQL-DRIVEN) ==================== */

// Customer / Admin login with MySQL password verification & JWT issue
export const loginApi = async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
};

// Customer registration with MySQL insertion & bcrypt password hashing
export const registerApi = async (userData) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
};

// Get authenticated user profile from MySQL
export const getMeApi = async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
};

// Update profile in MySQL
export const updateProfileApi = async (profileData) => {
    const response = await apiClient.put("/auth/profile", profileData);
    return response.data;
};

// Logout
export const logoutApi = async () => {
    try {
        const response = await apiClient.post("/auth/logout");
        return response.data;
    } catch (e) {
        return { message: "Logged out." };
    }
};

/* ==================== CART API (MYSQL-DRIVEN) ==================== */

// Get customer cart from MySQL with calculated subtotals and product joins
export const getCart = async () => {
    try {
        const response = await apiClient.get("/cart");
        return response.data;
    } catch (error) {
        console.error("Error fetching cart from MySQL:", error);
        return { items: [], item_count: 0, subtotal: 0 };
    }
};

// Add item to cart in MySQL
export const addToCartApi = async (cartItemData) => {
    const response = await apiClient.post("/cart", cartItemData);
    return response.data;
};

// Update cart item quantity in MySQL
export const updateCartItemApi = async (cartItemId, quantity) => {
    const response = await apiClient.put(`/cart/${cartItemId}`, { quantity });
    return response.data;
};

// Remove cart item from MySQL
export const removeCartItemApi = async (cartItemId) => {
    const response = await apiClient.delete(`/cart/${cartItemId}`);
    return response.data;
};

// Clear entire cart in MySQL
export const clearCartApi = async () => {
    const response = await apiClient.delete("/cart");
    return response.data;
};

/* ==================== WISHLIST API (MYSQL-DRIVEN) ==================== */

// Get customer wishlist from MySQL
export const getWishlist = async () => {
    try {
        const response = await apiClient.get("/wishlist");
        return Array.isArray(response.data) ? response.data.map(formatProduct) : [];
    } catch (error) {
        console.error("Error fetching wishlist from MySQL:", error);
        return [];
    }
};

// Add product to wishlist in MySQL
export const addToWishlistApi = async (productId) => {
    const response = await apiClient.post("/wishlist", { product_id: productId });
    return response.data;
};

// Remove product from wishlist in MySQL
export const removeFromWishlistApi = async (productId) => {
    const response = await apiClient.delete(`/wishlist/${productId}`);
    return response.data;
};

/* ==================== ORDERS API (ACID TRANSACTIONS IN MYSQL) ==================== */

// Get orders list from MySQL (uses Database View: vw_order_summary)
export const getOrders = async () => {
    try {
        const response = await apiClient.get("/orders");
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error fetching orders from MySQL:", error);
        return [];
    }
};

// Get single order with line items from MySQL
export const getOrderById = async (orderId) => {
    try {
        const response = await apiClient.get(`/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching order details from MySQL:", error);
        return null;
    }
};

// Place order executing an ACID Transaction with row-level locks and MySQL Triggers
export const createOrder = async (orderPayload) => {
    const response = await apiClient.post("/orders", orderPayload);
    return response.data;
};

// Update order status in MySQL (Admin)
export const updateOrderStatus = async (orderId, statusData) => {
    const response = await apiClient.put(`/orders/${orderId}/status`, statusData);
    return response.data;
};

// Call MySQL Stored Procedure for customer order history: sp_GetCustomerOrderHistory
export const getCustomerOrderHistoryProcedure = async () => {
    const response = await apiClient.get("/orders/procedure/history");
    return response.data;
};

/* ==================== REVIEWS API (TRIGGER-DRIVEN MYSQL) ==================== */

// Submit product review (activates MySQL Trigger trg_after_review_insert)
export const submitReview = async (productId, reviewData) => {
    const response = await apiClient.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
};

/* ==================== REPORTS API (ADMIN - MYSQL VIEWS & AGGREGATES) ==================== */

// Get executive dashboard stats queried from MySQL Database Views
export const getDashboardReport = async () => {
    try {
        const response = await apiClient.get("/reports/dashboard");
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard reports from MySQL:", error);
        return null;
    }
};

// Get sales analytics with monthly breakdown from MySQL
export const getSalesReport = async () => {
    const response = await apiClient.get("/reports/sales");
    return response.data;
};

// Get product inventory & low stock reports from View vw_low_stock_alerts
export const getProductsReport = async () => {
    const response = await apiClient.get("/reports/products");
    return response.data;
};

// Get customer analytics from View vw_customer_order_stats
export const getCustomersReport = async () => {
    const response = await apiClient.get("/reports/customers");
    return response.data;
};

// Get automated inventory audit log from MySQL
export const getAuditLogReport = async () => {
    const response = await apiClient.get("/reports/audit-log");
    return response.data;
};

export default {
    getProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loginApi,
    registerApi,
    getMeApi,
    updateProfileApi,
    logoutApi,
    getCart,
    addToCartApi,
    updateCartItemApi,
    removeCartItemApi,
    clearCartApi,
    getWishlist,
    addToWishlistApi,
    removeFromWishlistApi,
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    getCustomerOrderHistoryProcedure,
    submitReview,
    getDashboardReport,
    getSalesReport,
    getProductsReport,
    getCustomersReport,
    getAuditLogReport
};
