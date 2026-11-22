const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

// GET /api/reports/dashboard - Utilizes Views vw_category_sales and vw_order_summary
router.get("/dashboard", authenticateUser, requireAdmin, async (req, res) => {
    try {
        // Aggregate statistics using database queries
        const [prodCount] = await pool.query("SELECT COUNT(*) AS total_products FROM products WHERE is_active = 1");
        const [custCount] = await pool.query("SELECT COUNT(*) AS total_customers FROM customers WHERE role = 'customer'");
        const [orderCount] = await pool.query("SELECT COUNT(*) AS total_orders FROM orders");
        const [salesSum] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE status != 'Cancelled'");
        const [lowStock] = await pool.query("SELECT COUNT(*) AS low_stock_count FROM vw_low_stock_alerts");

        // Recent 5 orders retrieved via Database View: vw_order_summary
        const [recentOrders] = await pool.query(`
            SELECT order_id, customer_name, total_amount, order_status AS status, payment_status, order_date
            FROM vw_order_summary
            ORDER BY order_id DESC
            LIMIT 5
        `);

        // Category breakdown retrieved via Database View: vw_category_sales
        const [categoryBreakdown] = await pool.query(`
            SELECT category_name AS category, total_products AS count, total_sales_revenue AS revenue
            FROM vw_category_sales
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

// GET /api/reports/sales - Aggregates orders & monthly revenue
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

// GET /api/reports/products - Utilizes View vw_low_stock_alerts and aggregate JOIN query
router.get("/products", authenticateUser, requireAdmin, async (req, res) => {
    try {
        // Query database view for low stock alerts
        const [lowStockList] = await pool.query(`
            SELECT product_id, product_name, category, price, stock, seller_name, seller_contact
            FROM vw_low_stock_alerts
        `);

        // Top selling products by order quantity via SQL JOIN and GROUP BY
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
            GROUP BY p.product_id, p.product_name, p.category, p.price, p.image_url
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

// GET /api/reports/customers - Customer Analytics via Database View: vw_customer_order_stats
router.get("/customers", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT 
                customer_id,
                customer_name AS name,
                customer_email AS email,
                customer_phone AS phone,
                role,
                registered_on AS created_at,
                total_orders,
                lifetime_expenditure AS total_spent,
                average_order_value,
                last_order_date
            FROM vw_customer_order_stats
            ORDER BY customer_id DESC
        `);

        res.json(customers);
    } catch (error) {
        console.error("Customers list error:", error);
        res.status(500).json({ error: "Could not fetch customer list." });
    }
});

// GET /api/reports/audit-log - DBMS Feature: View automated stock change audit log
router.get("/audit-log", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT 
                l.log_id,
                l.product_id,
                p.product_name,
                l.old_stock,
                l.new_stock,
                l.change_type,
                l.notes,
                l.logged_at
            FROM inventory_audit_log l
            JOIN products p ON l.product_id = p.product_id
            ORDER BY l.log_id DESC
            LIMIT 50
        `);
        res.json(logs);
    } catch (error) {
        console.error("Audit log error:", error);
        res.status(500).json({ error: "Could not fetch inventory audit log." });
    }
});

module.exports = router;
