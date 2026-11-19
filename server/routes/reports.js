const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

// GET /api/reports/dashboard
router.get("/dashboard", authenticateUser, requireAdmin, async (req, res) => {
    try {
        // Total products count
        const [prodCount] = await pool.query("SELECT COUNT(*) AS total_products FROM products WHERE is_active = 1");
        
        // Total customers count
        const [custCount] = await pool.query("SELECT COUNT(*) AS total_customers FROM customers WHERE role = 'customer'");

        // Total orders count
        const [orderCount] = await pool.query("SELECT COUNT(*) AS total_orders FROM orders");

        // Total sales revenue (orders not cancelled)
        const [salesSum] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE status != 'Cancelled'");

        // Low stock products count (stock < 15)
        const [lowStock] = await pool.query("SELECT COUNT(*) AS low_stock_count FROM products WHERE stock < 15 AND is_active = 1");

        // Recent 5 orders
        const [recentOrders] = await pool.query(`
            SELECT order_id, customer_name, total_amount, status, payment_status, order_date
            FROM orders
            ORDER BY order_id DESC
            LIMIT 5
        `);

        // Category breakdown
        const [categoryBreakdown] = await pool.query(`
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE is_active = 1 
            GROUP BY category
            ORDER BY count DESC
        `);

        res.json({
            stats: {
                total_products: prodCount[0].total_products,
                total_customers: custCount[0].total_customers,
                total_orders: orderCount[0].total_orders,
                total_sales: Number(salesSum[0].total_sales),
                low_stock_products: lowStock[0].low_stock_count
            },
            recent_orders: recentOrders,
            category_breakdown: categoryBreakdown
        });
    } catch (error) {
        console.error("Dashboard report error:", error);
        res.status(500).json({ error: "Could not generate dashboard statistics." });
    }
});

// GET /api/reports/sales
router.get("/sales", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const [salesByStatus] = await pool.query(`
            SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            GROUP BY status
        `);

        const [monthlySales] = await pool.query(`
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m') AS month,
                COUNT(*) AS order_count,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM orders
            WHERE status != 'Cancelled'
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({
            by_status: salesByStatus,
            monthly: monthlySales
        });
    } catch (error) {
        console.error("Sales report error:", error);
        res.status(500).json({ error: "Could not fetch sales report." });
    }
});

// GET /api/reports/products
router.get("/products", authenticateUser, requireAdmin, async (req, res) => {
    try {
        // Low stock products list
        const [lowStockList] = await pool.query(`
            SELECT product_id, product_name, category, price, stock, is_active
            FROM products
            WHERE stock < 15 AND is_active = 1
            ORDER BY stock ASC
        `);

        // Top selling products by order quantity
        const [topSelling] = await pool.query(`
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                p.price,
                p.image_url,
                COALESCE(SUM(od.quantity), 0) AS units_sold,
                COALESCE(SUM(od.quantity * od.unit_price), 0) AS total_revenue
            FROM products p
            JOIN order_details od ON p.product_id = od.product_id
            JOIN orders o ON od.order_id = o.order_id AND o.status != 'Cancelled'
            GROUP BY p.product_id
            ORDER BY units_sold DESC
            LIMIT 10
        `);

        res.json({
            low_stock: lowStockList,
            top_selling: topSelling
        });
    } catch (error) {
        console.error("Products report error:", error);
        res.status(500).json({ error: "Could not fetch products report." });
    }
});

// GET /api/reports/customers - Customer management list
router.get("/customers", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT 
                c.customer_id,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.role,
                c.created_at,
                (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.customer_id = c.customer_id AND o.status != 'Cancelled') AS total_spent
            FROM customers c
            ORDER BY c.customer_id DESC
        `);

        res.json(customers);
    } catch (error) {
        console.error("Customers list error:", error);
        res.status(500).json({ error: "Could not fetch customer list." });
    }
});

module.exports = router;
