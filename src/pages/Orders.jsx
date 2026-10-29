import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Orders() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/orders");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleCancel = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}? Stock will be restored to the database.`)) {
      return;
    }
    try {
      const res = await cancelOrder(orderId);
      setActionMsg(res.message || `Order #${orderId} cancelled successfully.`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Could not cancel order.");
    }
  };

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1>My Order History</h1>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>
              Live customer transaction records queried from MySQL tables `orders`, `payments`, and `deliveries`.
            </p>
          </div>
          <Link to="/shop">
            <button className="btn-secondary">Browse Catalogue</button>
          </Link>
        </div>

        {actionMsg && (
          <div className="alert-box alert-success" style={{ marginBottom: "20px" }}>
            {actionMsg}
          </div>
        )}

        {loading ? (
          <h3 style={{ textAlign: "center", padding: "60px", color: "#666" }}>
            Fetching orders from MySQL database...
          </h3>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", background: "white", padding: "80px 20px", borderRadius: "10px" }}>
            <h2>You haven't placed any orders yet</h2>
            <p style={{ color: "#777", marginTop: "10px" }}>
              Explore our fashion catalogue and test our ACID transaction checkout system.
            </p>
            <Link to="/shop">
              <button className="btn-primary" style={{ marginTop: "20px" }}>Start Shopping</button>
            </Link>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Total Amount</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Delivery Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const isDelivered = ord.status === "Delivered";
                  const isCancelled = ord.status === "Cancelled";
                  const canCancel = !isDelivered && !isCancelled;

                  return (
                    <tr key={ord.order_id}>
                      <td style={{ fontWeight: "bold" }}>#{ord.order_id}</td>
                      <td>{new Date(ord.order_date).toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: "bold" }}>₹{Number(ord.total_amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge badge-${ord.status?.toLowerCase()}`}>{ord.status}</span>
                      </td>
                      <td>
                        <div>{ord.payment_method || "N/A"}</div>
                        <span className={`badge badge-${ord.payment_status?.toLowerCase()}`}>{ord.payment_status}</span>
                      </td>
                      <td>
                        <span className="badge badge-shipped">{ord.delivery_status || "Processing"}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <Link to={`/orders/${ord.order_id}`}>
                            <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                              Details
                            </button>
                          </Link>
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(ord.order_id)}
                              className="btn-danger"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Orders;
