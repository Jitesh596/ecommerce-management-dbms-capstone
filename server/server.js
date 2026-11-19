const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// API Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const reportRoutes = require("./routes/reports");

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        message: "Fashionista backend API is up and running!",
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products/:productId/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

// Global 404 handler for unmatched API routes
app.use("/api", (req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error." });
});

// Start Express server if run directly
let server;
if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Fashionista backend running at http://localhost:${PORT}`);
    });
}

module.exports = app;
