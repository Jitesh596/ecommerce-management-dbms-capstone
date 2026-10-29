-- ============================================================================
-- Fashionista E-Commerce Management Database System
-- Capstone Project: Phase 3 Analytical SQL Reports
-- Team: Nikhil Kumar Singh (2501010151), Jitesh Kumar (2501010180)
-- Target Database: ecommerce_management_db (MySQL 8.0+)
-- ============================================================================

USE `ecommerce_management_db`;

-- ----------------------------------------------------------------------------
-- Report 1: Product Catalogue with Seller Information
-- ----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    p.price,
    p.stock,
    s.seller_name,
    s.email AS seller_email,
    s.phone AS seller_phone
FROM products p
JOIN sellers s ON p.seller_id = s.seller_id
WHERE p.is_active = 1
ORDER BY p.category, p.price ASC;

-- ----------------------------------------------------------------------------
-- Report 2: Monthly Sales Summary
-- ----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(o.order_date, '%Y-%m') AS sale_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0.00) AS gross_sales,
    COALESCE(SUM(CASE WHEN p.payment_status = 'Paid' THEN p.amount ELSE 0 END), 0.00) AS realized_paid_sales,
    COALESCE(AVG(o.total_amount), 0.00) AS average_order_value
FROM orders o
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE o.status != 'Cancelled'
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY sale_month DESC;

-- ----------------------------------------------------------------------------
-- Report 3: Order History for Each Customer
-- ----------------------------------------------------------------------------
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0.00) AS cumulative_spent,
    MAX(o.order_date) AS most_recent_order
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.role = 'customer'
GROUP BY c.customer_id, c.name, c.email, c.phone
ORDER BY cumulative_spent DESC;

-- ----------------------------------------------------------------------------
-- Report 4: Top-Selling Fashion Products by Volume and Revenue
-- ----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    p.price,
    COALESCE(SUM(od.quantity), 0) AS units_sold,
    COALESCE(SUM(od.quantity * od.unit_price), 0.00) AS gross_revenue
FROM products p
JOIN order_details od ON p.product_id = od.product_id
JOIN orders o ON od.order_id = o.order_id
WHERE o.status != 'Cancelled'
GROUP BY p.product_id, p.product_name, p.category, p.price
ORDER BY units_sold DESC, gross_revenue DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- Report 5: Low-Stock Products Requiring Reordering
-- ----------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    p.price,
    p.stock,
    s.seller_name,
    s.phone AS seller_contact
FROM products p
JOIN sellers s ON p.seller_id = s.seller_id
WHERE p.stock <= 15 AND p.is_active = 1
ORDER BY p.stock ASC;

-- ----------------------------------------------------------------------------
-- Report 6: Orders Grouped by Status
-- ----------------------------------------------------------------------------
SELECT 
    status AS order_status,
    COUNT(*) AS total_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS percentage,
    COALESCE(SUM(total_amount), 0.00) AS aggregate_order_value
FROM orders
GROUP BY status
ORDER BY total_count DESC;

-- ----------------------------------------------------------------------------
-- Report 7: Payments Grouped by Status and Settlement Method
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(payment_method, 'Unspecified') AS payment_method,
    payment_status,
    COUNT(*) AS transactions_count,
    COALESCE(SUM(amount), 0.00) AS total_amount
FROM payments
GROUP BY payment_method, payment_status
ORDER BY payment_status, transactions_count DESC;

-- ----------------------------------------------------------------------------
-- Report 8: Performance and Sales Revenue by Seller
-- ----------------------------------------------------------------------------
SELECT 
    s.seller_id,
    s.seller_name,
    s.email,
    COUNT(DISTINCT od.order_id) AS distinct_orders_supplied,
    COALESCE(SUM(od.quantity), 0) AS total_items_sold,
    COALESCE(SUM(od.quantity * od.unit_price), 0.00) AS total_sales_revenue
FROM sellers s
LEFT JOIN products p ON s.seller_id = p.seller_id
LEFT JOIN order_details od ON p.product_id = od.product_id
LEFT JOIN orders o ON od.order_id = o.order_id AND o.status != 'Cancelled'
GROUP BY s.seller_id, s.seller_name, s.email
ORDER BY total_sales_revenue DESC;

-- ----------------------------------------------------------------------------
-- Report 9: Comprehensive Customer Order Audit Trail
-- ----------------------------------------------------------------------------
SELECT 
    o.order_id,
    o.order_date,
    o.status AS order_status,
    c.name AS customer_name,
    c.email AS customer_email,
    p.product_name,
    od.quantity,
    od.unit_price,
    ROUND(od.quantity * od.unit_price, 2) AS item_subtotal,
    COALESCE(d.delivery_status, 'Unscheduled') AS delivery_status,
    COALESCE(pay.payment_status, 'Unpaid') AS payment_status,
    COALESCE(pay.payment_method, 'N/A') AS payment_method
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_details od ON o.order_id = od.order_id
JOIN products p ON od.product_id = p.product_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments pay ON o.order_id = pay.order_id
ORDER BY o.order_id DESC, od.order_detail_id ASC;

-- ----------------------------------------------------------------------------
-- Report 10: Order Subtotals and Demonstration GST Computation via SQL Functions
-- ----------------------------------------------------------------------------
SELECT 
    o.order_id,
    c.name AS customer_name,
    o.order_date,
    o.status,
    fn_calculate_order_subtotal(o.order_id) AS calculated_subtotal,
    fn_calculate_gst(fn_calculate_order_subtotal(o.order_id), 18.00) AS demo_gst_18pct,
    ROUND(fn_calculate_order_subtotal(o.order_id) + fn_calculate_gst(fn_calculate_order_subtotal(o.order_id), 18.00), 2) AS total_with_gst,
    o.total_amount AS stored_order_total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id DESC;
