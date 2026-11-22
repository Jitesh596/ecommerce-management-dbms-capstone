import { useEffect, useState, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import { CartContext } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Existing static image imports for decorative sections
import banner from "../assets/images/banner.jpg";
import men from "../assets/images/men.jpg";
import women from "../assets/images/women.jpg";
import accessories from "../assets/images/accessories.jpg";
import user1 from "../assets/images/user1.jpg";
import user2 from "../assets/images/user2.jpg";
import user3 from "../assets/images/user3.jpg";

function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters & Search State
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("featured");
    const [selectedSize, setSelectedSize] = useState("All");
    const [priceRange, setPriceRange] = useState("All");
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'new', 'trending', 'sale'
    const [visibleCount, setVisibleCount] = useState(12);

    // Feedback notification state
    const [notification, setNotification] = useState("");

    // Newsletter state
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    // Flash sale countdown timer state
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 15, seconds: 42 });

    const { addToCart, addToWishlist, isInWishlist } = useContext(CartContext);

    // Initial category sync from URL if any
    useEffect(() => {
        const urlCat = searchParams.get("category");
        if (urlCat) {
            setSelectedCategory(urlCat);
        }
    }, [searchParams]);

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 2, minutes: 0, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch products & categories from MySQL API on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [prodsData, catsData] = await Promise.all([
            getProducts({ limit: 100 }),
            getCategories()
        ]);
        setProducts(prodsData);
        setCategories(catsData);
        setLoading(false);
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1, product.sizes ? product.sizes.split(",")[0].trim() : "M");
        showNotification(`✓ Added "${product.product_name}" to your cart!`);
    };

    const handleWishlistToggle = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await addToWishlist(product);
        showNotification(res.added ? `❤️ Saved "${product.product_name}" to wishlist!` : `Removed from wishlist.`);
    };

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(""), 3000);
    };

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (newsletterEmail && newsletterEmail.includes("@")) {
            setSubscribed(true);
            showNotification("🎉 Thank you for subscribing to Fashionista updates!");
            setNewsletterEmail("");
        } else {
            alert("Please enter a valid email address.");
        }
    };

    // Filter and sort products
    const filteredProducts = products.filter((product) => {
        // Tab filter
        if (activeTab === "new" && !product.is_new_arrival) return false;
        if (activeTab === "trending" && !product.is_trending) return false;
        if (activeTab === "sale" && (!product.discount_price || product.discount_price >= product.price)) return false;

        // Search query
        if (search.trim()) {
            const q = search.toLowerCase();
            const nameMatch = product.product_name?.toLowerCase().includes(q);
            const descMatch = product.description?.toLowerCase().includes(q);
            const brandMatch = product.brand?.toLowerCase().includes(q);
            const catMatch = product.category?.toLowerCase().includes(q);
            if (!nameMatch && !descMatch && !brandMatch && !catMatch) return false;
        }

        // Category filter
        if (selectedCategory !== "All") {
            if (product.category !== selectedCategory) return false;
        }

        // Size filter
        if (selectedSize !== "All") {
            if (!product.sizes || !product.sizes.includes(selectedSize)) return false;
        }

        // Price filter
        const price = product.discount_price ? Number(product.discount_price) : Number(product.price);
        if (priceRange === "under1000" && price >= 1000) return false;
        if (priceRange === "1000to2500" && (price < 1000 || price > 2500)) return false;
        if (priceRange === "2500to5000" && (price < 2500 || price > 5000)) return false;
        if (priceRange === "5000to20000" && (price < 5000 || price > 20000)) return false;
        if (priceRange === "20000to50000" && (price < 20000 || price > 50000)) return false;
        if (priceRange === "above50000" && price <= 50000) return false;
        if (priceRange === "above5000" && price <= 5000) return false;

        return true;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const priceA = a.discount_price ? Number(a.discount_price) : Number(a.price);
        const priceB = b.discount_price ? Number(b.discount_price) : Number(b.price);

        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "newest") return b.product_id - a.product_id;
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });

    const displayedProducts = sortedProducts.slice(0, visibleCount);

    // Curated sections
    const electronicsCollection = products.filter(p => p.category === "Mobiles & Tablets" || p.category === "Laptops & Computers" || p.category === "Audio & Headphones").slice(0, 4);
    const ethnicCollection = products.filter(p => p.category === "Ethnic & Festive Wear" || p.category === "Dresses").slice(0, 4);
    const menCollection = products.filter(p => p.category === "Men's Clothing" || p.category === "Shirts" || p.category === "Trousers").slice(0, 4);
    const womenCollection = products.filter(p => p.category === "Women's Clothing" || p.category === "Dresses").slice(0, 4);
    const accessoriesCollection = products.filter(p => p.category === "Accessories" || p.category === "Watches" || p.category === "Bags").slice(0, 4);

    return (
        <div id="wrapper">
            {/* Reusable Header & Navbar */}
            <Navbar search={search} setSearch={setSearch} />

            {/* Floating Toast Notification */}
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
                    fontSize: "14px",
                    animation: "fadeIn 0.3s ease"
                }}>
                    {notification}
                </div>
            )}

            {/* Category Quick Pills */}
            <div className="category-nav-bar">
                <button
                    className={`category-nav-pill ${selectedCategory === "All" ? "active" : ""}`}
                    onClick={() => { setSelectedCategory("All"); setSearchParams({}); }}
                >
                    🌟 All Categories
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.category_id}
                        className={`category-nav-pill ${selectedCategory === cat.name ? "active" : ""}`}
                        onClick={() => { setSelectedCategory(cat.name); setSearchParams({ category: cat.name }); }}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Hero Section */}
            <div
                id="hero"
                style={{ backgroundImage: `url(${banner})` }}
            >
                <div id="overlay">
                    <h1>Winter Sale is Here!</h1>
                    <p>Up to 50% off on selected styles. Refresh your wardrobe with timeless elegance.</p>
                    <a href="#catalog-section">
                        <button>Shop Now</button>
                    </a>
                </div>
            </div>

            {/* Flash Sale Banner */}
            <div id="sale">
                ⚡ Flash Sale: Extra 20% OFF! Use Code: <strong>FASHION20</strong> | Ends in {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")} ⚡
            </div>

            {/* Value Propositions / Trust Features */}
            <div className="promo-features">
                <div className="promo-feature-box">
                    <span>🚚</span>
                    <h4>Free Delivery</h4>
                    <p>On all orders above ₹999 across India</p>
                </div>
                <div className="promo-feature-box">
                    <span>✨</span>
                    <h4>100% Premium Quality</h4>
                    <p>Authentic fabrics and artisan craftsmanship</p>
                </div>
                <div className="promo-feature-box">
                    <span>🔄</span>
                    <h4>Easy 15-Day Returns</h4>
                    <p>Hassle-free pickups and instant exchange</p>
                </div>
                <div className="promo-feature-box">
                    <span>🔒</span>
                    <h4>Safe Demo Payments</h4>
                    <p>Test cards, UPI simulation and Cash on Delivery</p>
                </div>
            </div>

            {/* Visual Category Circles */}
            <div className="section-header">
                <h2>Browse by Department</h2>
                <p>Curated collections designed for your everyday lifestyle</p>
            </div>

            <div id="categories" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                <div className="categorybox" onClick={() => setSelectedCategory("Mobiles & Tablets")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80" alt="Mobiles & Tablets" />
                    <p>Mobiles & Tablets</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Laptops & Computers")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80" alt="Laptops" />
                    <p>Laptops & PCs</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Audio & Headphones")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80" alt="Audio" />
                    <p>Audio & Sound</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Ethnic & Festive Wear")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80" alt="Ethnic Wear" />
                    <p>Ethnic & Festive</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Men's Clothing")} style={{ cursor: "pointer" }}>
                    <img src={men} alt="Men's Collection" />
                    <p>Men's Fashion</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Women's Clothing")} style={{ cursor: "pointer" }}>
                    <img src={women} alt="Women's Collection" />
                    <p>Women's Fashion</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Home & Kitchen")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&auto=format&fit=crop&q=80" alt="Home & Kitchen" />
                    <p>Home & Kitchen</p>
                </div>

                <div className="categorybox" onClick={() => setSelectedCategory("Shoes")} style={{ cursor: "pointer" }}>
                    <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300&auto=format&fit=crop&q=80" alt="Sneakers & Shoes" />
                    <p>Sneakers & Shoes</p>
                </div>
            </div>

            {/* ==================== MAIN CATALOG SECTION ==================== */}
            <div id="catalog-section" style={{ paddingTop: "20px" }}>
                <div className="section-header">
                    <h2>Our Fashion Catalog</h2>
                    <p>Explore {products.length} realistic designs crafted for modern taste</p>
                </div>

                {/* Filter & Sorting Toolbar */}
                <div className="filter-toolbar">
                    {/* Collection Tabs */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                            className={`category-nav-pill ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All ({products.length})
                        </button>
                        <button
                            className={`category-nav-pill ${activeTab === "new" ? "active" : ""}`}
                            onClick={() => setActiveTab("new")}
                        >
                            ✨ New Arrivals
                        </button>
                        <button
                            className={`category-nav-pill ${activeTab === "trending" ? "active" : ""}`}
                            onClick={() => setActiveTab("trending")}
                        >
                            🔥 Trending
                        </button>
                        <button
                            className={`category-nav-pill ${activeTab === "sale" ? "active" : ""}`}
                            onClick={() => setActiveTab("sale")}
                        >
                            🏷️ On Sale
                        </button>
                    </div>

                    {/* Dropdown Filters */}
                    <div className="filter-group">
                        {/* Category Select */}
                        <select
                            className="filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.category_id} value={c.name}>{c.name}</option>
                            ))}
                        </select>

                        {/* Price Select */}
                        <select
                            className="filter-select"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                        >
                            <option value="All">Price: Any</option>
                            <option value="under1000">Under ₹1,000</option>
                            <option value="1000to2500">₹1,000 - ₹2,500</option>
                            <option value="2500to5000">₹2,500 - ₹5,000</option>
                            <option value="5000to20000">₹5,000 - ₹20,000</option>
                            <option value="20000to50000">₹20,000 - ₹50,000</option>
                            <option value="above50000">Above ₹50,000</option>
                        </select>

                        {/* Size Select */}
                        <select
                            className="filter-select"
                            value={selectedSize}
                            onChange={(e) => setSelectedSize(e.target.value)}
                        >
                            <option value="All">Size: Any</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                        </select>

                        {/* Sort Select */}
                        <select
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="featured">Featured First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                            <option value="newest">Newest Arrivals</option>
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px" }}>
                        <h2>Loading fresh styles from database...</h2>
                    </div>
                ) : (
                    <>
                        {displayedProducts.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", background: "white", maxWidth: "600px", margin: "20px auto", borderRadius: "10px" }}>
                                <h3>No products match your current search or filters.</h3>
                                <p style={{ color: "#777", marginTop: "8px" }}>Try selecting "All Categories" or clearing your search term.</p>
                                <button
                                    onClick={() => { setSelectedCategory("All"); setSearch(""); setPriceRange("All"); setSelectedSize("All"); setActiveTab("all"); }}
                                    style={{ marginTop: "15px", padding: "8px 20px", border: "none", borderRadius: "20px", background: "#333", color: "white", cursor: "pointer" }}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div id="productcards">
                                {displayedProducts.map((product) => {
                                    const effectivePrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
                                    const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
                                    const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;
                                    const inWishlist = isInWishlist(product.product_id);

                                    return (
                                        <div className="card" key={product.product_id}>
                                            {/* Badges container */}
                                            <div className="card-badge-container">
                                                {hasDiscount && <span className="badge-discount">-{discountPercent}%</span>}
                                                {product.is_new_arrival === 1 && <span className="badge-new">NEW</span>}
                                                {product.is_trending === 1 && <span className="badge-trending"></span>}
                                            </div>

                                            {/* Wishlist toggle */}
                                            <button
                                                className="wishlist-btn"
                                                onClick={(e) => handleWishlistToggle(e, product)}
                                                title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                            >
                                                {inWishlist ? "❤️" : "🤍"}
                                            </button>

                                            {/* Product Image */}
                                            <Link to={`/product/${product.product_id}`}>
                                                <img src={product.image_url} alt={product.product_name} loading="lazy" />
                                            </Link>

                                            <div className="card-brand">{product.brand || product.category}</div>
                                            <h3>{product.product_name}</h3>

                                            <div className="card-rating">
                                                {"★".repeat(Math.round(product.rating || 4))}
                                                {"☆".repeat(5 - Math.round(product.rating || 4))}
                                                <span style={{ color: "#777", marginLeft: "4px" }}>({product.rating_count || 12})</span>
                                            </div>

                                            <div className="price-container">
                                                <span className="price-current">₹{effectivePrice.toFixed(0)}</span>
                                                {hasDiscount && <span className="price-original">₹{Number(product.price).toFixed(0)}</span>}
                                            </div>

                                            {/* Stock indicator */}
                                            <div style={{ fontSize: "11px", color: product.stock < 10 ? "#e74c3c" : "#27ae60", fontWeight: "600", marginBottom: "6px" }}>
                                                {product.stock <= 0 ? "Out of Stock" : product.stock < 10 ? `Only ${product.stock} left in stock!` : "In Stock"}
                                            </div>

                                            <div className="card-actions">
                                                <Link to={`/product/${product.product_id}`}>
                                                    <button>Details</button>
                                                </Link>
                                                <button
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    disabled={product.stock <= 0}
                                                    style={{ background: product.stock <= 0 ? "#ccc" : "#333", color: "white" }}
                                                >
                                                    {product.stock <= 0 ? "Sold Out" : "Add to Cart"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination: Load More */}
                        {visibleCount < sortedProducts.length && (
                            <div style={{ textAlign: "center", margin: "30px 0" }}>
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + 12)}
                                    style={{
                                        padding: "12px 36px",
                                        background: "#111",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "25px",
                                        fontSize: "15px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        boxShadow: "0px 4px 12px rgba(0,0,0,0.15)"
                                    }}
                                >
                                    Load More Products ({sortedProducts.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ==================== CURATED ELECTRONICS & TECH SPOTLIGHT ==================== */}
            {electronicsCollection.length > 0 && (
                <div style={{ background: "#f8f9fa", padding: "40px 20px", marginTop: "40px", borderRadius: "16px" }}>
                    <div className="section-header" style={{ marginTop: 0 }}>
                        <h2>⚡ Electronics & Gadgets Best Sellers</h2>
                        <p>Flagship smartphones, Apple M-series laptops, and premium noise-cancelling audio</p>
                    </div>
                    <div id="productcards" style={{ padding: "10px" }}>
                        {electronicsCollection.map(p => (
                            <div className="card" key={p.product_id}>
                                <Link to={`/product/${p.product_id}`}>
                                    <img src={p.image_url} alt={p.product_name} />
                                </Link>
                                <div className="card-brand">{p.brand}</div>
                                <h3>{p.product_name}</h3>
                                <div className="price-container">
                                    <span className="price-current">₹{(p.discount_price || p.price).toLocaleString()}</span>
                                    {p.discount_price && <span className="price-original">₹{Number(p.price).toLocaleString()}</span>}
                                </div>
                                <div className="card-actions">
                                    <Link to={`/product/${p.product_id}`}><button>View Specs</button></Link>
                                    <button onClick={(e) => handleAddToCart(e, p)}>Add to Cart</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ==================== CURATED MEN'S SPOTLIGHT ==================== */}
            {menCollection.length > 0 && (
                <div style={{ background: "white", padding: "40px 20px", marginTop: "40px" }}>
                    <div className="section-header" style={{ marginTop: 0 }}>
                        <h2>Men's Collection Highlights</h2>
                        <p>Sharply tailored suits, classic polos, and refined outerwear</p>
                    </div>
                    <div id="productcards" style={{ padding: "10px" }}>
                        {menCollection.map(p => (
                            <div className="card" key={p.product_id}>
                                <Link to={`/product/${p.product_id}`}>
                                    <img src={p.image_url} alt={p.product_name} />
                                </Link>
                                <div className="card-brand">{p.brand}</div>
                                <h3>{p.product_name}</h3>
                                <div className="price-container">
                                    <span className="price-current">₹{(p.discount_price || p.price)}</span>
                                </div>
                                <div className="card-actions">
                                    <Link to={`/product/${p.product_id}`}><button>View Item</button></Link>
                                    <button onClick={(e) => handleAddToCart(e, p)}>Add to Cart</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ==================== CURATED WOMEN'S SPOTLIGHT ==================== */}
            {womenCollection.length > 0 && (
                <div style={{ padding: "40px 20px" }}>
                    <div className="section-header" style={{ marginTop: 0 }}>
                        <h2>Women's Designer Showcase</h2>
                        <p>Silky dresses, effortless co-ords, and evening statements</p>
                    </div>
                    <div id="productcards" style={{ padding: "10px" }}>
                        {womenCollection.map(p => (
                            <div className="card" key={p.product_id}>
                                <Link to={`/product/${p.product_id}`}>
                                    <img src={p.image_url} alt={p.product_name} />
                                </Link>
                                <div className="card-brand">{p.brand}</div>
                                <h3>{p.product_name}</h3>
                                <div className="price-container">
                                    <span className="price-current">₹{(p.discount_price || p.price)}</span>
                                </div>
                                <div className="card-actions">
                                    <Link to={`/product/${p.product_id}`}><button>View Item</button></Link>
                                    <button onClick={(e) => handleAddToCart(e, p)}>Add to Cart</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ==================== FEATURED BRANDS ==================== */}
            <div className="brands-bar">
                <h2>Featured Designer Brands</h2>
                <p style={{ color: "#777", fontSize: "14px", marginTop: "4px" }}>Hand-picked fashion ateliers partner with Fashionista</p>
                <div className="brands-grid">
                    <span className="brand-pill">SARTORIA ROMA</span>
                    <span className="brand-pill">ATELIER MODE</span>
                    <span className="brand-pill">CUERO MILANO</span>
                    <span className="brand-pill">REBEL MOTO</span>
                    <span className="brand-pill">NORDIC STORM</span>
                    <span className="brand-pill">HERITAGE CLUB</span>
                    <span className="brand-pill">CHRONOS GENEVE</span>
                </div>
            </div>

            {/* Testimonials */}
            <div id="testimonials">
                <h1>What Our Customers Say</h1>
                <div id="testimonialbox">
                    <div className="review">
                        <img src={user1} alt="user1" />
                        <h3>Conrad Fisher</h3>
                        <p style={{ color: "#f39c12", margin: "4px 0" }}>★★★★★</p>
                        <p>"Absolutely love the quality and lightning fast shipping! The Italian wool suit fit perfectly straight out of the box."</p>
                    </div>

                    <div className="review">
                        <img src={user2} alt="user2" />
                        <h3>Isabel Belly</h3>
                        <p style={{ color: "#f39c12", margin: "4px 0" }}>★★★★★</p>
                        <p>"Great selection and amazing deals. The floral sundress and leather tote bag are now my favorite wardrobe pieces."</p>
                    </div>

                    <div className="review">
                        <img src={user3} alt="user3" />
                        <h3>Jeremiah Fisher</h3>
                        <p style={{ color: "#f39c12", margin: "4px 0" }}>★★★★★</p>
                        <p>"Customer service was super helpful with sizing guidance. Hassle-free checkout and genuine luxury material."</p>
                    </div>
                </div>
            </div>

            {/* Newsletter Subscription */}
            <div id="subscribe">
                <h1>Stay in the Loop!</h1>
                <p>Sign up for exclusive offers, secret sales, and new seasonal arrivals.</p>

                {subscribed ? (
                    <div style={{ color: "#27ae60", fontWeight: "bold", marginTop: "15px", fontSize: "16px" }}>
                        ✓ Thank you! You're now on the VIP list for upcoming fashion drops.
                    </div>
                ) : (
                    <form onSubmit={handleNewsletterSubmit} style={{ display: "inline-block" }}>
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

            {/* Reusable Footer */}
            <Footer />
        </div>
    );
}

export default Home;
