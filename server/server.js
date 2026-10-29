
const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());

// Test the backend
app.get("/api/health", (req, res) => {
    res.json({
        message: "Fashionista backend is running!"
    });
});

// Get all active products from MySQL
app.get("/api/products", async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT
                product_id,
                product_name,
                description,
                category,
                price,
                stock,
                image_url,
                seller_id
            FROM Products
            WHERE is_active = TRUE
            ORDER BY product_id DESC
        `);

        res.json(products);
    } catch (error) {
        console.error("Products API error:", error.message);

        res.status(500).json({
            error: "Could not fetch products from the database."
        });
    }
});

// Get one product by ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                error: "Invalid product ID."
            });
        }

        const [products] = await pool.execute(
            `SELECT * FROM Products
             WHERE product_id = ? AND is_active = TRUE`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                error: "Product not found."
            });
        }

        res.json(products[0]);
    } catch (error) {
        console.error("Product API error:", error.message);

        res.status(500).json({
            error: "Could not fetch the product."
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Fashionista backend running at http://localhost:${PORT}`);
});
