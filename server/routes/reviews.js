const express = require("express");
const router = express.Router({ mergeParams: true });
const pool = require("../db");
const { authenticateUser } = require("../middleware/auth");

// GET reviews for product
router.get("/", async (req, res) => {
    try {
        const productId = Number(req.params.productId || req.query.productId);
        if (!productId) {
            return res.status(400).json({ error: "Product ID required." });
        }

        const [reviews] = await pool.execute(`
            SELECT review_id, customer_id, customer_name, rating, comment, created_at
            FROM reviews
            WHERE product_id = ?
            ORDER BY review_id DESC
        `, [productId]);

        res.json(reviews);
    } catch (error) {
        console.error("Reviews GET error:", error);
        res.status(500).json({ error: "Could not fetch reviews." });
    }
});

// POST review for product
router.post("/", authenticateUser, async (req, res) => {
    try {
        const productId = Number(req.params.productId || req.body.product_id);
        const customer = req.user;
        const { rating, comment } = req.body;

        if (!productId) {
            return res.status(400).json({ error: "Product ID required." });
        }

        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5." });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: "Please write a short review comment." });
        }

        // Insert review
        await pool.execute(`
            INSERT INTO reviews (product_id, customer_id, customer_name, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `, [productId, customer.customer_id, customer.name, numRating, comment.trim()]);

        // Recalculate average rating for product
        const [stats] = await pool.execute(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
            FROM reviews WHERE product_id = ?
        `, [productId]);

        const avg = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(1) : 4.5;
        const count = stats[0].total_reviews || 0;

        await pool.execute(`
            UPDATE products 
            SET rating = ?, rating_count = ?
            WHERE product_id = ?
        `, [avg, count, productId]);

        res.status(201).json({
            message: "Review submitted successfully! Thank you for your feedback.",
            rating: avg,
            rating_count: count
        });
    } catch (error) {
        console.error("Reviews POST error:", error);
        res.status(500).json({ error: "Could not submit review." });
    }
});

module.exports = router;
