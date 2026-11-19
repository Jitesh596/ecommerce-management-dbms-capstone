const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser } = require("../middleware/auth");

// GET /api/wishlist
router.get("/", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;

        const [items] = await pool.execute(`
            SELECT 
                w.wishlist_id,
                w.product_id,
                w.created_at,
                p.product_name,
                p.price,
                p.discount_price,
                p.stock,
                p.image_url,
                p.category,
                p.brand,
                p.rating
            FROM wishlist w
            JOIN products p ON w.product_id = p.product_id
            WHERE w.customer_id = ?
            ORDER BY w.wishlist_id DESC
        `, [customerId]);

        res.json(items);
    } catch (error) {
        console.error("Wishlist GET error:", error);
        res.status(500).json({ error: "Could not fetch wishlist." });
    }
});

// POST /api/wishlist
router.post("/", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required." });
        }

        const [prod] = await pool.execute("SELECT product_id FROM products WHERE product_id = ?", [product_id]);
        if (prod.length === 0) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Insert ignore
        await pool.execute(
            `INSERT INTO wishlist (customer_id, product_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE product_id = VALUES(product_id)`,
            [customerId, product_id]
        );

        res.status(201).json({ message: "Product added to wishlist!" });
    } catch (error) {
        console.error("Wishlist POST error:", error);
        res.status(500).json({ error: "Could not add to wishlist." });
    }
});

// DELETE /api/wishlist/:id
router.delete("/:id", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const targetId = Number(req.params.id);

        // Allow deleting either by product_id or wishlist_id
        await pool.execute(
            `DELETE FROM wishlist 
             WHERE customer_id = ? AND (wishlist_id = ? OR product_id = ?)`,
            [customerId, targetId, targetId]
        );

        res.json({ message: "Item removed from wishlist." });
    } catch (error) {
        console.error("Wishlist DELETE error:", error);
        res.status(500).json({ error: "Could not remove from wishlist." });
    }
});

module.exports = router;
