import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Wishlist() {
    const { wishlist, removeFromWishlist, addToCart } = useContext(CartContext);

    const handleMoveToCart = (product) => {
        addToCart(product, 1, product.sizes ? product.sizes.split(",")[0].trim() : "M");
        removeFromWishlist(product.product_id || product.id);
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px", minHeight: "60vh" }}>
                <Link to="/" style={{ textDecoration: "none" }}>
                    <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                        ← Back to Shopping
                    </button>
                </Link>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h1>My Saved Wishlist ({wishlist.length} items)</h1>
                </div>

                {wishlist.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "12px", boxShadow: "0px 0px 10px lightgray" }}>
                        <div style={{ fontSize: "50px", marginBottom: "15px" }}>❤️</div>
                        <h2>Your wishlist is empty</h2>
                        <p style={{ color: "#777", marginTop: "10px" }}>Save your favorite fashion items here to review or buy later.</p>
                        <Link to="/">
                            <button style={{ marginTop: "25px", padding: "12px 30px", border: "none", borderRadius: "25px", cursor: "pointer", background: "#111", color: "white", fontWeight: "bold", fontSize: "15px" }}>
                                Explore Collections
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div id="productcards" style={{ padding: "10px 0" }}>
                        {wishlist.map((product) => {
                            const effectivePrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
                            const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
                            const prodId = product.product_id || product.id;

                            return (
                                <div className="card" key={prodId}>
                                    <Link to={`/product/${prodId}`}>
                                        <img src={product.image_url || product.image} alt={product.product_name || product.title} />
                                    </Link>
                                    <div className="card-brand">{product.brand || product.category}</div>
                                    <h3>{product.product_name || product.title}</h3>

                                    <div className="price-container">
                                        <span className="price-current">₹{effectivePrice.toFixed(0)}</span>
                                        {hasDiscount && <span className="price-original">₹{Number(product.price).toFixed(0)}</span>}
                                    </div>

                                    <div style={{ fontSize: "12px", color: product.stock <= 0 ? "#e74c3c" : "#27ae60", fontWeight: "bold", marginBottom: "8px" }}>
                                        {product.stock <= 0 ? "Out of Stock" : "In Stock"}
                                    </div>

                                    <div className="card-actions" style={{ flexDirection: "column", gap: "6px" }}>
                                        <button
                                            onClick={() => handleMoveToCart(product)}
                                            disabled={product.stock <= 0}
                                            style={{ width: "100%", background: "#111", color: "white" }}
                                        >
                                            🛒 Move to Cart
                                        </button>
                                        <button
                                            onClick={() => removeFromWishlist(prodId)}
                                            style={{ width: "100%", background: "#ffebee", color: "#c62828" }}
                                        >
                                            ✕ Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default Wishlist;
