import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { createOrder } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Checkout() {
    const { cart, subtotal, discount, coupon, deliveryCharge, total, clearCart } = useContext(CartContext);
    const { user, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [address, setAddress] = useState(user?.address || "");
    const [city, setCity] = useState("Mumbai");
    const [state, setState] = useState("Maharashtra");
    const [pincode, setPincode] = useState("400001");
    const [paymentMethod, setPaymentMethod] = useState("Demo UPI / Card");

    // Order processing state
    const [processing, setProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    // Demo Card state
    const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
    const [cardExpiry, setCardExpiry] = useState("12/28");
    const [cardCVV, setCardCVV] = useState("123");

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login?redirect=/checkout");
        }
        if (cart.length === 0 && !orderSuccess) {
            navigate("/cart");
        }
    }, [isAuthenticated, cart, orderSuccess]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
            setErrorMessage("Please complete all shipping address fields.");
            return;
        }

        const fullAddress = `${address.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;

        setProcessing(true);

        try {
            const orderPayload = {
                shipping_address: fullAddress,
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                payment_method: paymentMethod,
                coupon_code: coupon ? coupon.code : null,
                items: cart.map(item => ({
                    product_id: item.product_id || item.id,
                    quantity: item.quantity || 1,
                    selected_size: item.selected_size || "M",
                    selected_color: item.selected_color || "Default"
                }))
            };

            const response = await createOrder(orderPayload);

            setOrderSuccess({
                order_id: response.order_id,
                total_amount: response.total_amount,
                status: response.status || "Confirmed",
                address: fullAddress,
                payment_method: paymentMethod
            });

            // Clear local cart
            await clearCart();
        } catch (err) {
            console.error("Order placement error:", err);
            setErrorMessage(err.response?.data?.error || "Failed to place order. Please check stock and try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px", minHeight: "70vh" }}>
                {orderSuccess ? (
                    /* Order Confirmation Screen */
                    <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0px 0px 15px lightgray", textAlign: "center", maxWidth: "650px", margin: "40px auto" }}>
                        <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
                        <h1 style={{ color: "#27ae60", fontSize: "28px", marginBottom: "10px" }}>Order Confirmed!</h1>
                        <p style={{ color: "#555", fontSize: "16px" }}>
                            Thank you for shopping with Fashionista! Your order has been placed in our database.
                        </p>

                        <div style={{ background: "#f8f9fa", border: "1px solid #eaeaea", borderRadius: "10px", padding: "20px", margin: "25px 0", textAlign: "left", lineHeight: "1.8" }}>
                            <div><strong>Order ID:</strong> #{orderSuccess.order_id}</div>
                            <div><strong>Status:</strong> <span className="status-pill status-Confirmed">{orderSuccess.status}</span></div>
                            <div><strong>Payment Method:</strong> {orderSuccess.payment_method}</div>
                            <div><strong>Final Amount:</strong> ₹{Number(orderSuccess.total_amount).toFixed(2)}</div>
                            <div><strong>Delivering To:</strong> {orderSuccess.address}</div>
                            <div><strong>Estimated Delivery:</strong> Within 3-5 Business Days</div>
                        </div>

                        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                            <Link to="/orders">
                                <button style={{ padding: "12px 28px", border: "none", borderRadius: "25px", background: "#111", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>
                                    📦 View Order Tracking
                                </button>
                            </Link>

                            <Link to="/">
                                <button style={{ padding: "12px 28px", border: "1px solid #ccc", borderRadius: "25px", background: "#f5f5f5", color: "#333", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>
                                    Continue Shopping
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Checkout Stepper & Form */
                    <div>
                        <Link to="/cart" style={{ textDecoration: "none" }}>
                            <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                                ← Back to Cart
                            </button>
                        </Link>

                        <h1 style={{ marginBottom: "25px" }}>Secure Checkout</h1>

                        {errorMessage && (
                            <div style={{ background: "#ffebee", color: "#c62828", padding: "12px 18px", borderRadius: "8px", marginBottom: "20px", fontWeight: "bold" }}>
                                ⚠️ {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }} className="cart-grid">
                            {/* Left: Shipping & Payment Details */}
                            <div>
                                {/* Step 1: Shipping Address */}
                                <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray", marginBottom: "25px" }}>
                                    <h2 style={{ fontSize: "18px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>1. Shipping Information</span>
                                    </h2>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>Full Name *</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>Phone Number *</label>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "15px" }}>
                                        <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>Delivery Street Address *</label>
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="House / Flat No., Street, Landmark"
                                            style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>City *</label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>State *</label>
                                            <input
                                                type="text"
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#444" }}>PIN Code *</label>
                                            <input
                                                type="text"
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value)}
                                                style={{ width: "100%", height: "38px", padding: "0 10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "6px" }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Payment Method (Safe Demo Workflow) */}
                                <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                                    <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>
                                        2. Payment Method
                                    </h2>

                                    {/* Notice banner clearly identifying safe demo */}
                                    <div style={{ background: "#e8f4fd", border: "1px solid #b6e0fe", color: "#004085", padding: "10px 15px", borderRadius: "8px", fontSize: "13px", marginBottom: "15px" }}>
                                        ℹ️ <strong>Safe Demo Mode:</strong> Payments are processed in sandbox simulation mode. No real money or bank accounts will be charged.
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: paymentMethod === "Demo UPI / Card" ? "2px solid #111" : "1px solid #ddd", borderRadius: "8px", cursor: "pointer" }}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={paymentMethod === "Demo UPI / Card"}
                                                onChange={() => setPaymentMethod("Demo UPI / Card")}
                                            />
                                            <div>
                                                <strong>⚡ Instant Demo Payment (UPI / Simulated Card)</strong>
                                                <div style={{ fontSize: "12px", color: "#666" }}>Auto-confirms order instantly with verified paid status.</div>
                                            </div>
                                        </label>

                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: paymentMethod === "Cash on Delivery" ? "2px solid #111" : "1px solid #ddd", borderRadius: "8px", cursor: "pointer" }}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={paymentMethod === "Cash on Delivery"}
                                                onChange={() => setPaymentMethod("Cash on Delivery")}
                                            />
                                            <div>
                                                <strong>💵 Cash on Delivery (COD)</strong>
                                                <div style={{ fontSize: "12px", color: "#666" }}>Pay with cash or UPI on delivery to courier agent.</div>
                                            </div>
                                        </label>
                                    </div>

                                    {paymentMethod === "Demo UPI / Card" && (
                                        <div style={{ marginTop: "15px", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #eee" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>Demo Test Card Details:</div>
                                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                                                <input type="text" value={cardNumber} readOnly style={{ height: "34px", padding: "0 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px" }} />
                                                <input type="text" value={cardExpiry} readOnly style={{ height: "34px", padding: "0 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px" }} />
                                                <input type="text" value={cardCVV} readOnly style={{ height: "34px", padding: "0 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px" }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Order Summary Confirmation */}
                            <div>
                                <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray", position: "sticky", top: "100px" }}>
                                    <h3 style={{ fontSize: "18px", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                        Order Summary ({cart.length} items)
                                    </h3>

                                    {/* Items List Preview */}
                                    <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "15px" }}>
                                        {cart.map((item) => (
                                            <div key={item.cart_item_id || item.product_id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid #f9f9f9" }}>
                                                <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.quantity} × {item.product_name || item.title} ({item.selected_size})
                                                </span>
                                                <strong>₹{((item.price) * item.quantity).toFixed(0)}</strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: "14px", color: "#555" }}>
                                        <span>Subtotal:</span>
                                        <strong>₹{subtotal.toFixed(0)}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: "14px", color: "#555" }}>
                                        <span>Delivery:</span>
                                        {deliveryCharge === 0 ? <strong style={{ color: "#27ae60" }}>FREE</strong> : <strong>₹{deliveryCharge.toFixed(0)}</strong>}
                                    </div>

                                    {discount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: "14px", color: "#27ae60" }}>
                                            <span>Discount ({coupon?.code}):</span>
                                            <strong>-₹{discount.toFixed(0)}</strong>
                                        </div>
                                    )}

                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "15px 0 20px 0", borderTop: "2px solid #111", paddingTop: "12px" }}>
                                        <span style={{ fontSize: "18px", fontWeight: "bold" }}>Total Payable:</span>
                                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e74c3c" }}>
                                            ₹{total.toFixed(0)}
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        style={{
                                            width: "100%",
                                            padding: "14px",
                                            background: processing ? "#888" : "#111",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "25px",
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            cursor: processing ? "wait" : "pointer",
                                            boxShadow: "0px 4px 12px rgba(0,0,0,0.2)"
                                        }}
                                    >
                                        {processing ? "Processing Order..." : "Confirm & Place Order"}
                                    </button>

                                    <div style={{ fontSize: "12px", color: "#888", textAlign: "center", marginTop: "12px" }}>
                                        By placing order, you agree to Fashionista's Terms of Service.
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default Checkout;
