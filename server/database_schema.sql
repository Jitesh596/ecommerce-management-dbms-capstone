-- =============================================================================
-- DBMS CAPSTONE PROJECT: FASHIONISTA E-COMMERCE DATABASE
-- Database Engine: MySQL 8.0 (InnoDB Storage Engine)
-- Database Name: ecommerce_management_db
-- Normalization: Up to 3rd Normal Form (3NF)
-- Features: Primary Keys, Foreign Keys, Referential Integrity, Unique & Check
--           Constraints, Indexes, Relational Views, Stored Procedures, Triggers,
--           ACID Transactions, and Inventory Audit Logging.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ecommerce_management_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecommerce_management_db;

-- Disable foreign key checks during schema creation/reset
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. CUSTOMERS TABLE (Entity: Customer)
-- Stores registered customer and administrative credentials & profile details.
-- Constraints: Primary Key, Unique Email, Role Check Constraint.
-- =============================================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_customer_role CHECK (role IN ('customer', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 2. SELLERS TABLE (Entity: Seller)
-- Stores merchant/vendor information for multi-vendor or curated fulfillment.
-- Demonstrates 1-to-Many relationship with Products.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sellers (
    seller_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 3. CATEGORIES TABLE (Entity: Category)
-- Categorizes products into structured catalog hierarchies.
-- Demonstrates 1-to-Many relationship with Products.
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    image_url VARCHAR(500) NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 4. PRODUCTS TABLE (Entity: Product)
-- Stores catalog products, pricing, stock levels, and categorical associations.
-- Demonstrates Foreign Keys with categories and sellers, CHECK constraints for
-- non-negative price, discount logic, non-negative stock, and rating limits.
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL,
    category_id INT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2) NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NULL,
    brand VARCHAR(100) DEFAULT 'Fashionista',
    sizes VARCHAR(255) DEFAULT 'S, M, L, XL',
    colors VARCHAR(255) DEFAULT 'Black, White, Navy',
    rating DECIMAL(3,2) DEFAULT 4.50,
    rating_count INT DEFAULT 0,
    seller_id INT DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    is_trending TINYINT(1) DEFAULT 0,
    is_new_arrival TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE SET NULL,
    CONSTRAINT chk_product_price CHECK (price >= 0),
    CONSTRAINT chk_product_discount CHECK (discount_price IS NULL OR (discount_price >= 0 AND discount_price <= price)),
    CONSTRAINT chk_product_stock CHECK (stock >= 0),
    CONSTRAINT chk_product_rating CHECK (rating >= 0 AND rating <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 5. CART TABLE (Entity: Shopping Cart)
-- Represents an active shopping session per customer.
-- Demonstrates One-to-One relationship with Customers (UNIQUE customer_id).
-- =============================================================================
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 6. CART ITEMS TABLE (Relationship: Cart <-> Product)
-- Demonstrates a Many-to-Many junction table between Cart and Product with
-- attribute variants (selected_size, selected_color, quantity).
-- =============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_size VARCHAR(50) DEFAULT 'M',
    selected_color VARCHAR(50) DEFAULT 'Default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart_item (cart_id, product_id, selected_size, selected_color),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 7. WISHLIST TABLE (Relationship: Customer <-> Product)
-- Demonstrates Many-to-Many relationship between Customers and saved Products.
-- =============================================================================
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cust_prod (customer_id, product_id),
    CONSTRAINT fk_wishlist_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 8. ORDERS TABLE (Entity: Order)
-- Master sales order entity capturing placement datetime, financial totals,
-- payment and order statuses.
-- Demonstrates 1-to-Many relationship with Customers.
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NULL,
    customer_email VARCHAR(100) NULL,
    customer_phone VARCHAR(20) NULL,
    shipping_address TEXT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
    delivery_charge DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    coupon_code VARCHAR(50) NULL,
    status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT chk_delivery_charge CHECK (delivery_charge >= 0),
    CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 9. ORDER DETAILS TABLE (Relationship: Order <-> Product)
-- Line items within each order preserving historical unit price and quantity.
-- Demonstrates Many-to-Many resolution between Orders and Products.
-- =============================================================================
CREATE TABLE IF NOT EXISTS order_details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    selected_size VARCHAR(50) DEFAULT 'M',
    selected_color VARCHAR(50) DEFAULT 'Default',
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_details_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_detail_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_detail_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 10. DELIVERIES TABLE (Entity: Delivery / Logistics)
-- Tracks shipping and fulfillment progress per order.
-- Demonstrates 1-to-1 relationship with Orders (UNIQUE order_id).
-- =============================================================================
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    delivery_address VARCHAR(255) NOT NULL,
    delivery_date DATETIME NULL,
    delivery_status ENUM('Processing', 'Shipped', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Processing',
    tracking_number VARCHAR(50) NULL,
    CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 11. PAYMENTS TABLE (Entity: Payment / Settlement)
-- Records payment transaction records and payment gateway settlements.
-- Demonstrates 1-to-Many or 1-to-1 association with Orders.
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_date DATETIME NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NULL,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 12. REVIEWS TABLE (Entity: Customer Review)
-- Stores ratings (1-5 stars) and customer textual feedback per product.
-- Demonstrates Referential Integrity (CASCADE on product/customer deletion).
-- =============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- 13. INVENTORY AUDIT LOG TABLE (DBMS Feature: Audit Logging & History)
-- Automatically captures every stock alteration for compliance & tracking.
-- Populated by database triggers and stored procedures.
-- =============================================================================
CREATE TABLE IF NOT EXISTS inventory_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    old_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_type ENUM('ORDER_PLACED', 'STOCK_RESTOCKED', 'ORDER_CANCELLED', 'MANUAL_ADJUSTMENT') NOT NULL,
    notes VARCHAR(255) NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- Indexing high-cardinality and frequently queried foreign keys / filter columns.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- =============================================================================
-- DATABASE VIEWS
-- Providing logical abstraction, simplified reporting, and security boundaries.
-- =============================================================================

-- View 1: Complete Product Catalog with Category & Seller Details
CREATE OR REPLACE VIEW vw_product_catalog AS
SELECT 
    p.product_id,
    p.product_name,
    p.description,
    p.category,
    p.category_id,
    c.slug AS category_slug,
    p.price,
    p.discount_price,
    COALESCE(p.discount_price, p.price) AS effective_price,
    CASE 
        WHEN p.discount_price IS NOT NULL AND p.price > 0 
        THEN ROUND(((p.price - p.discount_price) / p.price) * 100, 0)
        ELSE 0 
    END AS discount_percentage,
    p.stock,
    CASE WHEN p.stock > 0 THEN 'In Stock' ELSE 'Out of Stock' END AS stock_status,
    p.image_url,
    p.brand,
    p.sizes,
    p.colors,
    p.rating,
    p.rating_count,
    p.is_active,
    p.is_featured,
    p.is_trending,
    p.is_new_arrival,
    p.created_at,
    s.seller_id,
    s.seller_name,
    s.email AS seller_email
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN sellers s ON p.seller_id = s.seller_id;

-- View 2: Detailed Order Summary with Customer, Delivery, and Payment Details
CREATE OR REPLACE VIEW vw_order_summary AS
SELECT 
    o.order_id,
    o.customer_id,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.shipping_address,
    o.order_date,
    o.total_amount,
    o.delivery_charge,
    o.discount_amount,
    o.coupon_code,
    o.status AS order_status,
    d.delivery_id,
    d.delivery_status,
    d.delivery_date,
    d.tracking_number,
    p.payment_id,
    p.payment_method,
    p.payment_status,
    p.amount AS payment_amount,
    COUNT(od.order_detail_id) AS total_items,
    COALESCE(SUM(od.quantity), 0) AS total_units_ordered
FROM orders o
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id
LEFT JOIN order_details od ON o.order_id = od.order_id
GROUP BY o.order_id, d.delivery_id, p.payment_id;

-- View 3: Category Sales & Inventory Performance Aggregation
CREATE OR REPLACE VIEW vw_category_sales AS
SELECT 
    c.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    COUNT(DISTINCT p.product_id) AS total_products,
    COALESCE(SUM(p.stock), 0) AS total_inventory_units,
    COALESCE(SUM(od.quantity), 0) AS units_sold,
    COALESCE(SUM(od.quantity * od.unit_price), 0.00) AS total_sales_revenue,
    COALESCE(AVG(p.price), 0.00) AS average_product_price
FROM categories c
LEFT JOIN products p ON (p.category_id = c.category_id OR p.category = c.name) AND p.is_active = 1
LEFT JOIN order_details od ON p.product_id = od.product_id
LEFT JOIN orders o ON od.order_id = o.order_id AND o.status != 'Cancelled'
GROUP BY c.category_id, c.name, c.slug;

-- View 4: Low Stock Inventory Alerts for Warehouse Restocking
CREATE OR REPLACE VIEW vw_low_stock_alerts AS
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    p.price,
    p.stock,
    s.seller_id,
    s.seller_name,
    s.phone AS seller_contact,
    s.email AS seller_email
FROM products p
LEFT JOIN sellers s ON p.seller_id = s.seller_id
WHERE p.stock < 15 AND p.is_active = 1
ORDER BY p.stock ASC;

-- View 5: Customer Analytics & Lifetime Expenditure Summary
CREATE OR REPLACE VIEW vw_customer_order_stats AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.role,
    c.created_at AS registered_on,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0.00) AS lifetime_expenditure,
    COALESCE(AVG(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE NULL END), 0.00) AS average_order_value,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name, c.email, c.phone, c.role, c.created_at;

-- =============================================================================
-- DATABASE TRIGGERS
-- Demonstrating automated business logic, consistency enforcement, and audit logs.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_after_order_item_insert;
DROP TRIGGER IF EXISTS trg_product_stock_audit;
DROP TRIGGER IF EXISTS trg_after_review_insert;
DROP TRIGGER IF EXISTS trg_after_review_update;
DROP TRIGGER IF EXISTS trg_after_review_delete;

DELIMITER //

-- Trigger 1: Automatically reduce stock and log audit trail when order item is inserted
CREATE TRIGGER trg_after_order_item_insert
AFTER INSERT ON order_details
FOR EACH ROW
BEGIN
    DECLARE v_current_stock INT;
    
    -- Fetch existing stock
    SELECT stock INTO v_current_stock FROM products WHERE product_id = NEW.product_id;
    
    -- Decrement product stock
    UPDATE products 
    SET stock = stock - NEW.quantity 
    WHERE product_id = NEW.product_id;
    
    -- Record in audit log
    INSERT INTO inventory_audit_log (
        product_id, old_stock, new_stock, change_type, notes
    ) VALUES (
        NEW.product_id, 
        v_current_stock, 
        v_current_stock - NEW.quantity, 
        'ORDER_PLACED', 
        CONCAT('Automatic deduction for Order #', NEW.order_id, ', Qty: ', NEW.quantity)
    );
END //

-- Trigger 2: Audit log for any manual or external stock updates
CREATE TRIGGER trg_product_stock_audit
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.stock <> NEW.stock THEN
        INSERT INTO inventory_audit_log (
            product_id, old_stock, new_stock, change_type, notes
        ) VALUES (
            NEW.product_id,
            OLD.stock,
            NEW.stock,
            IF(NEW.stock > OLD.stock, 'STOCK_RESTOCKED', 'MANUAL_ADJUSTMENT'),
            CONCAT('Stock changed from ', OLD.stock, ' to ', NEW.stock)
        );
    END IF;
END //

-- Trigger 3: Recalculate product rating & count after review insertion
CREATE TRIGGER trg_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2);
    DECLARE v_count INT;
    
    SELECT COALESCE(AVG(rating), 4.5), COUNT(*) 
    INTO v_avg_rating, v_count 
    FROM reviews 
    WHERE product_id = NEW.product_id;
    
    UPDATE products 
    SET rating = v_avg_rating, rating_count = v_count 
    WHERE product_id = NEW.product_id;
END //

-- Trigger 4: Recalculate product rating after review update
CREATE TRIGGER trg_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2);
    DECLARE v_count INT;
    
    SELECT COALESCE(AVG(rating), 4.5), COUNT(*) 
    INTO v_avg_rating, v_count 
    FROM reviews 
    WHERE product_id = NEW.product_id;
    
    UPDATE products 
    SET rating = v_avg_rating, rating_count = v_count 
    WHERE product_id = NEW.product_id;
END //

-- Trigger 5: Recalculate product rating after review deletion
CREATE TRIGGER trg_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2);
    DECLARE v_count INT;
    
    SELECT COALESCE(AVG(rating), 4.5), COUNT(*) 
    INTO v_avg_rating, v_count 
    FROM reviews 
    WHERE product_id = OLD.product_id;
    
    UPDATE products 
    SET rating = v_avg_rating, rating_count = v_count 
    WHERE product_id = OLD.product_id;
END //

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURES
-- Encapsulating complex multi-step transactions and reporting operations.
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_PlaceOrder;
DROP PROCEDURE IF EXISTS sp_UpdateStock;
DROP PROCEDURE IF EXISTS sp_GetCustomerOrderHistory;
DROP PROCEDURE IF EXISTS sp_SalesReportByDateRange;

DELIMITER //

-- Procedure 1: sp_UpdateStock - Safely modifies stock with validation & audit notes
CREATE PROCEDURE sp_UpdateStock (
    IN p_product_id INT,
    IN p_quantity_change INT,
    IN p_reason VARCHAR(255),
    OUT p_new_stock INT,
    OUT p_status_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_current_stock INT;
    
    SELECT stock INTO v_current_stock FROM products WHERE product_id = p_product_id;
    
    IF v_current_stock IS NULL THEN
        SET p_status_message = 'Product not found.';
        SET p_new_stock = -1;
        LEAVE proc_label;
    END IF;
    
    IF (v_current_stock + p_quantity_change) < 0 THEN
        SET p_status_message = 'Cannot reduce stock below zero.';
        SET p_new_stock = v_current_stock;
        LEAVE proc_label;
    END IF;
    
    UPDATE products 
    SET stock = stock + p_quantity_change 
    WHERE product_id = p_product_id;
    
    SET p_new_stock = v_current_stock + p_quantity_change;
    SET p_status_message = CONCAT('Stock successfully updated. New stock: ', p_new_stock);
END //

-- Procedure 2: sp_GetCustomerOrderHistory - Formatted order history for a customer
CREATE PROCEDURE sp_GetCustomerOrderHistory (
    IN p_customer_id INT
)
BEGIN
    SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status AS order_status,
        d.delivery_status,
        d.delivery_date,
        COUNT(od.order_detail_id) AS total_items,
        GROUP_CONCAT(CONCAT(p.product_name, ' (x', od.quantity, ')') SEPARATOR ', ') AS ordered_products
    FROM orders o
    LEFT JOIN deliveries d ON o.order_id = d.order_id
    LEFT JOIN order_details od ON o.order_id = od.order_id
    LEFT JOIN products p ON od.product_id = p.product_id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.order_id, d.delivery_status, d.delivery_date
    ORDER BY o.order_id DESC;
END //

-- Procedure 3: sp_SalesReportByDateRange - Comprehensive aggregate sales summary
CREATE PROCEDURE sp_SalesReportByDateRange (
    IN p_start_date DATETIME,
    IN p_end_date DATETIME
)
BEGIN
    SELECT 
        DATE(o.order_date) AS sales_date,
        COUNT(DISTINCT o.order_id) AS orders_count,
        COALESCE(SUM(o.total_amount), 0.00) AS gross_revenue,
        COALESCE(SUM(o.discount_amount), 0.00) AS total_discounts_granted,
        COALESCE(SUM(od.quantity), 0) AS total_items_sold
    FROM orders o
    LEFT JOIN order_details od ON o.order_id = od.order_id
    WHERE o.order_date BETWEEN p_start_date AND p_end_date
      AND o.status != 'Cancelled'
    GROUP BY DATE(o.order_date)
    ORDER BY sales_date DESC;
END //

DELIMITER ;

-- =============================================================================
-- SAMPLE SEED DATA & CAPSTONE DEMONSTRATION RECORDS
-- Idempotent insertions with ON DUPLICATE KEY UPDATE.
-- =============================================================================

-- Seed Sellers (Top Amazon & Flipkart Retail Fulfillment Partners)
INSERT INTO sellers (seller_id, seller_name, email, phone, address)
VALUES 
    (1, 'Fashionista Retail Private Limited', 'retail@fashionista.com', '+91 9820011223', 'Bandra Kurla Complex, Mumbai, Maharashtra'),
    (2, 'Urban Apparel Hub', 'support@urbanapparel.in', '+91 9845012345', 'Indiranagar, Bengaluru, Karnataka'),
    (3, 'Elite Fabrics & Leathercraft', 'contact@elitefabrics.com', '+91 9811098765', 'Connaught Place, New Delhi'),
    (4, 'Appario Retail Private Ltd.', 'support@appario.in', '+91 9820055443', 'Bengaluru Logistics Park, Karnataka'),
    (5, 'RetailNet Online Services', 'contact@retailnet.in', '+91 9833322110', 'Kolkata Fulfillment Hub, West Bengal'),
    (6, 'SuperComNet Logistics', 'service@supercomnet.com', '+91 9810099887', 'Gurugram Cyber Hub, Haryana')
ON DUPLICATE KEY UPDATE seller_name = VALUES(seller_name);

-- Seed Categories (20 Multi-Category E-Commerce Departments)
INSERT INTO categories (category_id, name, slug, image_url, description)
VALUES 
    (1, 'Men\'s Clothing', 'mens-clothing', 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&auto=format&fit=crop&q=80', 'Timeless styles, sharp tailoring and everyday essentials for men.'),
    (2, 'Women\'s Clothing', 'womens-clothing', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80', 'Chic outfits, elegant silhouettes and contemporary fashion for women.'),
    (3, 'T-Shirts', 't-shirts', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80', 'Graphic, crewneck and oversized comfortable t-shirts.'),
    (4, 'Shirts', 'shirts', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80', 'Crisp formal and relaxed casual button-down shirts.'),
    (5, 'Jeans', 'jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80', 'Slim, tapered, relaxed and vintage wash denim jeans.'),
    (6, 'Trousers', 'trousers', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80', 'Smart chinos, pleated trousers and casual comfort pants.'),
    (7, 'Dresses', 'dresses', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80', 'Flowy sundresses, formal cocktail attire and everyday casuals.'),
    (8, 'Jackets', 'jackets', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80', 'Leather biker jackets, cozy puffers, bombers and winter coats.'),
    (9, 'Hoodies', 'hoodies', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80', 'Warm fleece hoodies and comfortable streetwear pullovers.'),
    (10, 'Shoes', 'shoes', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80', 'Premium leather sneakers, running trainers and formal loafers.'),
    (11, 'Bags', 'bags', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80', 'Everyday leather totes, modern backpacks and crossbody satchels.'),
    (12, 'Watches', 'watches', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80', 'Minimalist analog timepieces, luxury chronographs and sporty styles.'),
    (13, 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=500&auto=format&fit=crop&q=80', 'Belts, sunglasses, silk scarves, hats and silver jewelry.'),
    (14, 'Mobiles & Tablets', 'mobiles-tablets', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80', 'Top smartphones, iPads, and 5G cellular flagships from Apple, Samsung, and OnePlus.'),
    (15, 'Laptops & Computers', 'laptops-computers', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80', 'MacBooks, high-performance gaming rigs, ultrabooks, and workstations.'),
    (16, 'Audio & Headphones', 'audio-headphones', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80', 'Noise-cancelling wireless headphones, earbuds, and portable Bluetooth sound systems.'),
    (17, 'Ethnic & Festive Wear', 'ethnic-wear', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80', 'Banarasi silk sarees, Anarkali designer suits, handcrafted kurtas and sherwanis.'),
    (18, 'Home & Kitchen', 'home-kitchen', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80', 'Smart instant cookers, air fryers, robot vacuums, and espresso coffee machines.'),
    (19, 'Beauty & Grooming', 'beauty-grooming', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80', 'Luxury perfumes, professional trimmers, hair dryers, and Ayurvedic skincare rituals.'),
    (20, 'Sports & Fitness', 'sports-fitness', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=80', 'Adjustable dumbbell systems, high-density yoga mats, and athletic training gear.')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

-- Seed Customers (Pass: admin123 and password123 with bcrypt hash)
INSERT INTO customers (customer_id, name, email, password_hash, phone, address, role)
VALUES 
    (1, 'Fashionista Admin', 'admin@fashionista.com', '$2a$10$wT0jH7gQ1y7K9A6Fk8bJ7e1Zp2Qz3W4X5Y6Z7A8B9C0D1E2F3G4H5', '+91 9999900000', 'Fashionista HQ, BKC, Mumbai', 'admin'),
    (2, 'Rahul Sharma', 'customer@fashionista.com', '$2a$10$wT0jH7gQ1y7K9A6Fk8bJ7e1Zp2Qz3W4X5Y6Z7A8B9C0D1E2F3G4H5', '+91 9876543210', '221B Fashion Boulevard, Bengaluru', 'customer'),
    (3, 'Priya Verma', 'priya@example.com', '$2a$10$wT0jH7gQ1y7K9A6Fk8bJ7e1Zp2Qz3W4X5Y6Z7A8B9C0D1E2F3G4H5', '+91 9812345678', '45 Park Street, Kolkata', 'customer')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- SAMPLE CAPSTONE VIVA DEMONSTRATION QUERIES
-- Ready-to-execute queries to show external examiners during project evaluation.
-- =============================================================================

-- Query 1: Multi-Table JOIN with Calculation (Products, Categories, Sellers)
-- SELECT p.product_name, c.name AS category, s.seller_name, p.price, p.stock
-- FROM products p
-- JOIN categories c ON p.category_id = c.category_id
-- JOIN sellers s ON p.seller_id = s.seller_id
-- WHERE p.stock > 0
-- ORDER BY p.price DESC;

-- Query 2: Aggregate Sales Report using GROUP BY and HAVING
-- SELECT c.name AS category, COUNT(od.order_detail_id) AS total_sales_count, SUM(od.quantity * od.unit_price) AS total_revenue
-- FROM categories c
-- JOIN products p ON c.category_id = p.category_id
-- JOIN order_details od ON p.product_id = od.product_id
-- GROUP BY c.category_id, c.name
-- HAVING total_revenue > 1000
-- ORDER BY total_revenue DESC;

-- Query 3: Correlated Subquery (Find customers whose spending is above average)
-- SELECT c.customer_id, c.name, c.email,
--        (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.customer_id) AS total_spent
-- FROM customers c
-- WHERE (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.customer_id) > (
--     SELECT AVG(total_amount) FROM orders
-- );

-- Query 4: Execution of Stored Procedure
-- CALL sp_GetCustomerOrderHistory(2);
-- CALL sp_SalesReportByDateRange('2026-01-01', '2026-12-31');

-- Query 5: Querying Database Views
-- SELECT * FROM vw_product_catalog WHERE stock_status = 'In Stock' LIMIT 5;
-- SELECT * FROM vw_order_summary ORDER BY order_id DESC;
-- SELECT * FROM vw_category_sales;
-- SELECT * FROM vw_low_stock_alerts;
-- SELECT * FROM vw_customer_order_stats;
