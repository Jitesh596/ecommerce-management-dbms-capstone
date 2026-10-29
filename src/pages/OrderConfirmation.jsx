import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderDetail } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrderDetail(id);
        if (data) {
          setOrder(data);
        } else {
          setError("Order record could not be found.");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Error fetching order confirmation.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "100px" }}>Retrieving order receipt from MySQL...</h2>
        <Footer />
      </div>
    );
  }

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
        {error ? (
          <div style={{ textAlign: "center", background: "white", padding: "60px 20px", borderRadius: "10px" }}>
            <h2>{error}</h2>
            <Link to="/orders">
              <button className="btn-primary" style={{ marginTop: "20px" }}>View My Orders</button>
            </Link>
          </div>
        ) : (
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{ fontSize: "50px", color: "#27ae60" }}>✓</div>
              <h1 style={{ fontSize: "28px", marginTop: "10px" }}>Order Confirmed!</h1>
              <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                Thank you, <strong>{order.customer_name}</strong>. Your order has been placed and recorded in MySQL.
              </p>
            </div>

            {/* Receipt Details Box */}
            <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "25px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px" }}>
                <div>
                  <span style={{ color: "#777" }}>Order ID:</span>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>#{order.order_id}</div>
                </div>
                <div>
                  <span style={{ color: "#777" }}>Order Status:</span>
                  <div>
                    <span className={`badge badge-${order.status?.toLowerCase()}`}>{order.status}</span>
                  </div>
                </div>
                <div>
                  <span style={{ color: "#777" }}>Payment Method:</span>
                  <div style={{ fontWeight: "bold" }}>{order.payment_method}</div>
                </div>
                <div>
                  <span style={{ color: "#777" }}>Payment Status:</span>
                  <div>
                    <span className={`badge badge-${order.payment_status?.toLowerCase()}`}>{order.payment_status}</span>
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#777" }}>Delivery Destination:</span>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{order.delivery_address}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    Logistics Status: <span className="badge badge-shipped">{order.delivery_status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items Table */}
            <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Items in this Order</h3>
            <div className="data-table-container" style={{ margin: "0 0 25px 0" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
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

            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "20px", fontWeight: "bold", marginBottom: "30px" }}>
              <span>Total Paid: ₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <Link to="/orders">
                <button className="btn-secondary" style={{ padding: "12px 25px" }}>View Order History</button>
              </Link>
              <Link to="/shop">
                <button className="btn-primary" style={{ padding: "12px 25px" }}>Continue Shopping</button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrderConfirmation;
