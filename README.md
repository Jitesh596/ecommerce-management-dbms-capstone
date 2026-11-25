# Fashionista — DBMS Capstone Project & E-Commerce Management Platform

**Fashionista** is a full-stack, enterprise-grade fashion e-commerce shopping platform developed as a **Database Management Systems (DBMS) Capstone Project**. Maximum priority is given to the MySQL relational database architecture, relational integrity, 3rd Normal Form (3NF) normalization, database views, active triggers, stored procedures, ACID transaction handling, and parameterized query execution.

---

## 🏛️ DBMS Architectural Highlights & Core Concepts

- **MySQL 8.0 Primary Storage Engine**: Pure relational database persistence. No mock data, hardcoded products, or client-side storage arrays as primary data sources.
- **Relational Integrity & 3NF Normalization**: Complete implementation of Primary Keys, Foreign Keys, Referential Integrity actions (`ON DELETE CASCADE`, `ON DELETE RESTRICT`, `ON DELETE SET NULL`), and Unique and CHECK constraints.
- **Performance Indexes**: High-performance B-tree indexes placed on frequently queried foreign keys, status indicators, and sorting fields.
- **Relational Views**: 5 logical views created for product catalog presentation, detailed order summaries, category sales analysis, low-stock inventory alerts, and customer lifetime expenditure analytics.
- **Active Database Triggers**: 5 triggers providing automated real-time database logic:
  - Automatic inventory stock decrement and entry generation in `inventory_audit_log` when order line items are inserted.
  - Automatic audit logging for manual or external stock updates.
  - Automatic recalculation of average star ratings and review counts on the `products` table whenever reviews are inserted, updated, or deleted.
- **Stored Procedures**: Encapsulated database procedural logic for safe inventory updates (`sp_UpdateStock`), customer order history retrieval (`sp_GetCustomerOrderHistory`), and date-range sales performance reporting (`sp_SalesReportByDateRange`).
- **ACID Transaction Management**: Order checkout runs inside an explicit database transaction (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) with row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions and overselling.
- **SQL Injection Prevention**: All queries use parameterized statements (`?` placeholders) with prepared statement caching.

---

## 📊 Database Schema Design (13 Relational Tables)

The database `ecommerce_management_db` contains 13 relational tables organized up to 3rd Normal Form (3NF):

```text
+-------------------+        1:N        +------------------+
|    categories     |<------------------|     products     |
+-------------------+                   +------------------+
                                                 | 1:N
+-------------------+        1:N                 v
|      sellers      |<------------------+------------------+
+-------------------+                   |  order_details   |
                                        +------------------+
+-------------------+        1:N                 ^
|     customers     |-------------------+        | 1:N
+-------------------+                   v        |
     | 1:1       | 1:N          +------------------+
     v           v              |      orders      |
+---------+  +----------+       +------------------+
|  cart   |  | wishlist |          | 1:1      | 1:1
+---------+  +----------+          v          v
     | 1:N                      +------------+ +----------+
     v                          | deliveries | | payments |
+------------+                  +------------+ +----------+
| cart_items |
+------------+                  +---------------------+
                                | inventory_audit_log |
+------------+                  +---------------------+
|  reviews   |
+------------+
```

### Table Specifications:

1. **`customers`**: Stores registered customer and administrator profiles.
   - **Primary Key**: `customer_id` (INT, AUTO_INCREMENT)
   - **Unique Constraints**: `email` (VARCHAR(100))
   - **Check Constraints**: `chk_customer_role CHECK (role IN ('customer', 'admin'))`
   - **Security**: Passwords salted and hashed with `bcryptjs`.

2. **`sellers`**: Verified merchant partners and fulfillment centers (Appario Retail, RetailNet, SuperComNet, Fashionista Retail, Urban Apparel, Elite Fabrics).
   - **Primary Key**: `seller_id` (INT, AUTO_INCREMENT)
   - **Unique Constraints**: `email` (VARCHAR(100))

3. **`categories`**: 20 Multi-Category departments spanning Mobiles, Laptops, Audio, Ethnic Wear, Home Appliances, Grooming, Fitness, and Apparel.
   - **Primary Key**: `category_id` (INT, AUTO_INCREMENT)
   - **Unique Constraints**: `name` (VARCHAR(100)), `slug` (VARCHAR(100))

4. **`products`**: 65+ Flagship products from Apple, Samsung, Sony, Nike, Biba, Manyavar, Instant Pot, Dyson, and Philips with specifications, variants, pricing, and stock.
   - **Primary Key**: `product_id` (INT, AUTO_INCREMENT)
   - **Foreign Keys**:
     - `category_id` REFERENCES `categories(category_id)` ON DELETE SET NULL
     - `seller_id` REFERENCES `sellers(seller_id)` ON DELETE SET NULL
   - **Check Constraints**:
     - `chk_product_price CHECK (price >= 0)`
     - `chk_product_discount CHECK (discount_price IS NULL OR (discount_price >= 0 AND discount_price <= price))`
     - `chk_product_stock CHECK (stock >= 0)`
     - `chk_product_rating CHECK (rating >= 0 AND rating <= 5.0)`

5. **`cart`**: Active shopping cart session per user.
   - **Primary Key**: `cart_id` (INT, AUTO_INCREMENT)
   - **Foreign Key**: `customer_id` REFERENCES `customers(customer_id)` ON DELETE CASCADE
   - **Cardinality**: One-to-One relationship with `customers` enforced by `UNIQUE(customer_id)`.

6. **`cart_items`**: Junction table resolving Many-to-Many between `cart` and `products`.
   - **Primary Key**: `cart_item_id` (INT, AUTO_INCREMENT)
   - **Foreign Keys**:
     - `cart_id` REFERENCES `cart(cart_id)` ON DELETE CASCADE
     - `product_id` REFERENCES `products(product_id)` ON DELETE CASCADE
   - **Unique Key**: `unique_cart_item (cart_id, product_id, selected_size, selected_color)`
   - **Check Constraint**: `chk_cart_quantity CHECK (quantity > 0)`

7. **`wishlist`**: Saved items resolving Many-to-Many between `customers` and `products`.
   - **Primary Key**: `wishlist_id` (INT, AUTO_INCREMENT)
   - **Foreign Keys**:
     - `customer_id` REFERENCES `customers(customer_id)` ON DELETE CASCADE
     - `product_id` REFERENCES `products(product_id)` ON DELETE CASCADE
   - **Unique Key**: `unique_cust_prod (customer_id, product_id)`

8. **`orders`**: Master purchase order entity.
   - **Primary Key**: `order_id` (INT, AUTO_INCREMENT)
   - **Foreign Key**: `customer_id` REFERENCES `customers(customer_id)` ON DELETE RESTRICT
   - **Check Constraints**: `chk_order_total CHECK (total_amount >= 0)`

9. **`order_details`**: Line items resolving Many-to-Many between `orders` and `products`.
   - **Primary Key**: `order_detail_id` (INT, AUTO_INCREMENT)
   - **Foreign Keys**:
     - `order_id` REFERENCES `orders(order_id)` ON DELETE CASCADE
     - `product_id` REFERENCES `products(product_id)` ON DELETE RESTRICT
   - **Check Constraints**:
     - `chk_order_detail_qty CHECK (quantity > 0)`
     - `chk_order_detail_price CHECK (unit_price >= 0)`

10. **`deliveries`**: Logistics dispatch and parcel tracking.
    - **Primary Key**: `delivery_id` (INT, AUTO_INCREMENT)
    - **Foreign Key**: `order_id` REFERENCES `orders(order_id)` ON DELETE CASCADE
    - **Cardinality**: One-to-One relationship with `orders` enforced by `UNIQUE(order_id)`.

11. **`payments`**: Transaction records and payment gateway settlements.
    - **Primary Key**: `payment_id` (INT, AUTO_INCREMENT)
    - **Foreign Key**: `order_id` REFERENCES `orders(order_id)` ON DELETE CASCADE
    - **Check Constraint**: `chk_payment_amount CHECK (amount >= 0)`

12. **`reviews`**: Verified customer ratings and reviews.
    - **Primary Key**: `review_id` (INT, AUTO_INCREMENT)
    - **Foreign Keys**:
      - `product_id` REFERENCES `products(product_id)` ON DELETE CASCADE
      - `customer_id` REFERENCES `customers(customer_id)` ON DELETE CASCADE
    - **Check Constraint**: `chk_review_rating CHECK (rating >= 1 AND rating <= 5)`

13. **`inventory_audit_log`**: Automated audit trail tracking all stock adjustments.
    - **Primary Key**: `log_id` (INT, AUTO_INCREMENT)
    - **Foreign Key**: `product_id` REFERENCES `products(product_id)` ON DELETE CASCADE
    - **Enum Change Types**: `ORDER_PLACED`, `STOCK_RESTOCKED`, `ORDER_CANCELLED`, `MANUAL_ADJUSTMENT`.

---

## 🔍 Database Views

| View Name | Source Tables | Description / Purpose |
| :--- | :--- | :--- |
| **`vw_product_catalog`** | `products`, `categories`, `sellers` | Joins product details with category slugs, seller information, calculated effective prices (`COALESCE(discount_price, price)`), discount percentages, and human-readable stock statuses. |
| **`vw_order_summary`** | `orders`, `deliveries`, `payments`, `order_details` | High-level order overview joining delivery dispatch status, payment verification, item counts, and total units ordered. |
| **`vw_category_sales`** | `categories`, `products`, `order_details`, `orders` | Aggregates category performance: total active products, current warehouse inventory units, units sold, and total generated revenue. |
| **`vw_low_stock_alerts`** | `products`, `sellers` | Filters products where `stock < 15` units, presenting vendor contact details for restock purchase orders. |
| **`vw_customer_order_stats`** | `customers`, `orders` | Customer analytics summarizing lifetime order count, total expenditure, average order value (AOV), and latest order timestamp. |

---

## ⚡ Active Database Triggers

1. **`trg_after_order_item_insert`** (`AFTER INSERT ON order_details`):
   - Automatically decrements the available quantity in `products.stock` corresponding to the ordered units.
   - Inserts an audit record in `inventory_audit_log` recording `old_stock`, `new_stock`, change type `'ORDER_PLACED'`, and order identifier.
2. **`trg_product_stock_audit`** (`AFTER UPDATE ON products`):
   - Fires whenever `OLD.stock <> NEW.stock`.
   - Records historical stock levels into `inventory_audit_log` categorizing changes as `'STOCK_RESTOCKED'` or `'MANUAL_ADJUSTMENT'`.
3. **`trg_after_review_insert`** (`AFTER INSERT ON reviews`):
   - Calculates `AVG(rating)` and `COUNT(*)` across all reviews for the target product.
   - Automatically updates `products.rating` and `products.rating_count` in real-time.
4. **`trg_after_review_update`** (`AFTER UPDATE ON reviews`):
   - Recalculates average product rating when an existing review is edited.
5. **`trg_after_review_delete`** (`AFTER DELETE ON reviews`):
   - Recalculates average product rating when a review is deleted.

---

## ⚙️ Stored Procedures

1. **`sp_UpdateStock`**:
   - **Signature**: `(IN p_product_id INT, IN p_quantity_change INT, IN p_reason VARCHAR(255), OUT p_new_stock INT, OUT p_status_message VARCHAR(255))`
   - **Functionality**: Validates that stock will not drop below zero, applies the change, updates the product table, and outputs status.
2. **`sp_GetCustomerOrderHistory`**:
   - **Signature**: `(IN p_customer_id INT)`
   - **Functionality**: Queries and formats all historical orders, line item summaries (via `GROUP_CONCAT`), delivery status, and payment status for a specific customer.
3. **`sp_SalesReportByDateRange`**:
   - **Signature**: `(IN p_start_date DATETIME, IN p_end_date DATETIME)`
   - **Functionality**: Compiles daily sales performance, order counts, gross revenue, and total items sold between two timestamps.

---

## 🎓 Viva & Evaluation Demonstration Queries

Run these queries in MySQL Workbench or MySQL CLI to demonstrate specific DBMS concepts to examiners:

### 1. Complex Multi-Table JOIN with Computed Fields
```sql
SELECT 
    p.product_id,
    p.product_name,
    c.name AS category_name,
    s.seller_name,
    p.price,
    p.stock,
    COALESCE(SUM(od.quantity), 0) AS total_units_sold
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN sellers s ON p.seller_id = s.seller_id
LEFT JOIN order_details od ON p.product_id = od.product_id
GROUP BY p.product_id, p.product_name, c.name, s.seller_name, p.price, p.stock
ORDER BY total_units_sold DESC;
```

### 2. Aggregations with GROUP BY and HAVING
```sql
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT p.product_id) AS distinct_products,
    SUM(od.quantity) AS units_sold,
    ROUND(SUM(od.quantity * od.unit_price), 2) AS total_revenue
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_details od ON p.product_id = od.product_id
GROUP BY c.category_id, c.name
HAVING total_revenue > 1000
ORDER BY total_revenue DESC;
```

### 3. Correlated Subquery in WHERE Clause
```sql
SELECT c.customer_id, c.name, c.email,
       (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.customer_id) AS total_spent
FROM customers c
WHERE (SELECT SUM(total_amount) FROM orders WHERE customer_id = c.customer_id) > (
    SELECT AVG(total_amount) FROM orders
);
```

### 4. Executing Stored Procedures
```sql
-- Safe Stock Update:
CALL sp_UpdateStock(1, 15, 'Restock Batch A1', @new_stock, @status_msg);
SELECT @new_stock, @status_msg;

-- Customer Order History:
CALL sp_GetCustomerOrderHistory(2);

-- Date Range Sales Report:
CALL sp_SalesReportByDateRange('2026-01-01', '2026-12-31');
```

### 5. Querying Database Views
```sql
SELECT * FROM vw_product_catalog WHERE stock_status = 'In Stock' LIMIT 5;
SELECT * FROM vw_order_summary WHERE order_status = 'Confirmed';
SELECT * FROM vw_category_sales;
SELECT * FROM vw_low_stock_alerts;
SELECT * FROM vw_customer_order_stats;
```

### 6. Inspecting the Automated Trigger Audit Trail
```sql
SELECT log_id, product_id, old_stock, new_stock, change_type, notes, logged_at
FROM inventory_audit_log
ORDER BY log_id DESC
LIMIT 10;
```

---

## 🔐 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fashionista.com` | `admin123` | Full access to Admin Panel (`/admin`), DBMS reports, product CRUD, order status management |
| **Demo Customer** | `customer@fashionista.com` | `password123` | Shopping catalog, Cart, Wishlist, Checkout, Orders, Reviews |
| **Customer 2** | `rahul@example.com` | `password123` | Regular customer account |

---

## 🚀 Setup & Execution Instructions

### 1. Database Configuration
Ensure `server/.env` contains your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_management_db
PORT=5000
JWT_SECRET=fashionista_jwt_secret_token_key_2026_xyz
```

### 2. Run Database Migration & Seeding
This script creates the database, all 13 tables, constraints, indexes, views, triggers, stored procedures, and initial catalog records:
```bash
node server/migrate-and-seed.js
```

### 3. Run DBMS Verification Test Suite
Run the 28-point automated DBMS test suite verifying foreign keys, views, triggers, procedures, and complex queries:
```bash
node server/test-dbms-features.js
```

### 4. Run Comprehensive 32-Point End-to-End Test Suite
```bash
node server/comprehensive-test.js
```

### 5. Start Backend Server
```bash
node server/server.js
```
Backend API will be live at `http://localhost:5000`.

### 6. Start Frontend Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. All requests are proxied directly to the MySQL backend.

---

## 📁 Project Structure

```text
fashionista/
├── server/
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication & role-based access control
│   ├── routes/
│   │   ├── auth.js                  # /api/auth (Customer registration, login, profile)
│   │   ├── products.js              # /api/products (Product CRUD, category filtering, search)
│   │   ├── categories.js            # /api/categories (Category CRUD & product count aggregation)
│   │   ├── cart.js                  # /api/cart (Cart items & stock validation)
│   │   ├── wishlist.js              # /api/wishlist (Customer wishlist)
│   │   ├── orders.js                # /api/orders (ACID checkout & sp_GetCustomerOrderHistory)
│   │   ├── reviews.js               # /api/products/:id/reviews (Review submission & trigger sync)
│   │   └── reports.js               # /api/reports (Queries database views & audit log)
│   ├── database_schema.sql          # Complete DDL script (tables, views, triggers, procedures)
│   ├── migrate-and-seed.js          # Full automated DB creation, schema setup & data seeding
│   ├── test-dbms-features.js        # Comprehensive DBMS test verifying views, triggers & procedures
│   ├── test-all-apis.js             # API endpoint verification
│   ├── comprehensive-test.js        # 32-point end-to-end integration test suite
│   ├── db.js                        # MySQL connection pool
│   └── server.js                    # Express application entry point
├── src/
│   ├── components/                  # Navbar, Footer
│   ├── context/                     # AuthContext, CartContext
│   ├── pages/                       # Home, ProductDetails, Cart, Checkout, Orders, Profile, Admin
│   ├── services/
│   │   └── api.js                   # 100% Database-driven Axios API client with JWT interceptor
│   ├── App.jsx                      # React router configuration
│   └── style.css                    # Responsive styling
├── vite.config.js                   # Vite dev server with /api proxy to localhost:5000
└── package.json                     # Project scripts and dependencies
```

## Demo Accounts

- **Admin**
  - Email: `admin@fashionista.com`
  - Password: `admin123`

- **Customer (Demo User)**
  - Email: `customer@fashionista.com`
  - Password: `password123`

Use the **Demo Customer** or **Demo Admin** buttons on the login page to auto‑fill these credentials.
