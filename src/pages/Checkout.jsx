import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { placeOrder } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Checkout() {
  const { cart, cartTotal, clearCart } = useContext(CartContext);
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI Demo");
  const [demoUpiId, setDemoUpiId] = useState("student@oksbi");
  const [demoCardNumber, setDemoCardNumber] = useState("4532 •••• •••• 8890");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/checkout");
    }
    if (user) {
      if (user.address) setAddress(user.address);
      if (user.phone) setPhone(user.phone);
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "80px" }}>Verifying customer session...</h2>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>Your Cart is Empty</h2>
          <p style={{ color: "#666", marginTop: "10px" }}>Add items to your cart before proceeding to checkout.</p>
          <Link to="/shop">
            <button className="btn-primary" style={{ marginTop: "20px" }}>Return to Shop</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!address || address.trim() === "") {
      setErrorMsg("Please provide a valid delivery address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.id || item.product_id,
          quantity: item.quantity || 1
        })),
        delivery_address: address.trim(),
        payment_method: paymentMethod
      };

      const result = await placeOrder(payload);
      if (result && result.order_id) {
        clearCart();
        navigate(`/order-confirmation/${result.order_id}`);
      } else {
        setErrorMsg(result.error || "Order placement failed.");
      }
    } catch (err) {
      console.error("Checkout submission error:", err);
      setErrorMsg(err.response?.data?.error || "Transaction error during checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px" }}>
        <h1>Secure Checkout</h1>
        <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
          Authenticated Customer: <strong>{user?.name}</strong> ({user?.email})
        </p>

        {errorMsg && (
          <div className="alert-box alert-error" style={{ marginTop: "15px" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="checkout-container">
          {/* Left Column: Delivery & Payment Details */}
          <div>
            <div className="checkout-box" style={{ marginBottom: "25px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "15px", borderBottom: "2px solid #f0f0f0", paddingBottom: "8px" }}>
                1. Delivery Logistics Information
              </h2>

              <div className="form-group">
                <label>Recipient Name</label>
                <input type="text" value={user?.name || ""} disabled style={{ background: "#f9f9f9" }} />
              </div>

              <div className="form-group">
                <label>Contact Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Complete Shipping / Delivery Address *</label>
                <textarea
                  rows="3"
                  placeholder="House/Flat No, Street, Landmark, City, State, PIN"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="checkout-box">
              <h2 style={{ fontSize: "18px", marginBottom: "10px", borderBottom: "2px solid #f0f0f0", paddingBottom: "8px" }}>
                2. Payment Simulation
              </h2>

              <div className="alert-box alert-info" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                ℹ️ <strong>Demonstration Notice:</strong> All payment options below are simulated workflows for academic DBMS capstone evaluation.
                No real financial transaction takes place.
              </div>

              <div className="payment-options">
                <label className={`payment-card-option ${paymentMethod === "UPI Demo" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI Demo"
                    checked={paymentMethod === "UPI Demo"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>UPI Demo (Instant Settlement)</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>Simulate Google Pay, PhonePe, Paytm QR</div>
                  </div>
                </label>

                {paymentMethod === "UPI Demo" && (
                  <div style={{ padding: "10px 15px", background: "#f9f9f9", borderRadius: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Virtual Payment Address (VPA):</label>
                    <input
                      type="text"
                      value={demoUpiId}
                      onChange={(e) => setDemoUpiId(e.target.value)}
                      style={{ marginTop: "4px" }}
                    />
                  </div>
                )}

                <label className={`payment-card-option ${paymentMethod === "Card Demo" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Card Demo"
                    checked={paymentMethod === "Card Demo"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>Credit / Debit Card Demo</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>Simulated Visa / Mastercard / RuPay</div>
                  </div>
                </label>

                {paymentMethod === "Card Demo" && (
                  <div style={{ padding: "10px 15px", background: "#f9f9f9", borderRadius: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Test Card Number:</label>
                    <input
                      type="text"
                      value={demoCardNumber}
                      onChange={(e) => setDemoCardNumber(e.target.value)}
                      style={{ marginTop: "4px" }}
                    />
                  </div>
                )}

                <label className={`payment-card-option ${paymentMethod === "Cash on Delivery" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Delivery"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>Payment record inserted with status 'Pending'</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Confirmation */}
          <div>
            <div className="checkout-box" style={{ position: "sticky", top: "90px" }}>
              <h3 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}>
                Order Summary ({cart.length} items)
              </h3>

              <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "15px" }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ color: "#666" }}>Qty: {item.quantity || 1} × ₹{Number(item.price).toLocaleString("en-IN")}</div>
                    </div>
                    <span style={{ fontWeight: "bold" }}>
                      ₹{((item.quantity || 1) * Number(item.price)).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Subtotal:</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Shipping:</span>
                  <span style={{ color: "#27ae60", fontWeight: "bold" }}>FREE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold", marginTop: "12px", borderTop: "2px solid #222", paddingTop: "10px" }}>
                  <span>Grand Total:</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ width: "100%", marginTop: "20px", padding: "14px", fontSize: "16px" }}
              >
                {isSubmitting ? "Processing Transaction..." : `Place Order • ₹${cartTotal.toLocaleString("en-IN")}`}
              </button>

              <div style={{ marginTop: "12px", fontSize: "11px", color: "#888", textAlign: "center" }}>
                🔒 ACID transaction guarantees stock reservation and consistency.
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}

export default Checkout;
