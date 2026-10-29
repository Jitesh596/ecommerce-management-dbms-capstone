import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

function Cart() {
    const { cart, removeFromCart } = useContext(CartContext);

    // Calculate total price
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    return (
        <div id="cartPage">
            <Link to="/" style={{ textDecoration: "none" }}>
                <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer" }}>
                    ← Back to Home
                </button>
            </Link>

            <h1>My Cart ({cart.length} items)</h1>

            {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <h2>Your cart is empty</h2>
                    <p>Start shopping to add items to your cart!</p>
                    <Link to="/">
                        <button style={{ marginTop: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#333", color: "white" }}>
                            Continue Shopping
                        </button>
                    </Link>
                </div>
            ) : (
                <>
                    {cart.map((item) => (
                        <div className="cartItem" key={item.id}>
                            <img src={item.image} alt={item.title} />

                            <div>
                                <h3>{item.title}</h3>
                                <p>₹{(item.price * 85).toFixed(0)}</p>

                                <button onClick={() => removeFromCart(item.id)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    <div id="cartTotal">
                        <h2>Total: ₹{(total * 85).toFixed(0)}</h2>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;