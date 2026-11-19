import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
    getDashboardReport,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    getCategories,
    createCategory,
    getCustomersReport
} from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Admin() {
    const { isAuthenticated, isAdmin, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Active Tab State: 'overview', 'products', 'orders', 'categories', 'customers'
    const [activeTab, setActiveTab] = useState("overview");

    // Data State
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filter inside admin
    const [adminSearch, setAdminSearch] = useState("");

    // Modals
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

    // Form states for Product
    const [prodForm, setProdForm] = useState({
        product_name: "",
        category: "T-Shirts",
        price: "",
        discount_price: "",
        stock: "20",
        image_url: "",
        brand: "Fashionista",
        sizes: "S, M, L, XL",
        colors: "Black, White, Navy",
        description: "",
        is_featured: false,
        is_trending: false,
        is_new_arrival: true
    });

    // Form state for Category
    const [catForm, setCatForm] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: ""
    });

    const [actionMessage, setActionMessage] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login?redirect=/admin");
            return;
        }
        if (!isAdmin) {
            // Block non-admin customers
            return;
        }
        loadAllAdminData();
    }, [isAuthenticated, isAdmin]);

    const loadAllAdminData = async () => {
        setLoading(true);
        try {
            const [dashData, prodsData, ordersData, catsData, custsData] = await Promise.all([
                getDashboardReport(),
                getProducts({ limit: 100, includeInactive: "true" }),
                getOrders(),
                getCategories(),
                getCustomersReport()
            ]);

            setStats(dashData.stats);
            setProducts(prodsData);
            setOrders(ordersData);
            setCategories(catsData);
            setCustomers(custsData);
        } catch (err) {
            console.error("Admin data loading error:", err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(""), 3500);
    };

    /* ==================== PRODUCT ACTIONS ==================== */

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            await createProduct(prodForm);
            showToast("✓ Product created successfully and added to database!");
            setShowAddProductModal(false);
            resetProdForm();
            loadAllAdminData();
        } catch (err) {
            alert(err.response?.data?.error || "Could not create product.");
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            await updateProduct(editingProduct.product_id, prodForm);
            showToast("✓ Product updated successfully!");
            setEditingProduct(null);
            resetProdForm();
            loadAllAdminData();
        } catch (err) {
            alert(err.response?.data?.error || "Could not update product.");
        }
    };

    const handleDeleteProduct = async (productId, permanent = false) => {
        const confirmMsg = permanent
            ? "Are you sure you want to permanently delete this product from the database?"
            : "Deactivate this product? (It will be hidden from shoppers)";
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteProduct(productId, permanent);
            showToast(permanent ? "✓ Product permanently deleted." : "✓ Product deactivated.");
            loadAllAdminData();
        } catch (err) {
            alert(err.response?.data?.error || "Could not delete product.");
        }
    };

    const startEditProduct = (prod) => {
        setEditingProduct(prod);
        setProdForm({
            product_name: prod.product_name,
            category: prod.category,
            price: prod.price,
            discount_price: prod.discount_price || "",
            stock: prod.stock,
            image_url: prod.image_url || "",
            brand: prod.brand || "Fashionista",
            sizes: prod.sizes || "S, M, L, XL",
            colors: prod.colors || "Black, White",
            description: prod.description || "",
            is_featured: !!prod.is_featured,
            is_trending: !!prod.is_trending,
            is_new_arrival: !!prod.is_new_arrival
        });
    };

    const resetProdForm = () => {
        setProdForm({
            product_name: "",
            category: "T-Shirts",
            price: "",
            discount_price: "",
            stock: "20",
            image_url: "",
            brand: "Fashionista",
            sizes: "S, M, L, XL",
            colors: "Black, White, Navy",
            description: "",
            is_featured: false,
            is_trending: false,
            is_new_arrival: true
        });
    };

    /* ==================== ORDER STATUS ACTIONS ==================== */

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, { status: newStatus });
            showToast(`✓ Order #${orderId} status updated to "${newStatus}"!`);
            // Update local state
            setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert(err.response?.data?.error || "Could not update order status.");
        }
    };

    /* ==================== CATEGORY ACTIONS ==================== */

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory(catForm);
            showToast("✓ Category created successfully!");
            setShowAddCategoryModal(false);
            setCatForm({ name: "", slug: "", description: "", image_url: "" });
            loadAllAdminData();
        } catch (err) {
            alert(err.response?.data?.error || "Could not create category.");
        }
    };

    if (!isAdmin) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: "center", padding: "100px 20px" }}>
                    <div style={{ fontSize: "50px" }}>🚫</div>
                    <h2 style={{ color: "#c62828", marginTop: "15px" }}>Access Denied</h2>
                    <p style={{ color: "#666", marginTop: "8px" }}>
                        You must be signed in with an Administrator account (e.g. <strong>admin@fashionista.com</strong>) to access this dashboard.
                    </p>
                    <Link to="/login">
                        <button style={{ marginTop: "20px", padding: "10px 25px", border: "none", borderRadius: "20px", background: "#333", color: "white", cursor: "pointer" }}>
                            Sign In with Admin Account
                        </button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const filteredAdminProducts = products.filter(p => {
        if (!adminSearch.trim()) return true;
        const q = adminSearch.toLowerCase();
        return p.product_name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               (p.brand && p.brand.toLowerCase().includes(q));
    });

    return (
        <div>
            <Navbar />

            {/* Notification Toast */}
            {actionMessage && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    background: "#111",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "30px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                    zIndex: 9999,
                    fontSize: "14px"
                }}>
                    {actionMessage}
                </div>
            )}

            <div className="admin-container">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1 style={{ margin: 0, letterSpacing: "1px" }}>⚙️ Fashionista Management Panel</h1>
                        <p style={{ color: "#777", marginTop: "4px" }}>
                            Store administration, inventory controls, order fulfillment and customer reports
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={() => { resetProdForm(); setShowAddProductModal(true); }}
                            style={{ padding: "10px 22px", borderRadius: "20px", border: "none", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                        >
                            ➕ Add New Product
                        </button>
                        <button
                            onClick={() => setShowAddCategoryModal(true)}
                            style={{ padding: "10px 20px", borderRadius: "20px", border: "1px solid #ccc", background: "white", color: "#333", fontWeight: "bold", cursor: "pointer" }}
                        >
                            📁 Add Category
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="admin-stats-grid">
                        <div className="stat-card">
                            <h3>Total Products</h3>
                            <div className="stat-number">{stats.total_products}</div>
                        </div>

                        <div className="stat-card sales">
                            <h3>Total Sales Revenue</h3>
                            <div className="stat-number" style={{ color: "#27ae60" }}>
                                ₹{stats.total_sales.toLocaleString("en-IN")}
                            </div>
                        </div>

                        <div className="stat-card orders">
                            <h3>Total Orders</h3>
                            <div className="stat-number" style={{ color: "#2980b9" }}>
                                {stats.total_orders}
                            </div>
                        </div>

                        <div className="stat-card">
                            <h3>Total Customers</h3>
                            <div className="stat-number">{stats.total_customers}</div>
                        </div>

                        <div className="stat-card lowstock">
                            <h3>Low-Stock Alert</h3>
                            <div className="stat-number" style={{ color: "#e74c3c" }}>
                                {stats.low_stock_products} items
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
                        onClick={() => setActiveTab("products")}
                    >
                        👕 Product Catalog ({products.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
                        onClick={() => setActiveTab("orders")}
                    >
                        📦 Orders ({orders.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "categories" ? "active" : ""}`}
                        onClick={() => setActiveTab("categories")}
                    >
                        🗂️ Categories ({categories.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "customers" ? "active" : ""}`}
                        onClick={() => setActiveTab("customers")}
                    >
                        👥 Customers ({customers.length})
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }} className="cart-grid">
                            {/* Recent Orders Overview */}
                            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                    <h3 style={{ margin: 0 }}>Recent Orders</h3>
                                    <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: "bold" }}>
                                        View All →
                                    </button>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 5).map(o => (
                                            <tr key={o.order_id}>
                                                <td>#{o.order_id}</td>
                                                <td>{o.customer_name}</td>
                                                <td><strong>₹{Number(o.total_amount).toFixed(0)}</strong></td>
                                                <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Inventory Low-Stock Alert */}
                            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                    <h3 style={{ margin: 0, color: "#e74c3c" }}>⚠️ Critical Inventory (&lt; 15 stock)</h3>
                                    <button onClick={() => setActiveTab("products")} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontWeight: "bold" }}>
                                        Manage Stock →
                                    </button>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.filter(p => p.stock < 15).slice(0, 5).map(p => (
                                            <tr key={p.product_id}>
                                                <td><strong>{p.product_name}</strong></td>
                                                <td>{p.category}</td>
                                                <td>₹{p.price}</td>
                                                <td><span style={{ color: "#e74c3c", fontWeight: "bold" }}>{p.stock} units</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PRODUCT MANAGEMENT */}
                {activeTab === "products" && (
                    <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                            <input
                                type="text"
                                placeholder="Search products by name, category, brand..."
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                style={{ width: "320px", height: "38px", padding: "0 12px", border: "1px solid #ccc", borderRadius: "20px", outline: "none" }}
                            />

                            <button
                                onClick={() => { resetProdForm(); setShowAddProductModal(true); }}
                                style={{ padding: "10px 22px", borderRadius: "20px", border: "none", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                            >
                                ➕ Add New Product
                            </button>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Image</th>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Price</th>
                                        <th>Discount</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdminProducts.map(prod => (
                                        <tr key={prod.product_id} style={{ opacity: prod.is_active ? 1 : 0.6 }}>
                                            <td>#{prod.product_id}</td>
                                            <td>
                                                <img src={prod.image_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                                            </td>
                                            <td>
                                                <strong>{prod.product_name}</strong>
                                                <div style={{ fontSize: "11px", color: "#888" }}>Sizes: {prod.sizes}</div>
                                            </td>
                                            <td>{prod.category}</td>
                                            <td>{prod.brand}</td>
                                            <td>₹{Number(prod.price).toFixed(0)}</td>
                                            <td>{prod.discount_price ? `₹${Number(prod.discount_price).toFixed(0)}` : "-"}</td>
                                            <td>
                                                <span style={{ fontWeight: "bold", color: prod.stock < 10 ? "#e74c3c" : "#27ae60" }}>
                                                    {prod.stock}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "10px", background: prod.is_active ? "#e8f5e9" : "#ffebee", color: prod.is_active ? "#2e7d32" : "#c62828", fontWeight: "bold" }}>
                                                    {prod.is_active ? "Active" : "Hidden"}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => startEditProduct(prod)}
                                                        style={{ padding: "6px 12px", border: "1px solid #ccc", background: "#f0f0f0", borderRadius: "12px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(prod.product_id, false)}
                                                        style={{ padding: "6px 12px", border: "none", background: "#ffebee", color: "#c62828", borderRadius: "12px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                                    >
                                                        {prod.is_active ? "Deactivate" : "Deactivated"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: ORDER MANAGEMENT */}
                {activeTab === "orders" && (
                    <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Customer Order Management</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Total (₹)</th>
                                        <th>Payment</th>
                                        <th>Order Status</th>
                                        <th>Update Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.order_id}>
                                            <td><strong>#{order.order_id}</strong></td>
                                            <td>
                                                <strong>{order.customer_name}</strong>
                                                <div style={{ fontSize: "11px", color: "#777" }}>{order.customer_phone || order.customer_email}</div>
                                            </td>
                                            <td style={{ fontSize: "12px" }}>{new Date(order.order_date).toLocaleDateString()}</td>
                                            <td><strong style={{ color: "#e74c3c" }}>₹{Number(order.total_amount).toFixed(0)}</strong></td>
                                            <td>
                                                <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "10px", background: order.payment_status === "Paid" ? "#e8f5e9" : "#fff3e0", color: order.payment_status === "Paid" ? "#2e7d32" : "#e65100", fontWeight: "bold" }}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill status-${order.status}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                                    style={{ padding: "6px 10px", borderRadius: "12px", border: "1px solid #ccc", background: "white", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: CATEGORIES */}
                {activeTab === "categories" && (
                    <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", margin: 0 }}>Category Management</h2>
                            <button
                                onClick={() => setShowAddCategoryModal(true)}
                                style={{ padding: "8px 20px", borderRadius: "20px", border: "none", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                            >
                                ➕ Add Category
                            </button>
                        </div>

                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Category Name</th>
                                    <th>Slug</th>
                                    <th>Description</th>
                                    <th>Active Products</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.category_id}>
                                        <td>#{cat.category_id}</td>
                                        <td><strong>{cat.name}</strong></td>
                                        <td><code>{cat.slug}</code></td>
                                        <td style={{ color: "#666", fontSize: "13px" }}>{cat.description || "-"}</td>
                                        <td><strong>{cat.product_count || 0} items</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 5: CUSTOMER MANAGEMENT */}
                {activeTab === "customers" && (
                    <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Registered Customers</h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Total Orders</th>
                                    <th>Total Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.customer_id}>
                                        <td>#{c.customer_id}</td>
                                        <td><strong>{c.name}</strong></td>
                                        <td>{c.email}</td>
                                        <td>{c.phone || "-"}</td>
                                        <td>
                                            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: c.role === "admin" ? "#ffebee" : "#e8f4fd", color: c.role === "admin" ? "#c62828" : "#004085", fontWeight: "bold" }}>
                                                {c.role}
                                            </span>
                                        </td>
                                        <td><strong>{c.total_orders || 0}</strong></td>
                                        <td><strong style={{ color: "#27ae60" }}>₹{Number(c.total_spent || 0).toFixed(0)}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ==================== ADD / EDIT PRODUCT MODAL ==================== */}
                {(showAddProductModal || editingProduct) && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h2 style={{ margin: 0 }}>{editingProduct ? "Edit Product" : "Add New Fashion Product"}</h2>
                                <button
                                    onClick={() => { setShowAddProductModal(false); setEditingProduct(null); }}
                                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Product Name *</label>
                                    <input
                                        type="text"
                                        value={prodForm.product_name}
                                        onChange={(e) => setProdForm({ ...prodForm, product_name: e.target.value })}
                                        placeholder="e.g. Supima Cotton Crewneck Tee"
                                        style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Category *</label>
                                        <select
                                            value={prodForm.category}
                                            onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        >
                                            {categories.map(c => (
                                                <option key={c.category_id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Brand</label>
                                        <input
                                            type="text"
                                            value={prodForm.brand}
                                            onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                                            placeholder="e.g. Sartoria Roma"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Regular Price (₹) *</label>
                                        <input
                                            type="number"
                                            value={prodForm.price}
                                            onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                                            placeholder="999"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Discount Price (₹)</label>
                                        <input
                                            type="number"
                                            value={prodForm.discount_price}
                                            onChange={(e) => setProdForm({ ...prodForm, discount_price: e.target.value })}
                                            placeholder="799 (optional)"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Stock Units *</label>
                                        <input
                                            type="number"
                                            value={prodForm.stock}
                                            onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                                            placeholder="30"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Image URL</label>
                                    <input
                                        type="url"
                                        value={prodForm.image_url}
                                        onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/photo-..."
                                        style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Available Sizes</label>
                                        <input
                                            type="text"
                                            value={prodForm.sizes}
                                            onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })}
                                            placeholder="S, M, L, XL"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "13px", fontWeight: "bold" }}>Available Colors</label>
                                        <input
                                            type="text"
                                            value={prodForm.colors}
                                            onChange={(e) => setProdForm({ ...prodForm, colors: e.target.value })}
                                            placeholder="Black, White, Navy"
                                            style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Description & Details</label>
                                    <textarea
                                        value={prodForm.description}
                                        onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                                        rows={3}
                                        style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                                    <label style={{ fontSize: "13px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={prodForm.is_featured}
                                            onChange={(e) => setProdForm({ ...prodForm, is_featured: e.target.checked })}
                                        /> Featured
                                    </label>
                                    <label style={{ fontSize: "13px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={prodForm.is_trending}
                                            onChange={(e) => setProdForm({ ...prodForm, is_trending: e.target.checked })}
                                        /> Trending
                                    </label>
                                    <label style={{ fontSize: "13px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={prodForm.is_new_arrival}
                                            onChange={(e) => setProdForm({ ...prodForm, is_new_arrival: e.target.checked })}
                                        /> New Arrival
                                    </label>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddProductModal(false); setEditingProduct(null); }}
                                        style={{ padding: "10px 20px", border: "1px solid #ccc", borderRadius: "20px", background: "white", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: "10px 25px", border: "none", borderRadius: "20px", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                        {editingProduct ? "Save Changes" : "Create Product"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ==================== ADD CATEGORY MODAL ==================== */}
                {showAddCategoryModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: "450px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h2 style={{ margin: 0 }}>Add New Category</h2>
                                <button onClick={() => setShowAddCategoryModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateCategory}>
                                <div style={{ marginBottom: "15px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Category Name *</label>
                                    <input
                                        type="text"
                                        value={catForm.name}
                                        onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                                        placeholder="e.g. Blazers & Coats"
                                        style={{ width: "100%", height: "36px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Description</label>
                                    <textarea
                                        value={catForm.description}
                                        onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                                        rows={2}
                                        placeholder="Category description..."
                                        style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginTop: "4px" }}
                                    />
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCategoryModal(false)}
                                        style={{ padding: "8px 18px", border: "1px solid #ccc", borderRadius: "20px", background: "white", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: "8px 22px", border: "none", borderRadius: "20px", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                        Create Category
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default Admin;
