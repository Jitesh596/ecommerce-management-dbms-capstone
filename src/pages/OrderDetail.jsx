import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderDetail, cancelOrder } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await getOrderDetail(id);
      if (data) {
        setOrder(data);
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error retrieving order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Cancel this order and return reserved inventory to the database?")) return;
    try {
      const res = await cancelOrder(id);
      setCancelMsg(res.message);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || "Could not cancel order.");
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "100px" }}>Loading order details...</h2>
        <Footer />
      </div>
    );
  }

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/orders">
            <button className="btn-secondary">← Back to My Orders</button>
          </Link>
          <span style={{ fontSize: "14px", color: "#666" }}>Database Record: `orders` #{id}</span>
        </div>

        {error ? (
          <div style={{ textAlign: "center", background: "white", padding: "60px 20px", borderRadius: "10px" }}>
            <h2 style={{ color: "#c0392b" }}>{error}</h2>
            <p style={{ marginTop: "10px", color: "#666" }}>
              You may not be authorized to view this customer's order.
            </p>
          </div>
        ) : (
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
              <div>
                <h1 style={{ fontSize: "24px" }}>Order #{order.order_id}</h1>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                  Placed on: {new Date(order.order_date).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`badge badge-${order.status?.toLowerCase()}`} style={{ fontSize: "13px", padding: "5px 12px" }}>
                  {order.status}
                </span>
              </div>
            </div>

            {cancelMsg && (
              <div className="alert-box alert-success">{cancelMsg}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", background: "#fafafa", padding: "20px", borderRadius: "8px" }}>
              <div>
                <h4 style={{ fontSize: "13px", color: "#777", textTransform: "uppercase", marginBottom: "8px" }}>Customer & Shipping Details</h4>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{order.customer_name}</div>
                <div style={{ fontSize: "13px", color: "#555" }}>{order.customer_email}</div>
                <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>Delivery Destination:</div>
                <div style={{ fontSize: "13px", fontWeight: "500" }}>{order.delivery_address}</div>
                <div style={{ marginTop: "6px" }}>
                  Fulfillment Status: <span className="badge badge-shipped">{order.delivery_status}</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "13px", color: "#777", textTransform: "uppercase", marginBottom: "8px" }}>Payment Settlement</h4>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{order.payment_method}</div>
                <div style={{ marginTop: "4px" }}>
                  Payment Status: <span className={`badge badge-${order.payment_status?.toLowerCase()}`}>{order.payment_status}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>
                  Amount: ₹{Number(order.total_amount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Line Items (`order_details`)</h3>
            <div className="data-table-container" style={{ margin: "0 0 25px 0" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th style={{ textAlign: "center" }}>Quantity</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.order_detail_id}>
                      <td style={{ fontWeight: "bold" }}>{item.product_name}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>₹{Number(item.unit_price).toLocaleString("en-IN")}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>
                        ₹{Number(item.line_total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #eee", paddingTop: "20px" }}>
              <div>
                {order.status !== "Delivered" && order.status !== "Cancelled" && (
                  <button onClick={handleCancelOrder} className="btn-danger">
                    Cancel Order & Return Inventory
                  </button>
                )}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrderDetail;
