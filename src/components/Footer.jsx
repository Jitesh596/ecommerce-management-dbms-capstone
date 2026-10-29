import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer id="footer" style={{ padding: "40px 20px 20px 20px" }}>
      <div className="footerbox">
        <h3>Fashionista</h3>
        <p style={{ maxWidth: "260px", fontSize: "13px", lineHeight: "1.5" }}>
          Premium e-commerce fashion storefront powered by MySQL 8.0, Node.js Express, and React.
        </p>
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#aaa" }}>
          DBMS Capstone Project — 2026<br />
          Team: Nikhil Kumar Singh & Jitesh Kumar
        </p>
      </div>

      <div className="footerbox">
        <h3>Shopping</h3>
        <p><Link to="/shop">Shop All Collections</Link></p>
        <p><Link to="/shop?category=T-Shirts and Tops">T-Shirts & Tops</Link></p>
        <p><Link to="/shop?category=Jeans and Trousers">Jeans & Trousers</Link></p>
        <p><Link to="/shop?category=Sneakers and Footwear">Sneakers & Footwear</Link></p>
        <p><Link to="/shop?category=Jackets">Jackets & Coats</Link></p>
      </div>

      <div className="footerbox">
        <h3>My Account</h3>
        <p><Link to="/login">Login / Register</Link></p>
        <p><Link to="/orders">Order History</Link></p>
        <p><Link to="/profile">Profile Settings</Link></p>
        <p><Link to="/cart">Shopping Cart</Link></p>
      </div>

      <div className="footerbox">
        <h3>DBMS Capstone</h3>
        <p><Link to="/dbms-insights">ER Diagram & 3NF</Link></p>
        <p><Link to="/dbms-insights">Stored Procedures</Link></p>
        <p><Link to="/dbms-insights">Triggers & ACID</Link></p>
        <p><Link to="/dbms-insights">EXPLAIN Optimization</Link></p>
      </div>

      <div style={{ width: "100%", borderTop: "1px solid #333", marginTop: "30px", paddingTop: "15px", textAlign: "center", fontSize: "12px", color: "#888" }}>
        © 2026 Fashionista E-Commerce Management Database System. Academic Capstone Project.
      </div>
    </footer>
  );
}

export default Footer;
