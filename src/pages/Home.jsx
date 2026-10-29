import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";
import { CartContext } from "../context/CartContext";

// Static image imports for decorative sections
import banner from "../assets/images/banner.jpg";
import men from "../assets/images/men.jpg";
import women from "../assets/images/women.jpg";
import accessories from "../assets/images/accessories.jpg";
import user1 from "../assets/images/user1.jpg";
import user2 from "../assets/images/user2.jpg";
import user3 from "../assets/images/user3.jpg";

function Home() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const { addToCart, cart } = useContext(CartContext);

    // Fetch products from API on page load
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    // Filter products by search query
    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div id="wrapper">

            {/* Navbar */}
            <nav id="navbar">
                <Link to="/" style={{ textDecoration: "none", color: "black" }}>
                    <h2>FASHIONISTA</h2>
                </Link>

                <input
                    type="text"
                    placeholder="Search for products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div id="navright">
                    <Link to="/cart">
                        <button>🛒 Cart ({cart.length})</button>
                    </Link>
                    <Link to="/login">
                        <button id="loginbtn">Login</button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div
                id="hero"
                style={{ backgroundImage: `url(${banner})` }}
            >
                <div id="overlay">
                    <h1>Summer Sale is Here!</h1>
                    <p>Up to 50% off on selected styles. Refresh your wardrobe.</p>
                    <button>Shop Now</button>
                </div>
            </div>

            {/* Sale Banner */}
            <div id="sale">
                Flash Sale: Extra 20% OFF! Ends in 02:15:42
            </div>

            {/* Categories */}
            <div id="categories">
                <div className="categorybox">
                    <img src={men} alt="men" />
                    <p>Men</p>
                </div>

                <div className="categorybox">
                    <img src={women} alt="women" />
                    <p>Women</p>
                </div>

                <div className="categorybox">
                    <img src={accessories} alt="accessories" />
                    <p>Accessories</p>
                </div>
            </div>

            {/* API Product Cards */}
            <h2 style={{ textAlign: "center", marginTop: "30px" }}>Our Products</h2>

            {loading ? (
                <h2 style={{ textAlign: "center", padding: "40px" }}>Loading products...</h2>
            ) : (
                <div id="productcards">
                    {filteredProducts.length === 0 ? (
                        <h3>No products found.</h3>
                    ) : (
                        filteredProducts.map((product) => (
                            <div className="card" key={product.id}>
                                <Link to={`/product/${product.id}`}>
                                    <img src={product.image} alt={product.title} />
                                </Link>
                                <h3>{product.title.substring(0, 30)}...</h3>
                                <p>₹{(product.price * 85).toFixed(0)}</p>
                                <Link to={`/product/${product.id}`}>
                                    <button>View Details</button>
                                </Link>
                                <button onClick={() => addToCart(product)}>
                                    Add to Cart
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Testimonials */}
            <div id="testimonials">
                <h1>What Our Customers Say</h1>

                <div id="testimonialbox">
                    <div className="review">
                        <img src={user1} alt="user1" />
                        <h3>Conrad Fisher</h3>
                        <p>Absolutely love the quality and fast shipping!</p>
                    </div>

                    <div className="review">
                        <img src={user2} alt="user2" />
                        <h3>Isabel Belly</h3>
                        <p>Great selection and amazing deals.</p>
                    </div>

                    <div className="review">
                        <img src={user3} alt="user3" />
                        <h3>Jeremiah Fisher</h3>
                        <p>Customer service was super helpful.</p>
                    </div>
                </div>
            </div>

            {/* Subscribe */}
            <div id="subscribe">
                <h1>Stay in the Loop!</h1>
                <p>Sign up for exclusive offers.</p>

                <input type="email" placeholder="Your email address" />
                <button>Subscribe</button>
            </div>

            {/* Footer */}
            <footer id="footer">
                <div className="footerbox">
                    <h3>Account</h3>
                    <p>Login</p>
                    <p>Register</p>
                    <p>Wishlist</p>
                </div>

                <div className="footerbox">
                    <h3>Help</h3>
                    <p>Contact Us</p>
                    <p>Shipping</p>
                    <p>Returns</p>
                </div>

                <div className="footerbox">
                    <h3>Policies</h3>
                    <p>Privacy Policy</p>
                    <p>Terms</p>
                    <p>Cookies</p>
                </div>
            </footer>

        </div>
    );
}

export default Home;