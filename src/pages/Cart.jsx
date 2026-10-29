import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { DEFAULT_PRODUCT_IMAGE } from "../services/api";

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckoutProceed = () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div id="wrapper">
      <Navbar />

      <div id="cartPage" style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>Shopping Cart ({cartCount} {cartCount === 1 ? "item" : "items"})</h1>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn-secondary" style={{ fontSize: "12px", color: "#c0392b" }}>
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", background: "white", padding: "80px 20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>🛒</div>
            <h2>Your shopping cart is empty</h2>
            <p style={{ color: "#777", marginTop: "10px" }}>
              Browse through our catalogue of over 50+ fashion styles and add your favorite apparel.
            </p>
            <Link to="/shop">
              <button className="btn-primary" style={{ marginTop: "25px", padding: "12px 30px" }}>
                Start Shopping Now
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "30px" }}>
            {/* Items Column */}
            <div>
              {cart.map((item) => {
                const itemQty = item.quantity || 1;
                const itemPrice = Number(item.price) || 0;
                const maxStock = typeof item.stock === "number" ? item.stock : 999;

                return (
                  <div className="cartItem" key={item.id} style={{ position: "relative" }}>
                    <img
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                      style={{ borderRadius: "8px", width: "100px", height: "100px", objectFit: "cover" }}
                    />

                    <div style={{ flex: 1 }}>
                      <span className="badge" style={{ background: "#eee", color: "#555", fontSize: "11px" }}>
                        {item.category}
                      </span>
                      <h3 style={{ fontSize: "16px", margin: "6px 0" }}>{item.title}</h3>
                      <p style={{ fontSize: "16px", color: "#222", margin: "4px 0" }}>
                        ₹{itemPrice.toLocaleString("en-IN")}
                      </p>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Available in DB: {maxStock} units
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "15px" }}>
                        <div className="quantity-control">
                          <button onClick={() => updateQuantity(item.id, itemQty - 1)}>-</button>
                          <span>{itemQty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, itemQty + 1)}
                            disabled={itemQty >= maxStock}
                          >
                            +
                          </button>
                        </div>

                        <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                          Line Total: ₹{(itemPrice * itemQty).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      title="Remove Item"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "8px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Column */}
            <div>
              <div style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <h3 style={{ borderBottom: "2px solid #eee", paddingBottom: "12px", marginBottom: "15px" }}>
                  Order Summary
                </h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
                  <span>Items Subtotal:</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px" }}>
                  <span>Estimated Shipping:</span>
                  <span style={{ color: "#27ae60", fontWeight: "bold" }}>FREE</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#777" }}>
                  <span>Demo GST Preview (18%):</span>
                  <span>₹{(cartTotal * 0.18).toFixed(2)}</span>
                </div>

                <div style={{ borderTop: "2px solid #eee", paddingTop: "15px", marginTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                  <span>Grand Total:</span>
                  <span style={{ color: "#222" }}>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>

                <p style={{ fontSize: "11px", color: "#888", marginTop: "8px" }}>
                  * Final pricing and live stock are re-verified authoritatively on MySQL during checkout.
                </p>

                <button
                  className="btn-primary"
                  onClick={handleCheckoutProceed}
                  style={{ width: "100%", marginTop: "20px", padding: "14px", fontSize: "16px" }}
                >
                  Proceed to Checkout →
                </button>

                <div style={{ marginTop: "15px", textAlign: "center" }}>
                  <Link to="/shop" style={{ fontSize: "13px", color: "#555" }}>
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Cart;
