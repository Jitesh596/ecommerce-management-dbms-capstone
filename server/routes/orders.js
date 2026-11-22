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

// GET /api/orders - Get orders list (uses Database View: vw_order_summary)
router.get("/", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        let query = `
            SELECT 
                order_id,
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                shipping_address,
                order_date,
                total_amount,
                delivery_charge,
                discount_amount,
                coupon_code,
                order_status AS status,
                delivery_status,
                delivery_date,
                tracking_number,
                payment_method,
                payment_status,
                total_items,
                total_units_ordered
            FROM vw_order_summary
        `;
        const params = [];

        // If not admin, only fetch customer's own orders
        if (user.role !== "admin") {
            query += " WHERE customer_id = ?";
            params.push(user.customer_id);
        }

        query += " ORDER BY order_id DESC";

        const [orders] = await pool.query(query, params);
        res.json(orders);
    } catch (error) {
        console.error("Orders list error:", error);
        res.status(500).json({ error: "Could not fetch orders from database." });
    }
});

// GET /api/orders/procedure/history - Demonstrates execution of Stored Procedure: sp_GetCustomerOrderHistory
router.get("/procedure/history", authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const [result] = await pool.query("CALL sp_GetCustomerOrderHistory(?)", [customerId]);
        // MySQL stored procedures return an array of recordsets: index 0 contains the rows
        res.json(result[0] || []);
    } catch (error) {
        console.error("Stored procedure history error:", error);
        res.status(500).json({ error: "Could not execute order history stored procedure." });
    }
});

// GET /api/orders/:id - Get single order details with item records
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
                d.tracking_number,
                p.payment_id,
                p.payment_method AS verified_payment_method,
                p.payment_status AS verified_payment_status,
                p.transaction_reference
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

        // Fetch order items with relational product details
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

// POST /api/orders - ACID Transactional Order Placement with Row-Level Locks and Trigger Automation
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

        // START TRANSACTION - ACID compliance
        await conn.beginTransaction();

        let orderItems = [];
        let fromCart = false;

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

        // Validate stock with ROW-LEVEL EXCLUSIVE LOCK (SELECT ... FOR UPDATE)
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

        // Insert Order Record
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

        // Insert Order Details
        // NOTE: Inserting into order_details automatically activates MySQL trigger:
        // 'trg_after_order_item_insert' which reduces products.stock AND logs the
        // transaction in 'inventory_audit_log'.
        for (const item of verifiedItems) {
            await conn.query(`
                INSERT INTO order_details (order_id, product_id, quantity, unit_price, selected_size, selected_color)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, item.product_id, item.quantity, item.unit_price, item.selected_size, item.selected_color]);
        }

        // Insert Payment record
        await conn.query(`
            INSERT INTO payments (order_id, payment_date, amount, payment_method, payment_status, transaction_reference)
            VALUES (?, NOW(), ?, ?, ?, CONCAT('TXN_', ?, '_', UNIX_TIMESTAMP()))
        `, [orderId, finalTotal, payment_method, paymentStatus, orderId]);

        // Insert Delivery record
        await conn.query(`
            INSERT INTO deliveries (order_id, delivery_address, delivery_status, tracking_number)
            VALUES (?, ?, 'Processing', CONCAT('FASH_TRK_', ?, '_', UNIX_TIMESTAMP()))
        `, [orderId, shipping_address.trim(), orderId]);

        // Clear cart if ordered from cart
        if (fromCart) {
            const [c] = await conn.query("SELECT cart_id FROM cart WHERE customer_id = ?", [user.customer_id]);
            if (c.length > 0) {
                await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [c[0].cart_id]);
            }
        }

        // COMMIT TRANSACTION
        await conn.commit();

        res.status(201).json({
            message: "Order placed successfully! Thank you for shopping with Fashionista.",
            order_id: orderId,
            total_amount: finalTotal,
            status: "Confirmed",
            payment_status: paymentStatus
        });
    } catch (error) {
        // ROLLBACK TRANSACTION on any failure
        await conn.rollback();
        console.error("Order placement error:", error);
        res.status(500).json({ error: "Failed to place order. Database transaction rolled back safely." });
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
