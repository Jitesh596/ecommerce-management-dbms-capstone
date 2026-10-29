# Fashionista — E-Commerce Management Database System (DBMS Capstone)

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-green)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0%20InnoDB-orange)](https://www.mysql.com/)
[![Testing](https://img.shields.io/badge/Automated%20Tests-21%2F21%20Passed%20(100%25)-brightgreen)](docs/test-cases.md)

An end-to-end, production-grade E-Commerce Management Database System developed for academic DBMS Capstone evaluation across five core phases (20 marks each).

---

## 1. Project Overview & Academic Information

- **Project Title:** Fashionista – E-Commerce Management Database System
- **Academic Capstone:** Database Management Systems (Semester 3)
- **Team Members:**
  - **Nikhil Kumar Singh** — Roll No: **2501010151**
  - **Jitesh Kumar** — Roll No: **2501010180**
- **RDBMS Engine:** MySQL 8.0+ (InnoDB Storage Engine with ACID transaction support)
- **Architecture:** Decoupled Client-Server Architecture (React 18 SPA + Node.js Express REST API + MySQL 8.0)

---

## 2. Evaluation Phases Architecture

### Phase 1 — Relational Schema Design & Frontend Integration (20 Marks)
- Finalized 7 core normalized relational tables: `Customers`, `Sellers`, `Products`, `Orders`, `Order_Details`, `Payments`, and `Deliveries`.
- Full normalization up to **3NF / BCNF** documented in [`docs/database-design.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/database-design.md).
- Visual and editable diagrams: [`docs/ER_Diagram.drawio`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/ER_Diagram.drawio) and Mermaid diagram.
- Replaced public Fake Store API with our authoritative Express MySQL backend (`GET /api/products`).
- Removed arbitrary currency conversion (`* 85`); all prices stored and displayed in INR (`₹`) with formatting.
- Expanded catalogue to **55 unique fashion products** across 10 categories with curated high-resolution photography and local fallbacks.

### Phase 2 — SQL Procedures, Functions & Triggers (20 Marks)
- Stored Function `fn_calculate_order_subtotal(order_id)`: dynamically calculates subtotal from line items.
- Stored Function `fn_calculate_gst(subtotal, tax_rate)`: demonstration GST computation.
- Stored Procedure `sp_recalculate_order_total(order_id)`: recalculates and updates `orders.total_amount`.
- Stored Procedure `sp_update_order_status(order_id, new_status)`: validates transitions and atomically restores stock on cancellation.
- Database Trigger `trg_validate_order_detail_before_insert`: enforces stock sufficiency, active product availability, and positive quantities.
- Source DDL: [`server/sql/phase2_procedures_triggers.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/phase2_procedures_triggers.sql).

### Phase 3 — Analytical SQL Reports & Query Optimization (20 Marks)
- 10 comprehensive analytical SQL reports covering monthly sales, top-selling items, low-stock alerts, customer LTV, seller sales, and audit trails.
- Strategic B-Tree indexes: `idx_products_stock_active`, `idx_orders_status_date`, and `idx_payments_status_method`.
- Empirical `EXPLAIN` analysis: eliminated full table scans (`ALL` $\to$ `range`), reducing examined rows by up to 78% with 100% filter selectivity.
- Documentation: [`docs/query-optimization.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/query-optimization.md).

### Phase 4 — Security, RBAC, Transactions & Automated Testing (20 Marks)
- Salted password hashing via `bcryptjs` (10 rounds); plain-text passwords never stored.
- Stateless authentication via cryptographically signed JSON Web Tokens (JWT).
- Role-Based Access Control (RBAC): enforces customer order isolation and administrative privilege checks on backend routes.
- Real ACID Database Transactions (`START TRANSACTION`, `SELECT ... FOR UPDATE`, `COMMIT`, `ROLLBACK`) for order checkout to prevent overselling and race conditions.
- Automated test suite with **21 automated tests** covering registration, login, stock checks, rollback, isolation, and cancellations (100% pass rate).
- Test Report: [`docs/test-cases.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/test-cases.md).

### Phase 5 — Website Integration, Admin Dashboard & DBMS Insights (20 Marks)
- Full-featured fashion shopping frontend preserving original Fashionista branding, hero banner, and responsive styling.
- Responsive Admin Dashboard (`/admin`) with real-time KPI overview, product management (CRUD), seller directory, and interactive report tables.
- Presentation-ready DBMS Insights page (`/dbms-insights`) with live metadata directly from MySQL `information_schema`.

---

## 3. Database Schema Overview

```
customers (customer_id, name, email, password_hash, phone, address, role, created_at)
sellers (seller_id, seller_name, email, phone, address, created_at)
products (product_id, product_name, description, category, price, stock, image_url, seller_id, is_active, created_at)
orders (order_id, customer_id, order_date, total_amount, status)
order_details (order_detail_id, order_id, product_id, quantity, unit_price)
payments (payment_id, order_id, payment_date, amount, payment_method, payment_status)
deliveries (delivery_id, order_id, delivery_address, delivery_date, delivery_status)
```

Cardinality rules:
- `Orders` $\to$ `Deliveries`: **1 : 1** (Enforced by `UNIQUE KEY (order_id)`)
- `Customers` $\to$ `Orders`: **1 : N**
- `Sellers` $\to$ `Products`: **1 : N**
- `Orders` $\to$ `Order_Details`: **1 : N**
- `Orders` $\to$ `Payments`: **1 : N**

---

## 4. Quick Start & Execution Guide

### Prerequisites
- Node.js (v18.0 or newer)
- MySQL Server (v8.0 or newer) running on port `3306`

### Step 1: Backend Setup & Configuration
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Verify your MySQL credentials in `server/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ecommerce_management_db
   PORT=5000
   JWT_SECRET=fashionista_secure_jwt_secret_capstone_2026
   ```
3. Run the database seed script to populate sample data:
   ```bash
   npm run seed
   ```
4. Deploy stored procedures, functions, and triggers:
   ```bash
   npm run phase2
   ```
5. Deploy query optimization indexes:
   ```bash
   npm run explain
   ```
6. Start the Express API backend server:
   ```bash
   npm start
   ```
   Backend will be running at `http://localhost:5000`.

### Step 2: Frontend Setup & Configuration
1. Open a new terminal in the root project directory:
   ```bash
   npm install
   ```
2. Ensure `.env` exists with the backend API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be accessible at `http://localhost:5173`.
4. (Optional) Build for production:
   ```bash
   npm run build
   ```

---

## 5. Demo Accounts for Evaluation

Quick login buttons are available on the `/login` page:

| Account Type | Email | Password | Role / Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fashionista.com` | `Admin@123` | Full access to `/admin`, reports, product CRUD, and status updates |
| **Demo Customer** | `rahul@example.com` | `Password@123` | Standard shopper; cart, checkout, order history, profile |

---

## 6. Running the Automated Test Suite

To run all 21 automated backend tests against the live MySQL database:
```bash
cd server
npm test
```
Or directly:
```bash
node server/tests/run-tests.js
```

---

## 7. Key REST API Endpoints

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and database heartbeat |
| `GET` | `/api/products` | Public | Filtered and sorted product catalogue |
| `GET` | `/api/products/:id` | Public | Single product details with merchant info |
| `GET` | `/api/categories` | Public | Distinct categories with product counts |
| `POST` | `/api/auth/register` | Public | Customer registration with bcrypt hashing |
| `POST` | `/api/auth/login` | Public | JWT issue & credential validation |
| `GET` | `/api/customers/me` | Customer | Authenticated profile retrieval |
| `PUT` | `/api/customers/me` | Customer | Update shipping address and phone |
| `POST` | `/api/orders/checkout` | Customer | ACID database transaction checkout |
| `GET` | `/api/orders` | Customer / Admin | Order history (isolated per customer) |
| `GET` | `/api/orders/:id` | Customer / Admin | Single order details & line items |
| `PUT` | `/api/orders/:id/cancel` | Customer / Admin | Cancel order & restore inventory |
| `GET` | `/api/admin/overview` | Admin | Real-time aggregate dashboard KPIs |
| `GET` | `/api/admin/products` | Admin | Full product listing with management tools |
| `POST` | `/api/admin/products` | Admin | Create new catalogue product |
| `PUT` | `/api/admin/products/:id` | Admin | Update pricing, stock, or active state |
| `GET` | `/api/admin/orders` | Admin | All orders across customers |
| `PUT` | `/api/admin/orders/:id/status`| Admin | Update status via `sp_update_order_status` |
| `GET` | `/api/reports/:name` | Admin | Phase 3 SQL analytical reports |
| `GET` | `/api/dbms-insights` | Public | Live MySQL schema metadata & routines |

---

## 8. Documentation Files Directory

- [`docs/database-design.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/database-design.md) — Relational schema, ER diagram, cardinalities, 3NF normalization.
- [`docs/ER_Diagram.drawio`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/ER_Diagram.drawio) — Editable Draw.io diagram specification.
- [`docs/query-optimization.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/query-optimization.md) — Index optimization and empirical `EXPLAIN` comparisons.
- [`docs/test-cases.md`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/docs/test-cases.md) — Full test execution log of all 21 test cases.
- [`server/sql/schema.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/schema.sql) — Exact MySQL DDL schema.
- [`server/sql/seed.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/seed.sql) — Idempotent dataset seed script (55 products).
- [`server/sql/phase2_procedures_triggers.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/phase2_procedures_triggers.sql) — Procedures, functions, and triggers.
- [`server/sql/phase3_reports.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/phase3_reports.sql) — Phase 3 analytical SQL queries.
- [`server/sql/phase3_indexes.sql`](file:///e:/Sem%203/Database%20Management%20Systems/Capstone%20Project/server/sql/phase3_indexes.sql) — Index creation script.
