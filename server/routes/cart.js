const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser } = require("../middleware/auth");

// Helper: Get or create cart for user
async function getOrCreateCart(customerId) {
    const [rows] = await pool.execute("SELECT cart_id FROM cart WHERE customer_id = ?", [customerId]);
    if (rows.length > 0) {
        return rows[0].cart_id;
    }
    const [res] = await pool.execute("INSERT INTO cart (customer_id) VALUES (?)", [customerId]);
    return res.insertId;
}

// GET /api/cart
router.get("/", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const cartId = await getOrCreateCart(customerId);

        const [items] = await pool.execute(`
            SELECT 
                ci.cart_item_id,
                ci.cart_id,
                ci.product_id,
                ci.quantity,
                ci.selected_size,
                ci.selected_color,
                p.product_name,
                p.price,
                p.discount_price,
                p.stock,
                p.image_url,
                p.category,
                p.brand
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
            ORDER BY ci.cart_item_id DESC
        `, [cartId]);

        // Calculate subtotals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const unitPrice = item.discount_price !== null ? Number(item.discount_price) : Number(item.price);
            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;
            return {
                ...item,
                effective_price: unitPrice,
                item_total: itemTotal,
                in_stock: item.stock >= item.quantity
            };
        });

        res.json({
            cart_id: cartId,
            items: processedItems,
            item_count: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: subtotal
        });
    } catch (error) {
        console.error("Cart GET error:", error);
        res.status(500).json({ error: "Could not fetch cart items." });
    }
});

// POST /api/cart - Add item
router.post("/", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const { product_id, quantity = 1, selected_size, selected_color } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required." });
        }

        const qty = Math.max(1, Number(quantity) || 1);
        const size = selected_size || "M";
        const color = selected_color || "Default";

        // Validate product & stock
        const [prodRows] = await pool.execute(
            "SELECT product_id, product_name, stock, is_active FROM products WHERE product_id = ?",
            [product_id]
        );

        if (prodRows.length === 0 || !prodRows[0].is_active) {
            return res.status(404).json({ error: "Product not available." });
        }

        const product = prodRows[0];
        if (product.stock < qty) {
            return res.status(400).json({ error: `Only ${product.stock} units available in stock.` });
        }

        const cartId = await getOrCreateCart(customerId);

        // Check if item with same product, size, and color already in cart
        const [existing] = await pool.execute(
            `SELECT cart_item_id, quantity FROM cart_items 
             WHERE cart_id = ? AND product_id = ? AND selected_size = ? AND selected_color = ?`,
            [cartId, product_id, size, color]
        );

        if (existing.length > 0) {
            const newQty = existing[0].quantity + qty;
            if (newQty > product.stock) {
                return res.status(400).json({ error: `Cannot add more. Maximum available stock is ${product.stock}.` });
            }

            await pool.execute(
                "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
                [newQty, existing[0].cart_item_id]
            );
        } else {
            await pool.execute(
                `INSERT INTO cart_items (cart_id, product_id, quantity, selected_size, selected_color)
                 VALUES (?, ?, ?, ?, ?)`,
                [cartId, product_id, qty, size, color]
            );
        }

        res.status(201).json({ message: "Product added to cart!" });
    } catch (error) {
        console.error("Cart POST error:", error);
        res.status(500).json({ error: "Could not add product to cart." });
    }
});

// PUT /api/cart/:id - Update item quantity
router.put("/:id", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const cartItemId = Number(req.params.id);
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({ error: "Quantity is required." });
        }

        const newQty = Number(quantity);
        const cartId = await getOrCreateCart(customerId);

        // Ensure item belongs to user's cart
        const [itemRows] = await pool.execute(
            `SELECT ci.*, p.stock 
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.cart_item_id = ? AND ci.cart_id = ?`,
            [cartItemId, cartId]
        );

        if (itemRows.length === 0) {
            return res.status(404).json({ error: "Cart item not found." });
        }

        if (newQty <= 0) {
            await pool.execute("DELETE FROM cart_items WHERE cart_item_id = ?", [cartItemId]);
            return res.json({ message: "Item removed from cart." });
        }

        if (newQty > itemRows[0].stock) {
            return res.status(400).json({ error: `Cannot set quantity to ${newQty}. Only ${itemRows[0].stock} in stock.` });
        }

        await pool.execute("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?", [newQty, cartItemId]);

        res.json({ message: "Cart item quantity updated." });
    } catch (error) {
        console.error("Cart PUT error:", error);
        res.status(500).json({ error: "Could not update cart item." });
    }
});

// DELETE /api/cart/:id - Remove item
router.delete("/:id", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const cartItemId = Number(req.params.id);
        const cartId = await getOrCreateCart(customerId);

        const [result] = await pool.execute(
            "DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?",
            [cartItemId, cartId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cart item not found." });
        }

        res.json({ message: "Item removed from cart." });
    } catch (error) {
        console.error("Cart DELETE item error:", error);
        res.status(500).json({ error: "Could not remove cart item." });
    }
});

// DELETE /api/cart - Clear entire cart
router.delete("/", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const cartId = await getOrCreateCart(customerId);

        await pool.execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
        res.json({ message: "Cart cleared." });
    } catch (error) {
        console.error("Cart DELETE clear error:", error);
        res.status(500).json({ error: "Could not clear cart." });
    }
});

module.exports = router;
