const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

// Valid coupon codes
const VALID_COUPONS = {
    "FASHION20": { discountPercent: 20, maxDiscount: 1000 },
    "FIRST50": { discountFixed: 50 },
    "SUMMER15": { discountPercent: 15, maxDiscount: 750 }
};

// GET /api/orders - Get orders list
router.get("/", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        let query = `
            SELECT 
                o.order_id,
                o.customer_id,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.shipping_address,
                o.order_date,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.delivery_charge,
                o.discount_amount,
                o.coupon_code,
                o.status,
                d.delivery_status,
                d.delivery_date,
                (SELECT COUNT(*) FROM order_details od WHERE od.order_id = o.order_id) AS total_items
            FROM orders o
            LEFT JOIN deliveries d ON o.order_id = d.order_id
        `;
        const params = [];

        // If not admin, only fetch customer's own orders
        if (user.role !== "admin") {
            query += " WHERE o.customer_id = ?";
            params.push(user.customer_id);
        }

        query += " ORDER BY o.order_id DESC";

        const [orders] = await pool.query(query, params);
        res.json(orders);
    } catch (error) {
        console.error("Orders list error:", error);
        res.status(500).json({ error: "Could not fetch orders." });
    }
});

// GET /api/orders/:id - Get single order details
router.get("/:id", authenticateUser, async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const user = req.user;

        const [orderRows] = await pool.execute(`
            SELECT 
                o.*,
                d.delivery_id,
                d.delivery_status,
                d.delivery_date,
                p.payment_id,
                p.payment_method AS verified_payment_method,
                p.payment_status AS verified_payment_status
            FROM orders o
            LEFT JOIN deliveries d ON o.order_id = d.order_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.order_id = ?
        `, [orderId]);

        if (orderRows.length === 0) {
            return res.status(404).json({ error: "Order not found." });
        }

        const order = orderRows[0];

        // Authorization check: Regular customers can ONLY see their own order
        if (user.role !== "admin" && order.customer_id !== user.customer_id) {
            return res.status(403).json({ error: "Access denied. You do not have permission to view this order." });
        }

        // Fetch order items
        const [items] = await pool.execute(`
            SELECT 
                od.order_detail_id,
                od.order_id,
                od.product_id,
                od.quantity,
                od.unit_price,
                od.selected_size,
                od.selected_color,
                p.product_name,
                p.image_url,
                p.category,
                p.brand
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            WHERE od.order_id = ?
        `, [orderId]);

        res.json({
            ...order,
            items
        });
    } catch (error) {
        console.error("Order details error:", error);
        res.status(500).json({ error: "Could not fetch order details." });
    }
});

// POST /api/orders - Place a new order
router.post("/", authenticateUser, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const user = req.user;
        const {
            shipping_address,
            customer_name,
            customer_phone,
            payment_method = "Demo UPI / Card",
            coupon_code,
            items: directItems
        } = req.body;

        if (!shipping_address || !shipping_address.trim()) {
            return res.status(400).json({ error: "Shipping address is required." });
        }

        await conn.beginTransaction();

        let orderItems = [];
        let fromCart = false;

        // If direct items provided, use them; otherwise fetch from user's cart in DB
        if (directItems && Array.isArray(directItems) && directItems.length > 0) {
            orderItems = directItems;
        } else {
            const [cartRows] = await conn.query("SELECT cart_id FROM cart WHERE customer_id = ?", [user.customer_id]);
            if (cartRows.length === 0) {
                await conn.rollback();
                return res.status(400).json({ error: "Shopping cart is empty." });
            }
            const cartId = cartRows[0].cart_id;
            const [ci] = await conn.query(`
                SELECT product_id, quantity, selected_size, selected_color
                FROM cart_items WHERE cart_id = ?
            `, [cartId]);

            if (ci.length === 0) {
                await conn.rollback();
                return res.status(400).json({ error: "Shopping cart is empty." });
            }
            orderItems = ci;
            fromCart = true;
        }

        // Validate stock and calculate verified subtotal
        let subtotal = 0;
        const verifiedItems = [];

        for (const item of orderItems) {
            const [pRows] = await conn.query(
                "SELECT product_id, product_name, price, discount_price, stock, is_active FROM products WHERE product_id = ? FOR UPDATE",
                [item.product_id]
            );

            if (pRows.length === 0 || !pRows[0].is_active) {
                await conn.rollback();
                return res.status(400).json({ error: `Product ID ${item.product_id} is no longer available.` });
            }

            const prod = pRows[0];
            const qty = Number(item.quantity);

            if (prod.stock < qty) {
                await conn.rollback();
                return res.status(400).json({
                    error: `Insufficient stock for "${prod.product_name}". Available: ${prod.stock}, requested: ${qty}.`
                });
            }

            const unitPrice = prod.discount_price !== null ? Number(prod.discount_price) : Number(prod.price);
            subtotal += unitPrice * qty;

            verifiedItems.push({
                product_id: prod.product_id,
                product_name: prod.product_name,
                unit_price: unitPrice,
                quantity: qty,
                selected_size: item.selected_size || "M",
                selected_color: item.selected_color || "Default",
                current_stock: prod.stock
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon_code && VALID_COUPONS[coupon_code.toUpperCase().trim()]) {
            const coupon = VALID_COUPONS[coupon_code.toUpperCase().trim()];
            if (coupon.discountPercent) {
                discountAmount = (subtotal * coupon.discountPercent) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else if (coupon.discountFixed) {
                discountAmount = Math.min(coupon.discountFixed, subtotal);
            }
        }

        // Delivery charges: Free over ₹999, else ₹99
        const deliveryCharge = (subtotal - discountAmount >= 999) ? 0.00 : 99.00;
        const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

        // Determine payment status
        const isCOD = payment_method.toLowerCase().includes("cash");
        const paymentStatus = isCOD ? "Pending" : "Paid";

        // Insert Order
        const [orderResult] = await conn.query(`
            INSERT INTO orders (
                customer_id, customer_name, customer_email, customer_phone,
                shipping_address, order_date, total_amount, payment_method,
                payment_status, delivery_charge, discount_amount, coupon_code, status
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, 'Confirmed')
        `, [
            user.customer_id,
            customer_name || user.name,
            user.email,
            customer_phone || "",
            shipping_address.trim(),
            finalTotal,
            payment_method,
            paymentStatus,
            deliveryCharge,
            discountAmount,
            coupon_code ? coupon_code.toUpperCase().trim() : null
        ]);

        const orderId = orderResult.insertId;

        // Insert Order Details & reduce stock
        for (const item of verifiedItems) {
            await conn.query(`
                INSERT INTO order_details (order_id, product_id, quantity, unit_price, selected_size, selected_color)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, item.product_id, item.quantity, item.unit_price, item.selected_size, item.selected_color]);

            await conn.query(`
                UPDATE products 
                SET stock = stock - ?
                WHERE product_id = ?
            `, [item.quantity, item.product_id]);
        }

        // Insert Payment record
        await conn.query(`
            INSERT INTO payments (order_id, payment_date, amount, payment_method, payment_status)
            VALUES (?, NOW(), ?, ?, ?)
        `, [orderId, finalTotal, payment_method, paymentStatus]);

        // Insert Delivery record
        await conn.query(`
            INSERT INTO deliveries (order_id, delivery_address, delivery_status)
            VALUES (?, ?, 'Processing')
        `, [orderId, shipping_address.trim()]);

        // Clear cart if ordered from cart
        if (fromCart) {
            const [c] = await conn.query("SELECT cart_id FROM cart WHERE customer_id = ?", [user.customer_id]);
            if (c.length > 0) {
                await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [c[0].cart_id]);
            }
        }

        await conn.commit();

        res.status(201).json({
            message: "Order placed successfully! Thank you for shopping with Fashionista.",
            order_id: orderId,
            total_amount: finalTotal,
            status: "Confirmed",
            payment_status: paymentStatus
        });
    } catch (error) {
        await conn.rollback();
        console.error("Order placement error:", error);
        res.status(500).json({ error: "Failed to place order. Please try again." });
    } finally {
        conn.release();
    }
});

// PUT /api/orders/:id/status (Admin Only)
router.put("/:id/status", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { status, delivery_status, payment_status } = req.body;

        const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid order status. Allowed: ${validStatuses.join(", ")}` });
        }

        const [existing] = await pool.execute("SELECT order_id, status FROM orders WHERE order_id = ?", [orderId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Order not found." });
        }

        if (status) {
            await pool.execute("UPDATE orders SET status = ? WHERE order_id = ?", [status, orderId]);
        }
        if (payment_status) {
            await pool.execute("UPDATE orders SET payment_status = ? WHERE order_id = ?", [payment_status, orderId]);
            await pool.execute("UPDATE payments SET payment_status = ? WHERE order_id = ?", [payment_status, orderId]);
        }

        // Update delivery status
        const dStatus = delivery_status || (status === "Delivered" ? "Delivered" : status === "Shipped" ? "Shipped" : null);
        if (dStatus) {
            await pool.execute(`
                UPDATE deliveries 
                SET delivery_status = ?, delivery_date = IF(? = 'Delivered', NOW(), delivery_date)
                WHERE order_id = ?
            `, [dStatus, dStatus, orderId]);
        }

        res.json({ message: "Order status updated successfully!" });
    } catch (error) {
        console.error("Order status update error:", error);
        res.status(500).json({ error: "Could not update order status." });
    }
});

module.exports = router;
