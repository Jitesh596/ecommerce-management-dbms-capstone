import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getSingleProduct } from "../services/api";
import { CartContext } from "../context/CartContext";

function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        const data = await getSingleProduct(id);
        setProduct(data);
    };

    if (!product) {
        return <h2 style={{ textAlign: "center", padding: "50px" }}>Loading...</h2>;
    }

    return (
        <div id="detailsPage">
            <Link to="/" style={{ textDecoration: "none" }}>
                <button style={{ marginBottom: "20px", padding: "10px 20px", border: "none", borderRadius: "20px", cursor: "pointer" }}>
                    ← Back to Home
                </button>
            </Link>

            <div id="detailsBox">
                <img src={product.image} alt={product.title} />

                <div id="detailsContent">
                    <h1>{product.title}</h1>
                    <p><strong>Category:</strong> {product.category}</p>
                    <p>{product.description}</p>
                    <h2>₹{(product.price * 85).toFixed(0)}</h2>
                    <p>⭐ {product.rating?.rate} ({product.rating?.count} reviews)</p>

                    <button onClick={() => addToCart(product)}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;