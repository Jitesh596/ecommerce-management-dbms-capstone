const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

async function migrateAndSeed() {
    console.log("==================================================================");
    console.log("  FASHIONISTA DBMS CAPSTONE: FULL DATABASE SETUP & SEEDING SCRIPT ");
    console.log("==================================================================");

    const dbConfig = {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        multipleStatements: true
    };

    let tempConn;
    try {
        tempConn = await mysql.createConnection(dbConfig);
        await tempConn.query(`
            CREATE DATABASE IF NOT EXISTS ecommerce_management_db 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ Verified database 'ecommerce_management_db' exists.");
    } catch (e) {
        console.error("Failed to connect to MySQL to verify/create database:", e.message);
        throw e;
    } finally {
        if (tempConn) await tempConn.end();
    }

    const conn = await mysql.createConnection({
        ...dbConfig,
        database: process.env.DB_NAME || "ecommerce_management_db"
    });

    try {
        console.log("Creating tables with primary keys, foreign keys, unique and check constraints...");

        // 1. Customers Table
        await conn.query(`
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
        `);

        // 2. Sellers Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS sellers (
                seller_id INT AUTO_INCREMENT PRIMARY KEY,
                seller_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                phone VARCHAR(20) NULL,
                address VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Categories Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS categories (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                image_url VARCHAR(500) NULL,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 4. Products Table
        await conn.query(`
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
        `);

        // 5. Cart Table (1:1 with Customers)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS cart (
                cart_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 6. Cart Items Table (Many:Many junction between Cart and Products)
        await conn.query(`
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
        `);

        // 7. Wishlist Table (Many:Many between Customer and Products)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_cust_prod (customer_id, product_id),
                CONSTRAINT fk_wishlist_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
                CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 8. Orders Table
        await conn.query(`
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
        `);

        // 9. Order Details Table (Many:Many line items)
        await conn.query(`
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
        `);

        // 10. Deliveries Table (1:1 with Orders)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS deliveries (
                delivery_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL UNIQUE,
                delivery_address VARCHAR(255) NOT NULL,
                delivery_date DATETIME NULL,
                delivery_status ENUM('Processing', 'Shipped', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Processing',
                tracking_number VARCHAR(50) NULL,
                CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 11. Payments Table
        await conn.query(`
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
        `);

        // 12. Reviews Table
        await conn.query(`
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
        `);

        // 13. Inventory Audit Log Table
        await conn.query(`
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
        `);

        console.log("✓ Verified and created all 13 core relational tables.");

        // Create Performance Indexes safely
        const indexQueries = [
            "CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)",
            "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)",
            "CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name)",
            "CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date)",
            "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
            "CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)"
        ];

        for (const iq of indexQueries) {
            try {
                await conn.query(iq);
            } catch (e) {
                // Ignore if duplicate or unsupported IF NOT EXISTS on older subversion
            }
        }
        console.log("✓ Verified query optimization indexes.");

        // =====================================================================
        // VIEWS
        // =====================================================================
        await conn.query(`
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
        `);

        await conn.query(`
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
        `);

        await conn.query(`
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
        `);

        await conn.query(`
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
        `);

        await conn.query(`
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
        `);
        console.log("✓ Created 5 Database Views for reporting and abstraction.");

        // =====================================================================
        // TRIGGERS
        // =====================================================================
        await conn.query("DROP TRIGGER IF EXISTS trg_after_order_item_insert");
        await conn.query(`
            CREATE TRIGGER trg_after_order_item_insert
            AFTER INSERT ON order_details
            FOR EACH ROW
            BEGIN
                DECLARE v_current_stock INT;
                SELECT stock INTO v_current_stock FROM products WHERE product_id = NEW.product_id;
                
                UPDATE products 
                SET stock = stock - NEW.quantity 
                WHERE product_id = NEW.product_id;
                
                INSERT INTO inventory_audit_log (
                    product_id, old_stock, new_stock, change_type, notes
                ) VALUES (
                    NEW.product_id, 
                    v_current_stock, 
                    v_current_stock - NEW.quantity, 
                    'ORDER_PLACED', 
                    CONCAT('Automatic stock deduction for Order #', NEW.order_id, ', Qty: ', NEW.quantity)
                );
            END;
        `);

        await conn.query("DROP TRIGGER IF EXISTS trg_product_stock_audit");
        await conn.query(`
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
            END;
        `);

        await conn.query("DROP TRIGGER IF EXISTS trg_after_review_insert");
        await conn.query(`
            CREATE TRIGGER trg_after_review_insert
            AFTER INSERT ON reviews
            FOR EACH ROW
            BEGIN
                DECLARE v_avg DECIMAL(3,2);
                DECLARE v_cnt INT;
                SELECT COALESCE(AVG(rating), 4.5), COUNT(*) INTO v_avg, v_cnt FROM reviews WHERE product_id = NEW.product_id;
                UPDATE products SET rating = v_avg, rating_count = v_cnt WHERE product_id = NEW.product_id;
            END;
        `);

        await conn.query("DROP TRIGGER IF EXISTS trg_after_review_update");
        await conn.query(`
            CREATE TRIGGER trg_after_review_update
            AFTER UPDATE ON reviews
            FOR EACH ROW
            BEGIN
                DECLARE v_avg DECIMAL(3,2);
                DECLARE v_cnt INT;
                SELECT COALESCE(AVG(rating), 4.5), COUNT(*) INTO v_avg, v_cnt FROM reviews WHERE product_id = NEW.product_id;
                UPDATE products SET rating = v_avg, rating_count = v_cnt WHERE product_id = NEW.product_id;
            END;
        `);

        await conn.query("DROP TRIGGER IF EXISTS trg_after_review_delete");
        await conn.query(`
            CREATE TRIGGER trg_after_review_delete
            AFTER DELETE ON reviews
            FOR EACH ROW
            BEGIN
                DECLARE v_avg DECIMAL(3,2);
                DECLARE v_cnt INT;
                SELECT COALESCE(AVG(rating), 4.5), COUNT(*) INTO v_avg, v_cnt FROM reviews WHERE product_id = OLD.product_id;
                UPDATE products SET rating = v_avg, rating_count = v_cnt WHERE product_id = OLD.product_id;
            END;
        `);
        console.log("✓ Created 5 Database Triggers for stock deduction, audit trail, and rating sync.");

        // =====================================================================
        // STORED PROCEDURES
        // =====================================================================
        await conn.query("DROP PROCEDURE IF EXISTS sp_UpdateStock");
        await conn.query(`
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
            END;
        `);

        await conn.query("DROP PROCEDURE IF EXISTS sp_GetCustomerOrderHistory");
        await conn.query(`
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
            END;
        `);

        await conn.query("DROP PROCEDURE IF EXISTS sp_SalesReportByDateRange");
        await conn.query(`
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
            END;
        `);
        console.log("✓ Created 3 Stored Procedures for inventory management, order history, and sales reports.");

        // =====================================================================
        // SEEDING SELLERS
        // =====================================================================
        await conn.query(`
            INSERT INTO sellers (seller_id, seller_name, email, phone, address)
            VALUES 
                (1, 'Fashionista Retail Private Limited', 'retail@fashionista.com', '+91 9820011223', 'Bandra Kurla Complex, Mumbai, Maharashtra'),
                (2, 'Urban Apparel Hub', 'support@urbanapparel.in', '+91 9845012345', 'Indiranagar, Bengaluru, Karnataka'),
                (3, 'Elite Fabrics & Leathercraft', 'contact@elitefabrics.com', '+91 9811098765', 'Connaught Place, New Delhi')
            ON DUPLICATE KEY UPDATE seller_name = VALUES(seller_name);
        `);
        console.log("✓ Seeded sellers.");

        // =====================================================================
        // SEEDING CATEGORIES
        // =====================================================================
        const categoriesData = [
            { id: 1, name: "Men's Clothing", slug: "mens-clothing", image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&auto=format&fit=crop&q=80", description: "Timeless styles, sharp tailoring and everyday essentials for men." },
            { id: 2, name: "Women's Clothing", slug: "womens-clothing", image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80", description: "Chic outfits, elegant silhouettes and contemporary fashion for women." },
            { id: 3, name: "T-Shirts", slug: "t-shirts", image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80", description: "Graphic, crewneck and oversized comfortable t-shirts." },
            { id: 4, name: "Shirts", slug: "shirts", image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80", description: "Crisp formal and relaxed casual button-down shirts." },
            { id: 5, name: "Jeans", slug: "jeans", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80", description: "Slim, tapered, relaxed and vintage wash denim jeans." },
            { id: 6, name: "Trousers", slug: "trousers", image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80", description: "Smart chinos, pleated trousers and casual comfort pants." },
            { id: 7, name: "Dresses", slug: "dresses", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80", description: "Flowy sundresses, formal cocktail attire and everyday casuals." },
            { id: 8, name: "Jackets", slug: "jackets", image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80", description: "Leather biker jackets, cozy puffers, bombers and winter coats." },
            { id: 9, name: "Hoodies", slug: "hoodies", image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80", description: "Warm fleece hoodies and comfortable streetwear pullovers." },
            { id: 10, name: "Shoes", slug: "shoes", image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80", description: "Premium leather sneakers, running trainers and formal loafers." },
            { id: 11, name: "Bags", slug: "bags", image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80", description: "Everyday leather totes, modern backpacks and crossbody satchels." },
            { id: 12, name: "Watches", slug: "watches", image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80", description: "Minimalist analog timepieces, luxury chronographs and sporty styles." },
            { id: 13, name: "Accessories", slug: "accessories", image_url: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=500&auto=format&fit=crop&q=80", description: "Belts, sunglasses, silk scarves, hats and silver jewelry." }
        ];

        for (const cat of categoriesData) {
            await conn.query(`
                INSERT INTO categories (category_id, name, slug, image_url, description)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    slug = VALUES(slug),
                    image_url = VALUES(image_url),
                    description = VALUES(description);
            `, [cat.id, cat.name, cat.slug, cat.image_url, cat.description]);
        }
        console.log(`✓ Seeded ${categoriesData.length} categories.`);

        // Build category mapping for products
        const [cats] = await conn.query("SELECT category_id, name FROM categories");
        const catMap = {};
        for (const c of cats) {
            catMap[c.name] = c.category_id;
        }

        // =====================================================================
        // SEEDING CUSTOMERS & ADMIN (Bcrypt Passwords)
        // =====================================================================
        const adminHash = await bcrypt.hash("admin123", 10);
        const userHash = await bcrypt.hash("password123", 10);

        await conn.query(`
            INSERT INTO customers (customer_id, name, email, password_hash, phone, address, role)
            VALUES 
                (1, 'Fashionista Admin', 'admin@fashionista.com', ?, '+91 9999900000', 'Fashionista HQ, BKC, Mumbai', 'admin'),
                (2, 'Demo Customer', 'customer@fashionista.com', ?, '+91 9876543210', '221B Fashion Boulevard, Bengaluru', 'customer'),
                (3, 'Rahul Sharma', 'rahul@example.com', ?, '+91 9811122233', '14 Marine Drive, Mumbai', 'customer'),
                (4, 'Priya Verma', 'priya@example.com', ?, '+91 9822233344', '58 Park Street, Kolkata', 'customer')
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                password_hash = VALUES(password_hash),
                role = VALUES(role);
        `, [adminHash, userHash, userHash, userHash]);
        console.log("✓ Seeded admin & demo customer accounts with secure bcrypt hashes.");

        // =====================================================================
        // SEEDING PRODUCT CATALOG (36 Rich Products)
        // =====================================================================
        const productsCatalog = [
            // T-Shirts
            { name: "Oversized Vintage Graphic Tee", category: "T-Shirts", price: 899.00, discount_price: 699.00, stock: 45, image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80", brand: "UrbanTrend", sizes: "S, M, L, XL, XXL", colors: "Washed Black, Off-White, Sage Green", description: "Crafted from 100% heavy 240 GSM organic cotton with a soft vintage mineral wash and dropped shoulders for relaxed everyday street styling.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.8, rating_count: 38 },
            { name: "Supima Cotton Classic Crewneck", category: "T-Shirts", price: 1199.00, discount_price: 999.00, stock: 60, image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80", brand: "Fashionista Luxe", sizes: "XS, S, M, L, XL", colors: "Charcoal, Pure White, Navy Blue", description: "Tailored from rare American Supima long-staple cotton for unmatched softness, vibrant color retention, and resistance to pilling.", is_featured: 1, is_trending: 0, is_new_arrival: 0, rating: 4.9, rating_count: 52 },
            { name: "Breton Striped Casual Tee", category: "T-Shirts", price: 799.00, discount_price: 599.00, stock: 35, image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80", brand: "CoastalVibe", sizes: "S, M, L, XL", colors: "Navy/White, Red/White, Olive/Ecru", description: "Timeless French maritime striped jersey shirt with ribbed neckline and breathable knit construction.", is_featured: 0, is_trending: 1, is_new_arrival: 1, rating: 4.6, rating_count: 19 },

            // Shirts
            { name: "Oxford Cotton Button-Down Shirt", category: "Shirts", price: 1799.00, discount_price: 1499.00, stock: 40, image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80", brand: "Heritage Club", sizes: "38, 40, 42, 44", colors: "Sky Blue, Crisp White, Light Pink", description: "A sartorial staple woven in durable Oxford cloth with a neat button-down collar and tailored slim-regular silhouette.", is_featured: 1, is_trending: 0, is_new_arrival: 1, rating: 4.7, rating_count: 44 },
            { name: "Pure Linen Relaxed Resort Shirt", category: "Shirts", price: 2199.00, discount_price: 1799.00, stock: 25, image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80", brand: "Sol & Sea", sizes: "S, M, L, XL", colors: "Natural Beige, Olive Green, Ocean Blue", description: "Lightweight European flax linen featuring a camp collar, breathable weave, and natural moisture-wicking drape for warm weather.", is_featured: 1, is_trending: 1, is_new_arrival: 0, rating: 4.8, rating_count: 27 },
            { name: "Rugged Denim Workshirt", category: "Shirts", price: 1899.00, discount_price: null, stock: 30, image_url: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&auto=format&fit=crop&q=80", brand: "RawCraft", sizes: "M, L, XL", colors: "Indigo Wash, Faded Vintage", description: "Heavy-duty 8oz cotton denim featuring dual chest flap pockets, pearl snap buttons, and reinforced double-needle stitching.", is_featured: 0, is_trending: 0, is_new_arrival: 1, rating: 4.5, rating_count: 16 },

            // Jeans
            { name: "Slim Fit Indigo Selvedge Jeans", category: "Jeans", price: 2999.00, discount_price: 2499.00, stock: 30, image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80", brand: "RawCraft", sizes: "30, 32, 34, 36", colors: "Deep Indigo, Raw Black", description: "13.5 oz authentic shuttle-loom selvedge denim with 1% elastane for comfort. Designed to form unique natural fading whiskers over time.", is_featured: 1, is_trending: 1, is_new_arrival: 0, rating: 4.9, rating_count: 65 },
            { name: "High-Rise Vintage Straight Jeans", category: "Jeans", price: 2499.00, discount_price: 1999.00, stock: 28, image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80", brand: "DenimStudio", sizes: "26, 28, 30, 32", colors: "Light Stone Wash, Classic Blue", description: "90s-inspired straight leg silhouette with a flattering high waist, authentic copper rivets, and a classic button fly.", is_featured: 0, is_trending: 1, is_new_arrival: 1, rating: 4.7, rating_count: 31 },

            // Trousers
            { name: "Pleated Relaxed Tailored Trousers", category: "Trousers", price: 2299.00, discount_price: 1899.00, stock: 22, image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80", brand: "Atelier Mode", sizes: "30, 32, 34, 36", colors: "Charcoal Grey, Khaki, Almond", description: "Double front pleats with tapered drape, concealed tab closure, and premium wool-blend fabrication for sophisticated office and casual wear.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.8, rating_count: 24 },
            { name: "Stretch Twill Everyday Chinos", category: "Trousers", price: 1699.00, discount_price: 1399.00, stock: 35, image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80", brand: "Heritage Club", sizes: "30, 32, 34, 36", colors: "Navy, British Tan, Olive", description: "Garment-dyed cotton twill engineered with 3% stretch for maximum all-day flexibility. Clean flat-front finish.", is_featured: 0, is_trending: 0, is_new_arrival: 0, rating: 4.6, rating_count: 42 },

            // Dresses
            { name: "Floral Tiered Midi Sundress", category: "Dresses", price: 2499.00, discount_price: 1999.00, stock: 20, image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80", brand: "Flora & Bloom", sizes: "XS, S, M, L", colors: "Pastel Yellow Floral, Blush Pink", description: "Chiffon midi dress featuring ruffled tiers, sweet sweetheart neckline, adjustable tie straps, and an airy silhouette.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 47 },
            { name: "Silk Satin Slip Cocktail Dress", category: "Dresses", price: 3499.00, discount_price: 2799.00, stock: 15, image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80", brand: "Atelier Mode", sizes: "S, M, L", colors: "Emerald Green, Midnight Black, Champagne", description: "Luxurious cowl neck slip dress cut on the bias in heavyweight mulberry silk satin for effortless fluid motion.", is_featured: 1, is_trending: 0, is_new_arrival: 1, rating: 4.8, rating_count: 36 },
            { name: "Bohemian Embroidered Maxi Dress", category: "Dresses", price: 2899.00, discount_price: 2299.00, stock: 18, image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80", brand: "BohoChic", sizes: "S, M, L, XL", colors: "Ivory, Terracotta", description: "Handcrafted intricate floral embroidery on breathable cotton voile with voluminous bishop sleeves and tiered skirt.", is_featured: 0, is_trending: 1, is_new_arrival: 0, rating: 4.7, rating_count: 21 },

            // Jackets
            { name: "Lambskin Leather Biker Jacket", category: "Jackets", price: 5999.00, discount_price: 4999.00, stock: 12, image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80", brand: "RebelMoto", sizes: "S, M, L, XL", colors: "Classic Black, Cognac Brown", description: "Genuine full-grain lambskin leather equipped with asymmetric heavy metal zippers, snap lapels, and quilted satin interior lining.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 5.0, rating_count: 58 },
            { name: "Thermal Quilted Down Puffer Jacket", category: "Jackets", price: 4299.00, discount_price: 3499.00, stock: 20, image_url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80", brand: "NordicStorm", sizes: "M, L, XL, XXL", colors: "Matte Black, Forest Green, Metallic Silver", description: "650-fill power responsibly sourced goose down insulation inside a water-resistant ripstop nylon shell with storm cuffs.", is_featured: 1, is_trending: 0, is_new_arrival: 1, rating: 4.8, rating_count: 33 },
            { name: "Classic Belted Trench Coat", category: "Jackets", price: 4999.00, discount_price: 3999.00, stock: 14, image_url: "https://images.unsplash.com/photo-1539533018447-63fcce667823?w=600&auto=format&fit=crop&q=80", brand: "LondonFog", sizes: "S, M, L", colors: "Honey Beige, Slate Grey", description: "Double-breasted weatherproof cotton gabardine trench coat with waist sash belt, horn buttons, and storm shield cape.", is_featured: 0, is_trending: 1, is_new_arrival: 0, rating: 4.9, rating_count: 29 },

            // Hoodies
            { name: "Heavyweight French Terry Hoodie", category: "Hoodies", price: 2199.00, discount_price: 1799.00, stock: 35, image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80", brand: "UrbanTrend", sizes: "S, M, L, XL, XXL", colors: "Heather Grey, Jet Black, Forest Green", description: "Luxurious 450 GSM French terry cotton with double-lined drawstring hood, kangaroo pouch, and structured ribbed trims.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 73 },
            { name: "Zip-Up Fleece Urban Hoodie", category: "Hoodies", price: 1899.00, discount_price: 1499.00, stock: 28, image_url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80", brand: "StreetEssence", sizes: "M, L, XL", colors: "Oatmeal, Deep Charcoal, Burgundy", description: "Plush brushed fleece interior with smooth two-way metal front zip, ergonomic thumbholes, and ribbed side panels.", is_featured: 0, is_trending: 0, is_new_arrival: 1, rating: 4.7, rating_count: 31 },

            // Shoes
            { name: "Minimalist Italian White Leather Sneakers", category: "Shoes", price: 3999.00, discount_price: 3199.00, stock: 25, image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80", brand: "Veloce Footwear", sizes: "40, 41, 42, 43, 44", colors: "Triple White, White/Navy Tab", description: "Full-grain nappa leather uppers, stitched Margom rubber cupsole, and antimicrobial calfskin lining for immaculate street style.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 84 },
            { name: "Goodyear-Welted Chelsea Boots", category: "Shoes", price: 4999.00, discount_price: 3999.00, stock: 18, image_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80", brand: "Heritage Club", sizes: "41, 42, 43, 44", colors: "Dark Tan Suede, Black Calfskin", description: "Handcrafted Chelsea boots with heavy elastic side gussets, stacked leather heel, Dainite rubber outsole, and pull tabs.", is_featured: 1, is_trending: 0, is_new_arrival: 0, rating: 4.8, rating_count: 41 },
            { name: "Aero Cushion Pro Running Trainers", category: "Shoes", price: 3299.00, discount_price: 2599.00, stock: 30, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", brand: "HyperAthletics", sizes: "39, 40, 41, 42, 43, 44", colors: "Crimson Red, Phantom Black, Neon Volt", description: "Engineered breathable jacquard mesh upper with reactive EVA foam midsole and carbon plate shank for explosive energy return.", is_featured: 0, is_trending: 1, is_new_arrival: 1, rating: 4.8, rating_count: 55 },

            // Bags
            { name: "Full-Grain Leather Executive Tote Bag", category: "Bags", price: 4499.00, discount_price: 3699.00, stock: 16, image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80", brand: "Cuero Milano", sizes: "One Size", colors: "Saddle Tan, Obsidian Black", description: "Spacious luxury leather tote featuring dedicated 15-inch laptop sleeve, magnetic closure, and reinforced rolled handles.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 39 },
            { name: "Waterproof Urban Roll-Top Backpack", category: "Bags", price: 2799.00, discount_price: 2199.00, stock: 24, image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80", brand: "NordicStorm", sizes: "25L", colors: "Matte Olive, Stealth Black", description: "TPU laminated ballistic nylon with quick-access side laptop compartment, padded air-mesh harness, and fidlock magnetic buckle.", is_featured: 0, is_trending: 1, is_new_arrival: 0, rating: 4.7, rating_count: 23 },
            { name: "Minimalist Half-Moon Crossbody Bag", category: "Bags", price: 1999.00, discount_price: 1599.00, stock: 22, image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80", brand: "Atelier Mode", sizes: "Medium", colors: "Burgundy, Caramel, Cream", description: "Sculptural half-moon silhouette made from smooth vegan leather with gold-tone hardware and adjustable shoulder strap.", is_featured: 1, is_trending: 0, is_new_arrival: 1, rating: 4.8, rating_count: 28 },

            // Watches
            { name: "Chronograph Sapphire Stainless Watch", category: "Watches", price: 6999.00, discount_price: 5499.00, stock: 15, image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", brand: "Chronos Geneve", sizes: "42mm", colors: "Silver/Sunburst Blue, Rose Gold/Black", description: "Precision Japanese quartz movement with triple sub-dials, scratch-resistant sapphire crystal glass, and 100m water resistance.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 5.0, rating_count: 62 },
            { name: "Minimalist Bauhaus Mesh Strap Watch", category: "Watches", price: 3499.00, discount_price: 2799.00, stock: 20, image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80", brand: "Nordic Horology", sizes: "38mm, 40mm", colors: "Rose Gold, Matte Gunmetal", description: "Ultra-slim 6mm profile with clean minimalist hour markers, Milanese stainless steel magnetic mesh band, and date window.", is_featured: 0, is_trending: 1, is_new_arrival: 0, rating: 4.8, rating_count: 35 },

            // Accessories
            { name: "Handcrafted Full-Grain Leather Belt", category: "Accessories", price: 1299.00, discount_price: 999.00, stock: 40, image_url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80", brand: "Cuero Milano", sizes: "32, 34, 36, 38", colors: "Dark Brown, Antique Black", description: "Vegetable-tanned 38mm solid leather strap finished with solid brushed brass buckle and burnished beveled edges.", is_featured: 1, is_trending: 0, is_new_arrival: 1, rating: 4.7, rating_count: 48 },
            { name: "Polarized Aviator Gold Sunglasses", category: "Accessories", price: 1999.00, discount_price: 1499.00, stock: 35, image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80", brand: "SunOptics", sizes: "Standard", colors: "Gold Frame/Green Lens, Matte Black/Grey", description: "Lightweight titanium-alloy wireframe with 100% UV400 anti-glare polarized lenses and silicone nose pads.", is_featured: 1, is_trending: 1, is_new_arrival: 0, rating: 4.8, rating_count: 51 },
            { name: "Mulberry Silk Geometric Scarf", category: "Accessories", price: 1599.00, discount_price: 1199.00, stock: 25, image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80", brand: "Atelier Mode", sizes: "90x90 cm", colors: "Navy/Gold, Emerald/Rose", description: "100% 16-momme pure mulberry silk twill with hand-rolled hems and sophisticated hand-screened heritage prints.", is_featured: 0, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 22 },

            // Men's Clothing
            { name: "Italian Wool Slim Fit Two-Piece Suit", category: "Men's Clothing", price: 9999.00, discount_price: 7999.00, stock: 12, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80", brand: "Sartoria Roma", sizes: "38R, 40R, 42R, 44R", colors: "Midnight Navy, Charcoal", description: "Woven in Biella, Italy from Super 120s virgin wool. Features half-canvas chest construction, notch lapels, and matching flat-front trousers.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 5.0, rating_count: 45 },
            { name: "Knitted Cotton Mercerized Polo", category: "Men's Clothing", price: 1599.00, discount_price: 1299.00, stock: 35, image_url: "https://images.unsplash.com/photo-1625910513413-5753b7d14d13?w=600&auto=format&fit=crop&q=80", brand: "Heritage Club", sizes: "S, M, L, XL", colors: "Sage Green, Cream, Burgundy", description: "Fine-gauge knitted polo with mother-of-pearl buttons and a silky mercerized cotton sheen. Perfect for elevated smart-casual style.", is_featured: 0, is_trending: 1, is_new_arrival: 1, rating: 4.7, rating_count: 32 },

            // Women's Clothing
            { name: "Tailored Linen Blazer & Trouser Co-ord", category: "Women's Clothing", price: 4999.00, discount_price: 3999.00, stock: 15, image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", brand: "Atelier Mode", sizes: "S, M, L", colors: "Terracotta, Ivory Beige", description: "Modern power-suiting in lightweight pure flax linen. Single-breasted relaxed blazer paired with high-waisted wide-leg trousers.", is_featured: 1, is_trending: 1, is_new_arrival: 1, rating: 4.9, rating_count: 37 },
            { name: "Ribbed Knit Bodycon Midi Dress", category: "Women's Clothing", price: 2199.00, discount_price: 1699.00, stock: 25, image_url: "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=600&auto=format&fit=crop&q=80", brand: "Flora & Bloom", sizes: "XS, S, M, L", colors: "Mocha Brown, Olive, Black", description: "Sculpting vertical rib-knit fabric with square neck silhouette and elegant side leg slit for day-to-night versatility.", is_featured: 0, is_trending: 1, is_new_arrival: 0, rating: 4.8, rating_count: 40 }
        ];

        for (const p of productsCatalog) {
            const catId = catMap[p.category] || null;
            const [existing] = await conn.query("SELECT product_id FROM products WHERE product_name = ?", [p.name]);
            if (existing.length > 0) {
                await conn.query(`
                    UPDATE products SET
                        description = ?, category = ?, category_id = ?, price = ?, discount_price = ?,
                        stock = ?, image_url = ?, brand = ?, sizes = ?, colors = ?, is_featured = ?,
                        is_trending = ?, is_new_arrival = ?, rating = ?, rating_count = ?, seller_id = 1, is_active = 1
                    WHERE product_id = ?
                `, [
                    p.description, p.category, catId, p.price, p.discount_price, p.stock,
                    p.image_url, p.brand, p.sizes, p.colors, p.is_featured, p.is_trending,
                    p.is_new_arrival, p.rating, p.rating_count, existing[0].product_id
                ]);
            } else {
                await conn.query(`
                    INSERT INTO products (
                        product_name, description, category, category_id, price, discount_price,
                        stock, image_url, brand, sizes, colors, is_featured, is_trending,
                        is_new_arrival, rating, rating_count, seller_id, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
                `, [
                    p.name, p.description, p.category, catId, p.price, p.discount_price,
                    p.stock, p.image_url, p.brand, p.sizes, p.colors, p.is_featured,
                    p.is_trending, p.is_new_arrival, p.rating, p.rating_count
                ]);
            }
        }
        console.log(`✓ Seeded/updated ${productsCatalog.length} realistic fashion catalog products with foreign key linkages.`);

        // =====================================================================
        // SEED SAMPLE REVIEWS
        // =====================================================================
        const [firstProds] = await conn.query("SELECT product_id FROM products LIMIT 5");
        for (const fp of firstProds) {
            await conn.query(`
                INSERT IGNORE INTO reviews (product_id, customer_id, customer_name, rating, comment)
                VALUES 
                    (?, 2, 'Demo Customer', 5, 'Outstanding fit, luxurious fabric quality, and super fast delivery! Highly recommended.'),
                    (?, 3, 'Rahul Sharma', 4, 'Very pleased with the purchase. Stitching and finish are top-tier.');
            `, [fp.product_id, fp.product_id]);
        }
        console.log("✓ Seeded sample customer product reviews.");

        // =====================================================================
        // SEED SAMPLE DEMONSTRATION ORDER (Customer #2)
        // =====================================================================
        const [existingOrders] = await conn.query("SELECT order_id FROM orders WHERE customer_id = 2 LIMIT 1");
        if (existingOrders.length === 0) {
            const [p1] = await conn.query("SELECT product_id, price, discount_price FROM products WHERE product_name LIKE '%Tee%' LIMIT 1");
            const [p2] = await conn.query("SELECT product_id, price, discount_price FROM products WHERE product_name LIKE '%Shirt%' LIMIT 1");

            if (p1.length > 0 && p2.length > 0) {
                const price1 = p1[0].discount_price || p1[0].price;
                const price2 = p2[0].discount_price || p2[0].price;
                const orderTotal = Number(price1) + Number(price2);

                const [ordRes] = await conn.query(`
                    INSERT INTO orders (
                        customer_id, customer_name, customer_email, customer_phone,
                        shipping_address, total_amount, payment_method, payment_status, status
                    ) VALUES (
                        2, 'Demo Customer', 'customer@fashionista.com', '+91 9876543210',
                        '221B Fashion Boulevard, Bengaluru, Karnataka - 560001', ?, 'Demo UPI / Card', 'Paid', 'Confirmed'
                    )
                `, [orderTotal]);

                const demoOrderId = ordRes.insertId;

                // Insert line items (triggers auto inventory deduction and audit log!)
                await conn.query(`
                    INSERT INTO order_details (order_id, product_id, quantity, unit_price, selected_size, selected_color)
                    VALUES 
                        (?, ?, 1, ?, 'L', 'Default'),
                        (?, ?, 1, ?, 'M', 'Default')
                `, [demoOrderId, p1[0].product_id, price1, demoOrderId, p2[0].product_id, price2]);

                // Insert payment record
                await conn.query(`
                    INSERT INTO payments (order_id, payment_date, amount, payment_method, payment_status, transaction_reference)
                    VALUES (?, NOW(), ?, 'Demo UPI / Card', 'Paid', CONCAT('TXN_DEMO_', ?))
                `, [demoOrderId, orderTotal, demoOrderId]);

                // Insert delivery record
                await conn.query(`
                    INSERT INTO deliveries (order_id, delivery_address, delivery_status, tracking_number)
                    VALUES (?, '221B Fashion Boulevard, Bengaluru, Karnataka - 560001', 'In Transit', CONCAT('FASH_TRK_', ?))
                `, [demoOrderId, demoOrderId]);

                console.log(`✓ Seeded demonstration Order #${demoOrderId} with line items, payment, and delivery.`);
            }
        }

        console.log("==================================================================");
        console.log("  MIGRATION & SEEDING COMPLETED SUCCESSFULLY!                     ");
        console.log("  MySQL Database is 100% prepared with complete DBMS features.   ");
        console.log("==================================================================");

    } catch (err) {
        console.error("Migration error:", err);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
}

migrateAndSeed();
