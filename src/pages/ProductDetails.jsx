import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getSingleProduct, getProducts, DEFAULT_PRODUCT_IMAGE } from "../services/api";
import { CartContext } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, isInWishlist, toggleWishlist } = useContext(CartContext);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError("");
      setQuantity(1);
      try {
        const data = await getSingleProduct(id);
        if (data) {
          setProduct(data);
          // Fetch related items from same category
          const related = await getProducts({ category: data.category });
          if (Array.isArray(related)) {
            setRelatedProducts(related.filter((item) => item.id !== data.id).slice(0, 4));
          }
        } else {
          setError("Product not found or currently inactive.");
        }
      } catch (err) {
        setError("Error communicating with MySQL database.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <h2 style={{ textAlign: "center", padding: "100px" }}>Loading product details from MySQL...</h2>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2>{error || "Product Not Found"}</h2>
          <p style={{ color: "#666", marginTop: "10px" }}>The requested item may have been discontinued or does not exist.</p>
          <Link to="/shop">
            <button className="btn-primary" style={{ marginTop: "20px" }}>← Back to Shop</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const inWishlist = isInWishlist(product.id);

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
  };

  return (
    <div id="wrapper">
      <Navbar />

      <div id="detailsPage" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link to="/shop" style={{ textDecoration: "none" }}>
            <button className="btn-secondary">← Back to Catalogue</button>
          </Link>
        </div>

        <div id="detailsBox">
          <div style={{ flex: 1, textAlign: "center" }}>
            <img
              src={product.image || DEFAULT_PRODUCT_IMAGE}
              alt={product.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_PRODUCT_IMAGE;
              }}
              style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "10px" }}
            />
          </div>

          <div id="detailsContent" style={{ flex: 1.2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="badge" style={{ background: "#eee", color: "#333", fontSize: "12px" }}>
                {product.category}
              </span>
              <button
                onClick={() => toggleWishlist(product)}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}
                title={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                {inWishlist ? "❤️" : "🤍"}
              </button>
            </div>

            <h1 style={{ fontSize: "26px", marginTop: "10px" }}>{product.title}</h1>

            <div style={{ margin: "10px 0" }}>
              {isOutOfStock ? (
                <span className="badge badge-outofstock">Out of Stock</span>
              ) : product.stock <= 15 ? (
                <span className="badge badge-lowstock">Only {product.stock} units left in database</span>
              ) : (
                <span className="badge badge-instock">In Stock ({product.stock} units available)</span>
              )}
            </div>

            <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
              Sold & Shipped by: <strong>{product.seller_name || `Merchant #${product.seller_id}`}</strong>
            </div>

            <h2 style={{ fontSize: "28px", color: "#222" }}>
              ₹{Number(product.price).toLocaleString("en-IN")}
            </h2>
            <p style={{ fontSize: "12px", color: "#777", marginTop: "-10px" }}>Inclusive of all demo taxes</p>

            <p style={{ marginTop: "15px", lineHeight: "1.6", color: "#444" }}>
              {product.description}
            </p>

            {/* Quantity Selector & Add to Cart */}
            <div style={{ marginTop: "25px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              {!isOutOfStock && (
                <div className="quantity-control">
                  <button onClick={handleDecrement} disabled={quantity <= 1}>-</button>
                  <span>{quantity}</span>
                  <button onClick={handleIncrement} disabled={quantity >= product.stock}>+</button>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  padding: "12px 30px",
                  fontSize: "15px",
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? "not-allowed" : "pointer"
                }}
              >
                {isOutOfStock ? "Sold Out" : `Add to Cart • ₹${(Number(product.price) * quantity).toLocaleString("en-IN")}`}
              </button>
            </div>

            {/* Product Specifications & Relational Info */}
            <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "15px", fontSize: "13px", color: "#666" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "6px" }}>
                <span><strong>Product ID:</strong></span><span>#{product.id}</span>
                <span><strong>Merchant ID:</strong></span><span>Seller #{product.seller_id}</span>
                <span><strong>Category:</strong></span><span>{product.category}</span>
                <span><strong>Authenticity:</strong></span><span>100% Genuine Apparel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: "60px" }}>
            <div className="section-header" style={{ textAlign: "left", marginBottom: "20px" }}>
              <h2>Similar Styles You May Like</h2>
              <p>More selections from {product.category}</p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
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
