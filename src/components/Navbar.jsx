import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function Navbar({ search, setSearch, onCategorySelect }) {
    const { cart, wishlist } = useContext(CartContext);
    const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // If not on homepage, navigate to home with search
        navigate("/");
    };

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        navigate("/");
    };

    return (
        <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
            {/* Top notification bar */}
            <div style={{ background: "#111", color: "#eee", fontSize: "12px", textAlign: "center", padding: "6px", letterSpacing: "1px" }}>
                <span>✨ Free Standard Shipping on Orders Over ₹999 | Use Code <strong>FASHION20</strong> for 20% OFF ✨</span>
            </div>

            {/* Main Navbar */}
            <nav id="navbar">
                <Link to="/" style={{ textDecoration: "none", color: "black", display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ letterSpacing: "2px", fontWeight: "900", margin: 0 }}>FASHIONISTA</h2>
                </Link>

                <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Search for electronics, mobiles, laptops, fashion, shoes, home..."
                        value={search !== undefined ? search : ""}
                        onChange={(e) => setSearch && setSearch(e.target.value)}
                    />
                </form>

                <div id="navright" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {/* Wishlist Button */}
                    <Link to="/wishlist">
                        <button title="My Wishlist" style={{ position: "relative" }}>
                            ❤️ <span className="nav-btn-text">Wishlist</span> ({wishlist.length})
                        </button>
                    </Link>

                    {/* Cart Button */}
                    <Link to="/cart">
                        <button title="Shopping Cart" style={{ position: "relative", fontWeight: "bold" }}>
                            🛒 <span className="nav-btn-text">Cart</span> ({cart.length})
                        </button>
                    </Link>

                    {/* Auth / Profile Button */}
                    {isAuthenticated ? (
                        <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                                id="loginbtn"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{ background: "#333", color: "white", display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <span>👤 {user?.name?.split(" ")[0] || "Account"}</span>
                                <span style={{ fontSize: "10px" }}>▼</span>
                            </button>

                            {userMenuOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "45px",
                                        background: "white",
                                        borderRadius: "10px",
                                        boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
                                        minWidth: "180px",
                                        padding: "8px 0",
                                        zIndex: 1000,
                                        border: "1px solid #eee"
                                    }}
                                >
                                    <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}>
                                        <strong>{user?.name}</strong>
                                        <div style={{ color: "#777", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                                        {isAdmin && <span style={{ display: "inline-block", background: "#e74c3c", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "10px", marginTop: "4px" }}>Admin</span>}
                                    </div>

                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setUserMenuOpen(false)}
                                            style={{ display: "block", padding: "10px 16px", fontSize: "14px", color: "#e74c3c", fontWeight: "bold" }}
                                        >
                                            ⚙️ Admin Panel
                                        </Link>
                                    )}

                                    <Link
                                        to="/profile"
                                        onClick={() => setUserMenuOpen(false)}
                                        style={{ display: "block", padding: "10px 16px", fontSize: "14px", color: "#333" }}
                                    >
                                        👤 My Profile
                                    </Link>

                                    <Link
                                        to="/orders"
                                        onClick={() => setUserMenuOpen(false)}
                                        style={{ display: "block", padding: "10px 16px", fontSize: "14px", color: "#333" }}
                                    >
                                        📦 My Orders
                                    </Link>

                                    <Link
                                        to="/wishlist"
                                        onClick={() => setUserMenuOpen(false)}
                                        style={{ display: "block", padding: "10px 16px", fontSize: "14px", color: "#333" }}
                                    >
                                        ❤️ My Wishlist
                                    </Link>

                                    <div style={{ borderTop: "1px solid #f0f0f0", marginTop: "4px" }}>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: "100%",
                                                textAlign: "left",
                                                padding: "10px 16px",
                                                background: "none",
                                                border: "none",
                                                color: "#e74c3c",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                                borderRadius: 0
                                            }}
                                        >
                                            🚪 Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login">
                            <button id="loginbtn">Login</button>
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
