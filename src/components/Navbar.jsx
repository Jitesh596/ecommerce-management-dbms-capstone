import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function Navbar({ onSearch }) {
  const { cartCount } = useContext(CartContext);
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav id="navbar">
      <Link to="/" style={{ textDecoration: "none", color: "black" }}>
        <h2 style={{ letterSpacing: "1px" }}>FASHIONISTA</h2>
      </Link>

      <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search fashion, categories, brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/shop" className="nav-link">Shop All</Link>
        <Link to="/dbms-insights" className="nav-link" style={{ color: "#2980b9" }}>DBMS Insights</Link>
      </div>

      <div id="navright" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link to="/cart">
          <button style={{ display: "flex", alignItems: "center" }}>
            🛒 Cart <span className="cart-badge-count">{cartCount}</span>
          </button>
        </Link>

        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link to="/admin">
                <button style={{ background: "#222", color: "white" }}>⚙️ Admin</button>
              </Link>
            )}
            <Link to="/orders">
              <button>📦 Orders</button>
            </Link>
            <Link to="/profile">
              <button title="View Profile">👤 {user?.name?.split(" ")[0] || "Profile"}</button>
            </Link>
            <button onClick={logout} title="Sign Out" style={{ color: "#c0392b" }}>Logout</button>
          </>
        ) : (
          <Link to="/login">
            <button id="loginbtn">Login</button>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
