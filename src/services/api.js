import axios from "axios";

const API_URL = "https://fakestoreapi.com/products";

// Helper to normalize FakeStoreAPI products so they seamlessly support both
// FakeStore properties (id, title, image) and UI properties (product_id, product_name, image_url)
const formatProduct = (p) => {
    if (!p) return null;
    const priceNum = Number(p.price || 0);
    const rateNum = typeof p.rating === "object" ? Number(p.rating?.rate || 4.5) : Number(p.rating || 4.5);
    const countNum = typeof p.rating === "object" ? Number(p.rating?.count || 24) : Number(p.rating_count || 24);

    return {
        ...p,
        // Dual-support identifiers
        id: p.id || p.product_id,
        product_id: p.product_id || p.id,
        // Dual-support titles
        title: p.title || p.product_name || "Fashion Item",
        product_name: p.product_name || p.title || "Fashion Item",
        // Pricing & Discounts
        price: priceNum,
        discount_price: p.discount_price !== undefined ? Number(p.discount_price) : Math.round(priceNum * 0.85),
        description: p.description || "",
        category: p.category || "Fashion",
        // Dual-support images
        image: p.image || p.image_url,
        image_url: p.image_url || p.image,
        // Ratings
        rating: rateNum,
        rating_count: countNum,
        // Inventory & styling attributes
        brand: p.brand || "Fashionista",
        stock: p.stock !== undefined ? Number(p.stock) : 25,
        sizes: p.sizes || "S, M, L, XL",
        colors: p.colors || "Black, White, Navy",
        is_featured: p.is_featured !== undefined ? p.is_featured : 1,
        is_trending: p.is_trending !== undefined ? p.is_trending : (p.id % 2 === 0 ? 1 : 0),
        is_new_arrival: p.is_new_arrival !== undefined ? p.is_new_arrival : (p.id % 3 === 0 ? 1 : 0),
        reviews: p.reviews || [
            { review_id: 1, customer_name: "Sophia M.", rating: 5, comment: "Exceptional quality, fits perfectly and arrived quickly!", created_at: "2026-04-10" },
            { review_id: 2, customer_name: "Ethan K.", rating: 4, comment: "Very comfortable material, looks great.", created_at: "2026-04-14" }
        ],
        related: p.related || []
    };
};

// Get all products
export const getProducts = async (params = {}) => {
    try {
        const response = await axios.get(API_URL);
        const data = response.data;
        return Array.isArray(data) ? data.map(formatProduct) : [];
    } catch (error) {
        console.log("Error fetching products:", error);
        return [];
    }
};

// Get single product by id
export const getSingleProduct = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data ? formatProduct(response.data) : null;
    } catch (error) {
        console.log("Error fetching product:", error);
        return null;
    }
};

// Create product (Admin)
export const createProduct = async (productData) => {
    const formatted = formatProduct({
        ...productData,
        id: Date.now(),
        product_id: Date.now()
    });
    return formatted;
};

// Update product (Admin)
export const updateProduct = async (id, productData) => {
    return formatProduct({ ...productData, id, product_id: id });
};

// Delete product (Admin)
export const deleteProduct = async (id, permanent = false) => {
    return { message: "Product deleted successfully." };
};

/* ==================== CATEGORIES API ==================== */

export const getCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data.map((cat, idx) => ({
                category_id: idx + 1,
                name: typeof cat === "string" ? cat : (cat.name || `Category ${idx + 1}`),
                slug: typeof cat === "string" ? cat.toLowerCase().replace(/[^a-z0-9]+/g, "-") : (cat.slug || "")
            }));
        }
    } catch (e) {
        console.log("Error fetching categories:", e);
    }
    return [
        { category_id: 1, name: "men's clothing", slug: "mens-clothing" },
        { category_id: 2, name: "women's clothing", slug: "womens-clothing" },
        { category_id: 3, name: "jewelery", slug: "jewelery" },
        { category_id: 4, name: "electronics", slug: "electronics" }
    ];
};

export const createCategory = async (categoryData) => {
    return { message: "Category created.", category: categoryData };
};

/* ==================== AUTH & PROFILE API ==================== */

export const loginApi = async (credentials) => {
    const user = {
        customer_id: 1,
        name: credentials.email.split("@")[0] || "Shopper",
        email: credentials.email,
        phone: "9876543210",
        address: "42 MG Road, Bangalore",
        role: credentials.email.includes("admin") ? "admin" : "customer"
    };
    const token = "fashionista_token_" + Date.now();
    return { token, user, message: "Login successful!" };
};

export const registerApi = async (userData) => {
    const user = {
        customer_id: Date.now(),
        name: userData.name || "Customer",
        email: userData.email,
        phone: userData.phone || "",
        address: userData.address || "",
        role: "customer"
    };
    const token = "fashionista_token_" + Date.now();
    return { token, user, message: "Registration successful!" };
};

export const getMeApi = async () => {
    const saved = localStorage.getItem("fashionista_user");
    return { user: saved ? JSON.parse(saved) : null };
};

export const logoutApi = async () => {
    return { message: "Logout successful." };
};

export const updateProfileApi = async (profileData) => {
    const saved = localStorage.getItem("fashionista_user");
    const current = saved ? JSON.parse(saved) : {};
    const updated = { ...current, ...profileData };
    return { user: updated, message: "Profile updated successfully!" };
};

/* ==================== CART API ==================== */

export const getCart = async () => {
    const saved = localStorage.getItem("fashionista_cart");
    return { items: saved ? JSON.parse(saved) : [] };
};

export const addToCartApi = async (cartItemData) => {
    return { message: "Added to cart", item: cartItemData };
};

export const updateCartItemApi = async (cartItemId, quantity) => {
    return { message: "Cart item updated", cartItemId, quantity };
};

export const removeCartItemApi = async (cartItemId) => {
    return { message: "Cart item removed", cartItemId };
};

export const clearCartApi = async () => {
    return { message: "Cart cleared" };
};

/* ==================== WISHLIST API ==================== */

export const getWishlist = async () => {
    const saved = localStorage.getItem("fashionista_wishlist");
    return saved ? JSON.parse(saved) : [];
};

export const addToWishlistApi = async (productId) => {
    return { message: "Added to wishlist", productId };
};

export const removeFromWishlistApi = async (productId) => {
    return { message: "Removed from wishlist", productId };
};

/* ==================== ORDERS API ==================== */

export const getOrders = async () => {
    const saved = localStorage.getItem("fashionista_orders");
    return saved ? JSON.parse(saved) : [];
};

export const getOrderById = async (orderId) => {
    const saved = localStorage.getItem("fashionista_orders");
    const list = saved ? JSON.parse(saved) : [];
    return list.find((o) => o.order_id === Number(orderId)) || null;
};

export const createOrder = async (orderPayload) => {
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
        order_id: orderId,
        order_date: new Date().toISOString(),
        status: "Confirmed",
        payment_status: "Paid",
        ...orderPayload
    };
    const saved = localStorage.getItem("fashionista_orders");
    const list = saved ? JSON.parse(saved) : [];
    localStorage.setItem("fashionista_orders", JSON.stringify([newOrder, ...list]));
    return {
        order_id: orderId,
        total_amount: orderPayload.total_amount || 0,
        status: "Confirmed",
        message: "Order placed successfully!"
    };
};

export const updateOrderStatus = async (orderId, statusData) => {
    return { message: "Order status updated", orderId, ...statusData };
};

/* ==================== REVIEWS API ==================== */

export const submitReview = async (productId, reviewData) => {
    return { message: "Review submitted successfully!" };
};

/* ==================== REPORTS API (Admin Only) ==================== */

export const getDashboardReport = async () => {
    return {
        stats: {
            total_products: 20,
            total_customers: 6,
            total_orders: 14,
            total_sales: 52400,
            low_stock_products: 2
        },
        recent_orders: [],
        category_breakdown: []
    };
};

export const getCustomersReport = async () => {
    return [];
};

export const getSalesReport = async () => {
    return [];
};

export const getProductsReport = async () => {
    return [];
};

export default {
    getProducts,
    getSingleProduct,
    getCategories,
    getCart,
    addToCartApi
};
