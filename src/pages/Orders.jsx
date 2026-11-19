import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrders, getOrderById } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Orders() {
    const { isAuthenticated, user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login?redirect=/orders");
            return;
        }
        fetchOrders();
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        setLoading(true);
        const data = await getOrders();
        setOrders(data);
        if (data.length > 0) {
            // Load details for first order by default
            loadOrderDetails(data[0].order_id);
        }
        setLoading(false);
    };

    const loadOrderDetails = async (orderId) => {
        try {
            const data = await getOrderById(orderId);
            setSelectedOrder(data);
        } catch (e) {
            console.error("Fetch order detail error:", e);
        }
    };

    const orderStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

    const getStatusIndex = (currentStatus) => {
        if (currentStatus === "Cancelled") return -1;
        return orderStatuses.indexOf(currentStatus);
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px", minHeight: "70vh" }}>
                <Link to="/" style={{ textDecoration: "none" }}>
                    <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                        ← Back to Shopping
                    </button>
                </Link>

                <h1 style={{ marginBottom: "20px" }}>My Orders & Tracking</h1>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px" }}>
                        <h2>Loading your order history from database...</h2>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                        <div style={{ fontSize: "50px", marginBottom: "15px" }}>📦</div>
                        <h2>No orders placed yet</h2>
                        <p style={{ color: "#777", marginTop: "10px" }}>When you place an order, it will appear here with live tracking.</p>
                        <Link to="/">
                            <button style={{ marginTop: "25px", padding: "12px 30px", border: "none", borderRadius: "25px", cursor: "pointer", background: "#111", color: "white", fontWeight: "bold" }}>
                                Explore Products
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "25px" }} className="cart-grid">
                        {/* Orders List Sidebar */}
                        <div>
                            <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0px 0px 10px lightgray" }}>
                                <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                    All Orders ({orders.length})
                                </h3>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "650px", overflowY: "auto" }}>
                                    {orders.map((o) => (
                                        <div
                                            key={o.order_id}
                                            onClick={() => loadOrderDetails(o.order_id)}
                                            style={{
                                                padding: "14px",
                                                borderRadius: "10px",
                                                border: selectedOrder?.order_id === o.order_id ? "2px solid #111" : "1px solid #eee",
                                                background: selectedOrder?.order_id === o.order_id ? "#fcfcfc" : "white",
                                                cursor: "pointer",
                                                transition: "border 0.2s"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <strong style={{ fontSize: "15px" }}>Order #{o.order_id}</strong>
                                                <span className={`status-pill status-${o.status}`}>
                                                    {o.status}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: "12px", color: "#777", marginTop: "6px" }}>
                                                Placed: {new Date(o.order_date).toLocaleDateString()}
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "10px" }}>
                                                <span style={{ fontSize: "13px", color: "#555" }}>{o.total_items || 1} item(s)</span>
                                                <strong style={{ fontSize: "16px", color: "#e74c3c" }}>₹{Number(o.total_amount).toFixed(0)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Order Details & Tracker */}
                        {selectedOrder ? (
                            <div style={{ background: "white", borderRadius: "12px", padding: "30px", boxShadow: "0px 0px 10px lightgray" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                                    <div>
                                        <h2 style={{ margin: 0 }}>Order #{selectedOrder.order_id}</h2>
                                        <span style={{ fontSize: "13px", color: "#777" }}>
                                            Placed on {new Date(selectedOrder.order_date).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span className={`status-pill status-${selectedOrder.status}`} style={{ fontSize: "14px", padding: "6px 14px" }}>
                                            Status: {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Status Tracker Progress Bar */}
                                {selectedOrder.status === "Cancelled" ? (
                                    <div style={{ background: "#ffebee", color: "#c62828", padding: "15px", borderRadius: "8px", margin: "25px 0", textAlign: "center", fontWeight: "bold" }}>
                                        ❌ This order has been cancelled.
                                    </div>
                                ) : (
                                    <div style={{ margin: "30px 0" }}>
                                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "15px" }}>Delivery Tracking:</div>
                                        <div className="tracker-timeline">
                                            {orderStatuses.map((stepName, idx) => {
                                                const currentIdx = getStatusIndex(selectedOrder.status);
                                                const isCompleted = idx < currentIdx;
                                                const isCurrent = idx === currentIdx;

                                                return (
                                                    <div key={stepName} className={`tracker-step ${isCompleted ? "completed" : isCurrent ? "current" : ""}`}>
                                                        <div className="tracker-dot">
                                                            {isCompleted ? "✓" : idx + 1}
                                                        </div>
                                                        <p>{stepName}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Ordered Items Table */}
                                <h3 style={{ fontSize: "16px", margin: "25px 0 15px 0" }}>Items in this Order</h3>
                                <div style={{ border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
                                    {selectedOrder.items?.map((item) => (
                                        <div key={item.order_detail_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                                <img src={item.image_url} alt={item.product_name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
                                                <div>
                                                    <strong>{item.product_name}</strong>
                                                    <div style={{ fontSize: "12px", color: "#777" }}>
                                                        Size: {item.selected_size} | Color: {item.selected_color} | Qty: {item.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                            <strong>₹{(Number(item.unit_price) * item.quantity).toFixed(0)}</strong>
                                        </div>
                                    ))}
                                </div>

                                {/* Order & Delivery Meta Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "25px", background: "#f9f9f9", padding: "20px", borderRadius: "10px", fontSize: "13px", lineHeight: "1.7" }}>
                                    <div>
                                        <h4 style={{ marginBottom: "8px" }}>Shipping Address</h4>
                                        <p style={{ margin: 0, color: "#555" }}>
                                            <strong>{selectedOrder.customer_name || user?.name}</strong><br />
                                            {selectedOrder.shipping_address}<br />
                                            Phone: {selectedOrder.customer_phone || user?.phone || "N/A"}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 style={{ marginBottom: "8px" }}>Payment & Invoicing</h4>
                                        <div style={{ color: "#555" }}>
                                            Payment Method: <strong>{selectedOrder.payment_method}</strong><br />
                                            Payment Status: <strong>{selectedOrder.payment_status}</strong><br />
                                            Delivery Charge: {Number(selectedOrder.delivery_charge) === 0 ? "FREE" : `₹${selectedOrder.delivery_charge}`}<br />
                                            Discount: -₹{Number(selectedOrder.discount_amount || 0).toFixed(0)}<br />
                                            Total Paid: <strong style={{ color: "#e74c3c", fontSize: "15px" }}>₹{Number(selectedOrder.total_amount).toFixed(0)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default Orders;
