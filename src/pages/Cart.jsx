import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Cart() {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        discount,
        coupon,
        deliveryCharge,
        total,
        applyCoupon,
        removeCoupon
    } = useContext(CartContext);

    const { isAuthenticated } = useContext(AuthContext);
    const [couponInput, setCouponInput] = useState("");
    const [couponMessage, setCouponMessage] = useState("");
    const navigate = useNavigate();

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (!couponInput.trim()) return;

        const res = applyCoupon(couponInput);
        setCouponMessage(res.message);
        if (res.success) {
            setCouponInput("");
        }
    };

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            navigate("/login?redirect=/checkout");
        } else {
            navigate("/checkout");
        }
    };

    return (
        <div>
            <Navbar />

            <div id="cartPage">
                <Link to="/" style={{ textDecoration: "none" }}>
                    <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                        ← Continue Shopping
                    </button>
                </Link>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <h1>Shopping Bag ({cart.length} unique items)</h1>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            style={{ padding: "8px 18px", border: "1px solid #ccc", borderRadius: "20px", background: "white", color: "#e74c3c", cursor: "pointer", fontWeight: "bold" }}
                        >
                            🗑️ Clear Cart
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "12px", marginTop: "20px", boxShadow: "0px 0px 10px lightgray" }}>
                        <div style={{ fontSize: "50px", marginBottom: "15px" }}>🛍️</div>
                        <h2>Your shopping bag is empty</h2>
                        <p style={{ color: "#777", marginTop: "10px" }}>Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/">
                            <button style={{ marginTop: "25px", padding: "12px 30px", border: "none", borderRadius: "25px", cursor: "pointer", background: "#111", color: "white", fontWeight: "bold", fontSize: "15px" }}>
                                Start Shopping Now
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "30px", marginTop: "20px" }} className="cart-grid">
                        {/* Cart Items List */}
                        <div>
                            {cart.map((item) => {
                                const itemId = item.cart_item_id || item.product_id || item.id;
                                const unitPrice = Number(item.price || 0);
                                const itemTotal = unitPrice * (item.quantity || 1);

                                return (
                                    <div className="cartItem" key={itemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                                            <Link to={`/product/${item.product_id || item.id}`}>
                                                <img src={item.image_url || item.image} alt={item.title || item.product_name} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                                            </Link>

                                            <div>
                                                <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#888", letterSpacing: "1px" }}>
                                                    {item.brand || "Fashionista"}
                                                </div>
                                                <h3 style={{ margin: "4px 0", fontSize: "16px" }}>
                                                    <Link to={`/product/${item.product_id || item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                                        {item.title || item.product_name}
                                                    </Link>
                                                </h3>

                                                <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#666", margin: "4px 0" }}>
                                                    {item.selected_size && <span>Size: <strong>{item.selected_size}</strong></span>}
                                                    {item.selected_color && <span>Color: <strong>{item.selected_color}</strong></span>}
                                                </div>

                                                <p style={{ margin: "4px 0" }}>₹{unitPrice.toFixed(0)}</p>

                                                {/* Quantity Selector */}
                                                <div className="qty-control">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(itemId, -1)}
                                                        title="Decrease quantity"
                                                    >
                                                        -
                                                    </button>
                                                    <span style={{ fontWeight: "bold", minWidth: "20px", textAlign: "center" }}>
                                                        {item.quantity || 1}
                                                    </span>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(itemId, 1)}
                                                        title="Increase quantity"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#111", marginBottom: "10px" }}>
                                                ₹{itemTotal.toFixed(0)}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(itemId)}
                                                style={{ background: "#ffebee", color: "#c62828", border: "none", padding: "6px 14px", borderRadius: "15px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div>
                            <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                                <h2 style={{ fontSize: "20px", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                    Order Summary
                                </h2>

                                <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0", fontSize: "14px", color: "#555" }}>
                                    <span>Items Subtotal:</span>
                                    <strong style={{ color: "#111" }}>₹{subtotal.toFixed(0)}</strong>
                                </div>

                                {/* Delivery Charge */}
                                <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0", fontSize: "14px", color: "#555" }}>
                                    <span>Estimated Delivery:</span>
                                    {deliveryCharge === 0 ? (
                                        <span style={{ color: "#27ae60", fontWeight: "bold" }}>FREE</span>
                                    ) : (
                                        <strong style={{ color: "#111" }}>₹{deliveryCharge.toFixed(0)}</strong>
                                    )}
                                </div>

                                {deliveryCharge > 0 && (
                                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>
                                        Add ₹{(999 - subtotal).toFixed(0)} more to unlock FREE delivery!
                                    </div>
                                )}

                                {/* Coupon Section */}
                                <div style={{ borderTop: "1px dashed #ddd", borderBottom: "1px dashed #ddd", padding: "15px 0", margin: "15px 0" }}>
                                    <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>Have a Promo Code?</div>
                                    {coupon ? (
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#e8f5e9", padding: "8px 12px", borderRadius: "8px" }}>
                                            <div>
                                                <strong style={{ color: "#2e7d32" }}>{coupon.code}</strong>
                                                <div style={{ fontSize: "11px", color: "#2e7d32" }}>{coupon.description}</div>
                                            </div>
                                            <button
                                                onClick={removeCoupon}
                                                style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontWeight: "bold" }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleApplyCoupon} className="coupon-box">
                                            <input
                                                type="text"
                                                placeholder="e.g. FASHION20"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value)}
                                            />
                                            <button type="submit">Apply</button>
                                        </form>
                                    )}

                                    {couponMessage && (
                                        <div style={{ fontSize: "12px", color: coupon ? "#27ae60" : "#e74c3c", marginTop: "6px" }}>
                                            {couponMessage}
                                        </div>
                                    )}

                                    <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
                                        Available codes: <strong>FASHION20</strong> (20% off), <strong>FIRST50</strong> (₹50 off)
                                    </div>
                                </div>

                                {discount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0", fontSize: "14px", color: "#27ae60" }}>
                                        <span>Coupon Discount ({coupon?.code}):</span>
                                        <strong>-₹{discount.toFixed(0)}</strong>
                                    </div>
                                )}

                                {/* Grand Total */}
                                <div style={{ display: "flex", justifyContent: "space-between", margin: "18px 0 10px 0", borderTop: "2px solid #111", paddingTop: "15px" }}>
                                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>Total Amount:</span>
                                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e74c3c" }}>
                                        ₹{total.toFixed(0)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleProceedToCheckout}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        background: "#111",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "25px",
                                        fontWeight: "bold",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                        marginTop: "15px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                                    }}
                                >
                                    Proceed to Checkout →
                                </button>

                                <div style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "12px" }}>
                                    🔒 Safe & Secure Checkout Simulation
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
