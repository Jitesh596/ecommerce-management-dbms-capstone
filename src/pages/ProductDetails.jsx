import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSingleProduct, submitReview } from "../services/api";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState("");

    // Review form state
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const { addToCart, addToWishlist, isInWishlist } = useContext(CartContext);
    const { isAuthenticated, user } = useContext(AuthContext);

    useEffect(() => {
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        const data = await getSingleProduct(id);
        if (data) {
            setProduct(data);
            // Default size and color
            if (data.sizes) {
                const sizesList = data.sizes.split(",").map(s => s.trim());
                setSelectedSize(sizesList[0] || "M");
            } else {
                setSelectedSize("M");
            }
            if (data.colors) {
                const colorsList = data.colors.split(",").map(c => c.trim());
                setSelectedColor(colorsList[0] || "Default");
            } else {
                setSelectedColor("Default");
            }
        }
        setLoading(false);
    };

    const showToast = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(""), 3000);
    };

    const navigate = useNavigate();
    const { isAuthenticated } = useContext(AuthContext);

    const handleAddToCart = () => {
        if (!product) return;
        if (!isAuthenticated) {
            showToast('🔑 Please sign in to add items to your cart.');
            navigate('/login?redirect=' + location.pathname);
            return;
        }
        addToCart(product, quantity, selectedSize, selectedColor);
        showToast(`✓ Added ${quantity} × "${product.product_name}" (${selectedSize}) to Cart!`);
    };

    const handleWishlistToggle = async () => {
        if (!product) return;
        if (!isAuthenticated) {
            showNotification('🔑 Please sign in to manage your wishlist.');
            navigate('/login?redirect=' + location.pathname);
            return;
        }
        const res = await addToWishlist(product);
        showToast(res.added ? `❤️ Saved "${product.product_name}" to Wishlist!` : `Removed from Wishlist.`);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert("Please log in to leave a review.");
            return;
        }
        if (!reviewComment.trim()) {
            alert("Please write a review comment.");
            return;
        }

        setSubmittingReview(true);
        try {
            await submitReview(product.product_id, {
                rating: reviewRating,
                comment: reviewComment
            });
            showToast("✓ Thank you! Your review has been published.");
            setReviewComment("");
            fetchProduct(); // Refresh reviews and average rating
        } catch (err) {
            alert(err.response?.data?.error || "Could not submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <h2>Loading product details from Fashionista catalog...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div>
                <Navbar />
                <div style={{ textAlign: "center", padding: "100px" }}>
                    <h2>Product not found.</h2>
                    <Link to="/">
                        <button style={{ marginTop: "20px", padding: "10px 25px", borderRadius: "20px", border: "none", background: "#333", color: "white", cursor: "pointer" }}>
                            ← Back to Home
                        </button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const effectivePrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
    const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
    const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;
    const sizesList = product.sizes ? product.sizes.split(",").map(s => s.trim()) : ["S", "M", "L", "XL"];
    const colorsList = product.colors ? product.colors.split(",").map(c => c.trim()) : ["Default"];
    const inWishlist = isInWishlist(product.product_id);

    return (
        <div>
            <Navbar />

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    background: "#111",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "30px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                    zIndex: 9999,
                    fontSize: "14px"
                }}>
                    {notification}
                </div>
            )}

            <div id="detailsPage">
                {/* Breadcrumbs */}
                <div style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
                    <Link to="/" style={{ color: "#111", textDecoration: "none" }}>Home</Link>
                    {" / "}
                    <Link to={`/?category=${product.category}`} style={{ color: "#111", textDecoration: "none" }}>{product.category}</Link>
                    {" / "}
                    <span style={{ color: "#888" }}>{product.product_name}</span>
                </div>

                <Link to="/" style={{ textDecoration: "none" }}>
                    <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer", background: "#eee" }}>
                        ← Back to Shopping
                    </button>
                </Link>

                {/* Main Details Box */}
                <div id="detailsBox">
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <img src={product.image_url} alt={product.product_name} style={{ width: "380px", height: "420px", objectFit: "cover", borderRadius: "8px" }} />
                        {hasDiscount && (
                            <span style={{ position: "absolute", top: "15px", left: "15px", background: "#e74c3c", color: "white", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>
                                -{discountPercent}% OFF
                            </span>
                        )}
                    </div>

                    <div id="detailsContent" style={{ maxWidth: "600px", width: "100%" }}>
                        <div style={{ textTransform: "uppercase", fontSize: "12px", letterSpacing: "1.5px", color: "#888", fontWeight: "bold" }}>
                            {product.brand || "Fashionista Luxe"}
                        </div>

                        <h1 style={{ fontSize: "28px", margin: "8px 0" }}>{product.product_name}</h1>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                            <span style={{ color: "#f39c12", fontSize: "16px" }}>
                                {"★".repeat(Math.round(product.rating || 5))}
                                {"☆".repeat(5 - Math.round(product.rating || 5))}
                            </span>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>{Number(product.rating || 4.5).toFixed(1)}</span>
                            <span style={{ color: "#888", fontSize: "13px" }}>({product.reviews?.length || product.rating_count || 0} customer reviews)</span>
                        </div>

                        {/* Price Display */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "15px", margin: "15px 0" }}>
                            <h2 style={{ fontSize: "32px", color: "#e74c3c", margin: 0 }}>₹{effectivePrice.toFixed(0)}</h2>
                            {hasDiscount && (
                                <span style={{ textDecoration: "line-through", color: "#999", fontSize: "18px" }}>
                                    ₹{Number(product.price).toFixed(0)}
                                </span>
                            )}
                            {hasDiscount && (
                                <span style={{ color: "#27ae60", fontWeight: "bold", fontSize: "14px" }}>
                                    Save ₹{(product.price - product.discount_price).toFixed(0)}
                                </span>
                            )}
                        </div>

                        {/* Stock status badge */}
                        <div style={{ margin: "10px 0" }}>
                            {product.stock <= 0 ? (
                                <span style={{ background: "#ffebee", color: "#c62828", padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
                                    ❌ Out of Stock
                                </span>
                            ) : product.stock < 10 ? (
                                <span style={{ background: "#fff3e0", color: "#e65100", padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
                                    ⚠️ Only {product.stock} units left in stock!
                                </span>
                            ) : (
                                <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
                                    ✓ In Stock ({product.stock} units available)
                                </span>
                            )}
                        </div>

                        <p style={{ margin: "15px 0", lineHeight: "1.7", color: "#555" }}>
                            {product.description}
                        </p>

                        {/* Size Selection */}
                        <div style={{ margin: "20px 0" }}>
                            <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                                Select Size: <span style={{ color: "#e74c3c" }}>{selectedSize}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {sizesList.map((sz) => (
                                    <button
                                        key={sz}
                                        onClick={() => setSelectedSize(sz)}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: "20px",
                                            border: selectedSize === sz ? "2px solid #111" : "1px solid #ccc",
                                            background: selectedSize === sz ? "#111" : "white",
                                            color: selectedSize === sz ? "white" : "#333",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            fontSize: "13px"
                                        }}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div style={{ margin: "20px 0" }}>
                            <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                                Select Color: <span style={{ color: "#e74c3c" }}>{selectedColor}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {colorsList.map((col) => (
                                    <button
                                        key={col}
                                        onClick={() => setSelectedColor(col)}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: "20px",
                                            border: selectedColor === col ? "2px solid #111" : "1px solid #ccc",
                                            background: selectedColor === col ? "#111" : "white",
                                            color: selectedColor === col ? "white" : "#333",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            fontSize: "13px"
                                        }}
                                    >
                                        {col}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "15px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px" }}>Quantity:</span>
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: "20px", overflow: "hidden" }}>
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    style={{ width: "36px", height: "36px", border: "none", background: "#f0f0f0", cursor: "pointer", fontSize: "16px", borderRadius: 0 }}
                                >
                                    -
                                </button>
                                <span style={{ width: "40px", textAlign: "center", fontWeight: "bold" }}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                                    style={{ width: "36px", height: "36px", border: "none", background: "#f0f0f0", cursor: "pointer", fontSize: "16px", borderRadius: 0 }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "25px", flexWrap: "wrap" }}>
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                style={{
                                    padding: "14px 35px",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    borderRadius: "25px",
                                    background: product.stock <= 0 ? "#ccc" : "#111",
                                    color: "white",
                                    border: "none",
                                    cursor: product.stock <= 0 ? "not-allowed" : "pointer"
                                }}
                            >
                                🛒 {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                            </button>

                            <button
                                onClick={handleWishlistToggle}
                                style={{
                                    padding: "14px 25px",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    borderRadius: "25px",
                                    background: inWishlist ? "#ffebee" : "#f0f0f0",
                                    color: inWishlist ? "#e74c3c" : "#333",
                                    border: "1px solid #ccc",
                                    cursor: "pointer"
                                }}
                            >
                                {inWishlist ? "❤️ Saved in Wishlist" : "🤍 Add to Wishlist"}
                            </button>
                        </div>

                        {/* Seller & Details Meta */}
                        <div style={{ marginTop: "30px", padding: "15px", background: "#f9f9f9", borderRadius: "10px", fontSize: "13px", lineHeight: "1.8" }}>
                            <div><strong>Category:</strong> {product.category}</div>
                            <div><strong>Seller:</strong> {product.seller_name || "Fashion Hub (Verified)"}</div>
                            <div><strong>Dispatch:</strong> Ships within 24 hours in discreet luxury packaging.</div>
                            <div><strong>Return Policy:</strong> 15-day free replacement or return.</div>
                        </div>
                    </div>
                </div>

                {/* ==================== CUSTOMER REVIEWS SECTION ==================== */}
                <div style={{ marginTop: "50px", background: "white", padding: "35px", borderRadius: "10px", boxShadow: "0px 0px 10px lightgray" }}>
                    <h2>Customer Reviews ({product.reviews?.length || 0})</h2>

                    {/* Write a review form */}
                    <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "10px", margin: "20px 0" }}>
                        <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Share Your Experience with this Item</h3>
                        {isAuthenticated ? (
                            <form onSubmit={handleReviewSubmit}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>Rating:</label>
                                    <select
                                        value={reviewRating}
                                        onChange={(e) => setReviewRating(Number(e.target.value))}
                                        style={{ padding: "6px 12px", borderRadius: "15px", border: "1px solid #ccc" }}
                                    >
                                        <option value={5}>★★★★★ (5/5) Excellent</option>
                                        <option value={4}>★★★★☆ (4/5) Very Good</option>
                                        <option value={3}>★★★☆☆ (3/5) Average</option>
                                        <option value={2}>★★☆☆☆ (2/5) Below Expectations</option>
                                        <option value={1}>★☆☆☆☆ (1/5) Poor</option>
                                    </select>
                                </div>

                                <textarea
                                    placeholder="Write details about fit, quality, comfort, and fabric..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={3}
                                    style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", outline: "none", fontSize: "14px" }}
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    style={{ marginTop: "10px", padding: "8px 24px", border: "none", borderRadius: "20px", background: "#333", color: "white", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    {submittingReview ? "Submitting..." : "Post Review"}
                                </button>
                            </form>
                        ) : (
                            <p style={{ fontSize: "14px", color: "#666" }}>
                                <Link to="/login" style={{ color: "#e74c3c", fontWeight: "bold" }}>Sign in</Link> to share your review on this product.
                            </p>
                        )}
                    </div>

                    {/* Reviews List */}
                    {product.reviews && product.reviews.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {product.reviews.map((rev) => (
                                <div key={rev.review_id} style={{ borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <strong>{rev.customer_name}</strong>
                                            <span style={{ color: "#27ae60", fontSize: "12px", marginLeft: "8px" }}>✓ Verified Buyer</span>
                                        </div>
                                        <span style={{ fontSize: "12px", color: "#888" }}>
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ color: "#f39c12", margin: "4px 0" }}>
                                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                    </div>
                                    <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.5" }}>{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "#777", fontStyle: "italic" }}>No customer reviews yet. Be the first to leave a review!</p>
                    )}
                </div>

                {/* ==================== RELATED PRODUCTS ==================== */}
                {product.related && product.related.length > 0 && (
                    <div style={{ marginTop: "50px" }}>
                        <h2 style={{ textAlign: "center", marginBottom: "25px" }}>You May Also Like</h2>
                        <div id="productcards">
                            {product.related.map((rel) => (
                                <div className="card" key={rel.product_id}>
                                    <Link to={`/product/${rel.product_id}`}>
                                        <img src={rel.image_url} alt={rel.product_name} />
                                    </Link>
                                    <h3>{rel.product_name}</h3>
                                    <p>₹{(rel.discount_price || rel.price)}</p>
                                    <div className="card-actions">
                                        <Link to={`/product/${rel.product_id}`}>
                                            <button>View Details</button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default ProductDetails;
