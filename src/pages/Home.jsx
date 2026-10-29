import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

// Static image imports for hero & decorative sections
import banner from "../assets/images/banner.jpg";
import men from "../assets/images/men.jpg";
import women from "../assets/images/women.jpg";
import accessories from "../assets/images/accessories.jpg";
import user1 from "../assets/images/user1.jpg";
import user2 from "../assets/images/user2.jpg";
import user3 from "../assets/images/user3.jpg";

function Home() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStoreData() {
      setLoading(true);
      setError("");
      try {
        const allProducts = await getProducts();
        if (allProducts && allProducts.length > 0) {
          // Curate trending (first 8) and new arrivals (next 8)
          setTrendingProducts(allProducts.slice(0, 8));
          setNewArrivals(allProducts.slice(8, 16));
        } else {
          setError("No products available from MySQL database.");
        }
      } catch (err) {
        setError("Could not connect to MySQL backend server. Please verify backend is running on port 5000.");
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes("@")) {
      setSubscribed(true);
    }
  };

  return (
    <div id="wrapper">
      <Navbar />

      {/* Hero Section */}
      <div id="hero" style={{ backgroundImage: `url(${banner})` }}>
        <div id="overlay">
          <h1>Summer & Autumn Sale 2026</h1>
          <p>Over 50+ hand-curated fashion styles backed by MySQL database inventory.</p>
          <button onClick={() => navigate("/shop")}>Shop Full Catalogue</button>
        </div>
      </div>

      {/* Demonstration Banner */}
      <div id="sale">
        ⚡ DEMONSTRATION SALE: Up to 50% Off On Trending Apparel • Instant MySQL Inventory Tracking
      </div>

      {/* Featured Categories */}
      <div className="section-header">
        <h2>Explore By Category</h2>
        <p>Curated collections from verified merchant partners</p>
      </div>

      <div id="categories">
        <div className="categorybox" onClick={() => navigate("/shop?category=Shirts")}>
          <img src={men} alt="Shirts" />
          <p>Shirts</p>
        </div>
        <div className="categorybox" onClick={() => navigate("/shop?category=Dresses and Skirts")}>
          <img src={women} alt="Dresses and Skirts" />
          <p>Dresses & Skirts</p>
        </div>
        <div className="categorybox" onClick={() => navigate("/shop?category=Accessories")}>
          <img src={accessories} alt="Accessories" />
          <p>Accessories</p>
        </div>
        <div className="categorybox" onClick={() => navigate("/shop?category=Sneakers and Footwear")}>
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80" alt="Footwear" />
          <p>Footwear</p>
        </div>
        <div className="categorybox" onClick={() => navigate("/shop?category=Jackets")}>
          <img src="https://images.unsplash.com/photo-1544441893-675973e31985?w=300&auto=format&fit=crop&q=80" alt="Jackets" />
          <p>Jackets</p>
        </div>
      </div>

      {/* Shopping Benefits */}
      <div id="benefits">
        <div className="benefit-card">
          <div style={{ fontSize: "28px" }}>🚀</div>
          <h3>Express Delivery</h3>
          <p>Dispatch tracking and logistics status mapped 1:1 to every placed order.</p>
        </div>
        <div className="benefit-card">
          <div style={{ fontSize: "28px" }}>🔒</div>
          <h3>ACID Transactions</h3>
          <p>Database row locks prevent overselling and ensure data consistency.</p>
        </div>
        <div className="benefit-card">
          <div style={{ fontSize: "28px" }}>💳</div>
          <h3>Demo Payments</h3>
          <p>Simulate UPI, Card, and Cash on Delivery workflows risk-free.</p>
        </div>
        <div className="benefit-card">
          <div style={{ fontSize: "28px" }}>🏪</div>
          <h3>Multi-Merchant</h3>
          <p>Independent fashion sellers managed through relational foreign keys.</p>
        </div>
      </div>

      {/* Trending Products */}
      <div className="section-header">
        <h2>🔥 Trending Now</h2>
        <p>Live inventory from MySQL database table `products`</p>
      </div>

      {loading ? (
        <h3 style={{ textAlign: "center", padding: "40px" }}>Loading products from database...</h3>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#c0392b" }}>
          <p>{error}</p>
        </div>
      ) : (
        <div id="productcards">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Middle Promo Callout */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #333 100%)",
        color: "white",
        textAlign: "center",
        padding: "50px 20px",
        margin: "40px 0"
      }}>
        <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>DBMS Capstone Project Demonstration</h2>
        <p style={{ maxWidth: "700px", margin: "0 auto 20px auto", color: "#ccc", fontSize: "14px", lineHeight: "1.6" }}>
          Full 3NF normalization, automated inventory decrements via transactional checkout, stored procedures,
          and query optimization verified on MySQL 8.0.
        </p>
        <Link to="/dbms-insights">
          <button style={{
            padding: "12px 24px",
            background: "#2980b9",
            color: "white",
            border: "none",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer"
          }}>
            Explore DBMS Architecture & Schema
          </button>
        </Link>
      </div>

      {/* New Arrivals */}
      <div className="section-header">
        <h2>✨ New Arrivals</h2>
        <p>Fresh fashion additions to the Fashionista catalogue</p>
      </div>

      {!loading && !error && (
        <div id="productcards">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Link to="/shop">
          <button className="btn-primary" style={{ padding: "12px 30px", fontSize: "15px" }}>
            View All 50+ Products →
          </button>
        </Link>
      </div>

      {/* Testimonials */}
      <div id="testimonials">
        <h1>What Our Customers Say</h1>
        <p style={{ color: "#666", fontSize: "13px", marginTop: "-15px", marginBottom: "25px" }}>
          (Demonstration customer reviews for academic capstone presentation)
        </p>
        <div id="testimonialbox">
          <div className="review">
            <img src={user1} alt="Rahul Sharma" />
            <h3>Rahul Sharma</h3>
            <p>Absolutely love the fast checkout and instant order confirmation!</p>
          </div>
          <div className="review">
            <img src={user2} alt="Priya Verma" />
            <h3>Priya Verma</h3>
            <p>Great selection of ethnic and western wear. Clear pricing in INR.</p>
          </div>
          <div className="review">
            <img src={user3} alt="Amit Kumar" />
            <h3>Amit Kumar</h3>
            <p>The stock updates immediately when an order is placed. Super reliable.</p>
          </div>
        </div>
      </div>

      {/* Subscribe */}
      <div id="subscribe">
        <h1>Stay in the Loop!</h1>
        <p>Subscribe for simulated new arrival notifications and academic updates.</p>

        {subscribed ? (
          <div style={{ marginTop: "15px", color: "#27ae60", fontWeight: "bold" }}>
            ✓ Thank you! You are now subscribed to demonstration updates.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} style={{ display: "inline-block" }}>
            <input
              type="email"
              placeholder="Your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Home;
