import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getAdminOverview,
  getAdminProducts,
  createProduct,
  updateProduct,
  getAdminSellers,
  createSeller,
  getAdminOrders,
  updateOrderStatus,
  getReport
} from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Admin() {
  const { user, isAdmin, loading: authLoading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");

  // Overview Data
  const [overview, setOverview] = useState(null);

  // Products Data
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    product_name: "",
    description: "",
    category: "T-Shirts and Tops",
    price: "",
    stock: "",
    image_url: "",
    seller_id: 1
  });

  // Sellers Data
  const [sellers, setSellers] = useState([]);
  const [sellerForm, setSellerForm] = useState({
    seller_name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Orders Data
  const [orders, setOrders] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [orderStatusForm, setOrderStatusForm] = useState({ status: "Confirmed", delivery_status: "Processing" });

  // Reports Data
  const [reportKey, setReportKey] = useState("monthly-sales");
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const navigate = useNavigate();

  // Load Overview on mount
  useEffect(() => {
    if (isAdmin) {
      loadOverview();
    }
  }, [isAdmin]);

  const loadOverview = async () => {
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load overview:", err);
    }
  };

  // Load Products
  const loadProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  // Load Sellers
  const loadSellers = async () => {
    try {
      const data = await getAdminSellers();
      setSellers(data);
    } catch (err) {
      console.error("Failed to load sellers:", err);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  // Load Report
  const loadActiveReport = async (key) => {
    setReportLoading(true);
    setReportKey(key);
    try {
      const data = await getReport(key);
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load report:", err);
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  };

  // Switch tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFeedbackMsg("");
    if (tab === "overview") loadOverview();
    if (tab === "products") loadProducts();
    if (tab === "sellers") loadSellers();
    if (tab === "orders") loadOrders();
    if (tab === "reports") loadActiveReport(reportKey);
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.product_id, productForm);
        setFeedbackMsg(`Product #${editingProduct.product_id} updated successfully.`);
      } else {
        await createProduct(productForm);
        setFeedbackMsg("New product created in MySQL successfully.");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ product_name: "", description: "", category: "T-Shirts and Tops", price: "", stock: "", image_url: "", seller_id: 1 });
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Error saving product.");
    }
  };

  const handleToggleProductStatus = async (p) => {
    try {
      await updateProduct(p.product_id, { is_active: !p.is_active });
      loadProducts();
    } catch (err) {
      alert("Failed to toggle product status.");
    }
  };

  // Seller CRUD
  const handleSaveSeller = async (e) => {
    e.preventDefault();
    try {
      await createSeller(sellerForm);
      setFeedbackMsg("New seller registered successfully.");
      setShowSellerModal(false);
      setSellerForm({ seller_name: "", email: "", phone: "", address: "" });
      loadSellers();
    } catch (err) {
      alert(err.response?.data?.error || "Error registering seller.");
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId) => {
    try {
      await updateOrderStatus(orderId, orderStatusForm);
      setFeedbackMsg(`Order #${orderId} status updated successfully.`);
      setUpdatingOrderId(null);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Could not update order status.");
    }
  };

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "100px" }}>Verifying administrator credentials...</h2>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", background: "white", padding: "40px", borderRadius: "10px" }}>
          <div style={{ fontSize: "50px", color: "#c0392b" }}>🔒</div>
          <h2 style={{ marginTop: "15px" }}>Access Restricted: Administrator Only</h2>
          <p style={{ color: "#666", marginTop: "10px" }}>
            This section is restricted to administrative staff for evaluating DBMS procedures, triggers, and reports.
          </p>
          <div style={{ marginTop: "25px" }}>
            <Link to="/login">
              <button className="btn-primary">Sign in with Admin Account</button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "1300px", margin: "30px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "26px" }}>⚙️ Fashionista DBMS Administrator Dashboard</h1>
            <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
              Logged in as: <strong>{user?.name}</strong> ({user?.email}) • Target Database: <code>ecommerce_management_db</code>
            </p>
          </div>
          <Link to="/dbms-insights">
            <button className="btn-secondary" style={{ color: "#2980b9", fontWeight: "bold" }}>
              📊 View DBMS Insights Page
            </button>
          </Link>
        </div>

        {feedbackMsg && (
          <div className="alert-box alert-success">{feedbackMsg}</div>
        )}

        {/* Tab Navigation */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            📊 System Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            👕 Product Catalogue
          </button>
          <button
            className={`tab-btn ${activeTab === "sellers" ? "active" : ""}`}
            onClick={() => handleTabChange("sellers")}
          >
            🏪 Merchant Sellers
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => handleTabChange("orders")}
          >
            📦 Order & Logistics
          </button>
          <button
            className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => handleTabChange("reports")}
          >
            📑 Phase 3 SQL Reports
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && overview && (
          <div>
            <div className="kpi-grid">
              <div className="kpi-card kpi-blue">
                <h4>Registered Customers</h4>
                <div className="kpi-value">{overview.total_customers}</div>
              </div>
              <div className="kpi-card kpi-green">
                <h4>Merchant Sellers</h4>
                <div className="kpi-value">{overview.total_sellers}</div>
              </div>
              <div className="kpi-card kpi-orange">
                <h4>Active Products</h4>
                <div className="kpi-value">{overview.active_products}</div>
              </div>
              <div className="kpi-card kpi-blue">
                <h4>Total Placed Orders</h4>
                <div className="kpi-value">{overview.total_orders}</div>
              </div>
              <div className="kpi-card kpi-green">
                <h4>Paid Realized Sales</h4>
                <div className="kpi-value">₹{overview.paid_sales_total.toLocaleString("en-IN")}</div>
              </div>
              <div className="kpi-card kpi-orange">
                <h4>Pending Orders</h4>
                <div className="kpi-value">{overview.pending_orders}</div>
              </div>
              <div className="kpi-card kpi-red">
                <h4>Low-Stock Alerts (≤ 15)</h4>
                <div className="kpi-value">{overview.low_stock_products}</div>
              </div>
            </div>

            <div style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: "20px" }}>
              <h3 style={{ marginBottom: "10px" }}>Quick Management Actions</h3>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
                Directly manage relational database records using MySQL parameterized procedures and triggers.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => handleTabChange("products")} className="btn-secondary">Add / Edit Products</button>
                <button onClick={() => handleTabChange("orders")} className="btn-secondary">Update Order & Delivery Status</button>
                <button onClick={() => handleTabChange("reports")} className="btn-primary">Generate Analytical Reports</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3>Catalogue Inventory (`products` table)</h3>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ product_name: "", description: "", category: "T-Shirts and Tops", price: "", stock: "", image_url: "", seller_id: 1 });
                  setShowProductModal(true);
                }}
              >
                + Add New Product
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.product_id}>
                      <td>#{p.product_id}</td>
                      <td style={{ fontWeight: "bold" }}>{p.product_name}</td>
                      <td>{p.category}</td>
                      <td>₹{Number(p.price).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge ${p.stock <= 15 ? "badge-lowstock" : "badge-instock"}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>{p.seller_name || `Seller #${p.seller_id}`}</td>
                      <td>
                        <span className={`badge ${p.is_active ? "badge-delivered" : "badge-cancelled"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                product_name: p.product_name,
                                description: p.description || "",
                                category: p.category,
                                price: p.price,
                                stock: p.stock,
                                image_url: p.image_url || "",
                                seller_id: p.seller_id
                              });
                              setShowProductModal(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleProductStatus(p)}
                            className={p.is_active ? "btn-danger" : "btn-success"}
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            {p.is_active ? "Deactivate" : "Activate"}
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

        {/* TAB 3: SELLERS MANAGEMENT */}
        {activeTab === "sellers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3>Merchant Partners (`sellers` table)</h3>
              <button className="btn-primary" onClick={() => setShowSellerModal(true)}>
                + Register New Seller
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Seller ID</th>
                    <th>Seller Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Listed Products</th>
                    <th>Total Inventory Units</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((s) => (
                    <tr key={s.seller_id}>
                      <td>#{s.seller_id}</td>
                      <td style={{ fontWeight: "bold" }}>{s.seller_name}</td>
                      <td>{s.email}</td>
                      <td>{s.phone || "N/A"}</td>
                      <td>{s.address || "N/A"}</td>
                      <td style={{ fontWeight: "bold" }}>{s.products_count} items</td>
                      <td>{s.total_inventory} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS & LOGISTICS */}
        {activeTab === "orders" && (
          <div>
            <div style={{ marginBottom: "15px" }}>
              <h3>All Customer Orders (`orders`, `payments`, `deliveries`)</h3>
              <p style={{ color: "#666", fontSize: "13px" }}>
                Status updates execute stored procedure <code>sp_update_order_status</code> with automatic inventory management.
              </p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Delivery Address</th>
                    <th>Delivery Status</th>
                    <th style={{ textAlign: "center" }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id}>
                      <td style={{ fontWeight: "bold" }}>#{o.order_id}</td>
                      <td>
                        <strong>{o.customer_name}</strong>
                        <div style={{ fontSize: "11px", color: "#666" }}>{o.customer_email}</div>
                      </td>
                      <td>{new Date(o.order_date).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontWeight: "bold" }}>₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge badge-${o.status?.toLowerCase()}`}>{o.status}</span>
                      </td>
                      <td>
                        <div>{o.payment_method}</div>
                        <span className={`badge badge-${o.payment_status?.toLowerCase()}`}>{o.payment_status}</span>
                      </td>
                      <td style={{ maxWidth: "160px", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.delivery_address}
                      </td>
                      <td>
                        <span className="badge badge-shipped">{o.delivery_status || "Processing"}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {updatingOrderId === o.order_id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <select
                              value={orderStatusForm.status}
                              onChange={(e) => setOrderStatusForm({ ...orderStatusForm, status: e.target.value })}
                              style={{ fontSize: "11px", padding: "2px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <select
                              value={orderStatusForm.delivery_status}
                              onChange={(e) => setOrderStatusForm({ ...orderStatusForm, delivery_status: e.target.value })}
                              style={{ fontSize: "11px", padding: "2px" }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <div style={{ display: "flex", gap: "2px" }}>
                              <button onClick={() => handleUpdateOrderStatus(o.order_id)} className="btn-success" style={{ padding: "2px 6px", fontSize: "10px" }}>Save</button>
                              <button onClick={() => setUpdatingOrderId(null)} className="btn-secondary" style={{ padding: "2px 6px", fontSize: "10px" }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setUpdatingOrderId(o.order_id);
                              setOrderStatusForm({ status: o.status, delivery_status: o.delivery_status || "Processing" });
                            }}
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PHASE 3 REPORTS */}
        {activeTab === "reports" && (
          <div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {[
                { key: "monthly-sales", label: "Monthly Sales" },
                { key: "top-selling", label: "Top-Selling Products" },
                { key: "low-stock", label: "Low-Stock Reordering" },
                { key: "customer-orders", label: "Customer Lifetime Value" },
                { key: "sales-by-seller", label: "Seller Sales Performance" },
                { key: "orders-by-status", label: "Orders by Status" },
                { key: "payments-by-status", label: "Payments Breakdown" },
                { key: "subtotals-gst", label: "SQL Function Subtotals & GST" },
                { key: "detailed-orders", label: "Detailed Audit Trail" },
                { key: "catalogue-sellers", label: "Catalogue with Sellers" }
              ].map((r) => (
                <button
                  key={r.key}
                  className={`btn-secondary ${reportKey === r.key ? "btn-primary" : ""}`}
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                  onClick={() => loadActiveReport(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {reportLoading ? (
              <h3 style={{ textAlign: "center", padding: "40px" }}>Executing SQL query on MySQL...</h3>
            ) : reportData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "8px" }}>
                No records returned for this analytical report.
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(reportData[0] || {}).map((col) => (
                        <th key={col} style={{ textTransform: "capitalize" }}>
                          {col.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, colIdx) => (
                          <td key={colIdx}>
                            {val !== null && val !== undefined ? String(val) : "NULL"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add/Edit Product */}
        {showProductModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <form onSubmit={handleSaveProduct} style={{ marginTop: "15px" }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={productForm.product_name}
                    onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="T-Shirts and Tops">T-Shirts and Tops</option>
                    <option value="Shirts">Shirts</option>
                    <option value="Jeans and Trousers">Jeans and Trousers</option>
                    <option value="Dresses and Skirts">Dresses and Skirts</option>
                    <option value="Hoodies and Sweatshirts">Hoodies and Sweatshirts</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Sneakers and Footwear">Sneakers and Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Bags and Backpacks">Bags and Backpacks</option>
                    <option value="Seasonal and Trending Fashion">Seasonal and Trending Fashion</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label>Price (₹ INR) *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Merchant Seller ID *</label>
                  <input
                    type="number"
                    value={productForm.seller_id}
                    onChange={(e) => setProductForm({ ...productForm, seller_id: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Product Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                  <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save to MySQL</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Seller */}
        {showSellerModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Register New Merchant Seller</h3>
              <form onSubmit={handleSaveSeller} style={{ marginTop: "15px" }}>
                <div className="form-group">
                  <label>Seller / Brand Name *</label>
                  <input
                    type="text"
                    value={sellerForm.seller_name}
                    onChange={(e) => setSellerForm({ ...sellerForm, seller_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={sellerForm.email}
                    onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Business Address</label>
                  <textarea
                    rows="2"
                    value={sellerForm.address}
                    onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                  <button type="button" onClick={() => setShowSellerModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Register Seller</button>
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
