import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { DEFAULT_PRODUCT_IMAGE } from "../services/api";

function ProductCard({ product }) {
  const { addToCart, isInWishlist, toggleWishlist } = useContext(CartContext);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 15;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    const added = addToCart(product, 1);
    if (added) {
      // Subtle visual feedback
      const btn = e.target;
      const originalText = btn.innerText;
      btn.innerText = "✓ Added!";
      btn.style.background = "#27ae60";
      btn.style.color = "white";
      setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = "";
        btn.style.color = "";
      }, 1200);
    }
  };

  return (
    <div className="card">
      <button
        onClick={() => toggleWishlist(product)}
        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "white",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          zIndex: 2
        }}
      >
        {inWishlist ? "❤️" : "🤍"}
      </button>

      <Link to={`/product/${product.id}`} style={{ textDecoration: "none" }}>
        <img
          src={product.image || DEFAULT_PRODUCT_IMAGE}
          alt={product.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_PRODUCT_IMAGE;
          }}
          style={{ height: "200px", objectFit: "cover", borderRadius: "6px" }}
        />
        <div className="card-category">{product.category}</div>
        <h3 title={product.title}>{product.title}</h3>
      </Link>

      <div style={{ margin: "5px 0" }}>
        {isOutOfStock ? (
          <span className="badge badge-outofstock">Out of Stock</span>
        ) : isLowStock ? (
          <span className="badge badge-lowstock">Only {product.stock} Left</span>
        ) : (
          <span className="badge badge-instock">In Stock ({product.stock})</span>
        )}
      </div>

      <div className="seller-tag">Sold by: {product.seller_name || `Seller #${product.seller_id}`}</div>

      <p style={{ margin: "5px 0 10px 0" }}>₹{Number(product.price).toLocaleString("en-IN")}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        <Link to={`/product/${product.id}`} style={{ flex: 1 }}>
          <button style={{ width: "100%", padding: "8px 10px", fontSize: "12px" }}>
            Details
          </button>
        </Link>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{
            flex: 1.2,
            padding: "8px 10px",
            fontSize: "12px",
            opacity: isOutOfStock ? 0.5 : 1,
            cursor: isOutOfStock ? "not-allowed" : "pointer"
          }}
        >
          {isOutOfStock ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
