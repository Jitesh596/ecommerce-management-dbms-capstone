import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer id="footer">
            <div className="footerbox">
                <h2 style={{ letterSpacing: "2px", marginBottom: "12px", color: "#fff" }}>FASHIONISTA</h2>
                <p style={{ maxWidth: "260px", lineHeight: "1.6", fontSize: "13px", color: "#aaa" }}>
                    Your ultimate destination for contemporary style, premium quality clothing, and timeless fashion essentials.
                </p>
                <div style={{ marginTop: "12px", fontSize: "12px", color: "#888" }}>
                    📍 Mumbai • Bengaluru • Delhi
                </div>
            </div>

            <div className="footerbox">
                <h3>Shop Categories</h3>
                <p><Link to="/?category=Men's Clothing">Men's Collection</Link></p>
                <p><Link to="/?category=Women's Clothing">Women's Collection</Link></p>
                <p><Link to="/?category=T-Shirts">T-Shirts & Tops</Link></p>
                <p><Link to="/?category=Jeans">Denim & Jeans</Link></p>
                <p><Link to="/?category=Shoes">Footwear & Sneakers</Link></p>
                <p><Link to="/?category=Accessories">Bags & Accessories</Link></p>
            </div>

            <div className="footerbox">
                <h3>Account & Orders</h3>
                <p><Link to="/login">Login / Register</Link></p>
                <p><Link to="/profile">My Profile</Link></p>
                <p><Link to="/orders">Track My Order</Link></p>
                <p><Link to="/cart">Shopping Cart</Link></p>
                <p><Link to="/wishlist">Saved Wishlist</Link></p>
                <p><Link to="/admin">Admin Portal</Link></p>
            </div>

            <div className="footerbox">
                <h3>Customer Care</h3>
                <p>📞 +91 (800) 123-4567</p>
                <p>✉️ support@fashionista.com</p>
                <p>Shipping Policy (Free over ₹999)</p>
                <p>Easy 15-Day Returns</p>
                <p>Secure Payment Simulation</p>
            </div>

            <div className="footerbox">
                <h3>Policies</h3>
                <p>Privacy Policy</p>
                <p>Terms & Conditions</p>
                <p>Cookie Preferences</p>
                <p>Security & Compliance</p>
                <p>© 2026 Fashionista Inc. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
