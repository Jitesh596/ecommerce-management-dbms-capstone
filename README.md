# Fashionista — Premium E-Commerce Shopping Platform

**Fashionista** is a full-stack, enterprise-ready fashion e-commerce shopping platform. It expands the original minimalist Fashionista visual identity into a comprehensive shopping experience featuring 48+ realistic fashion products across 13 categories, full MySQL relational database persistence, JWT authentication, cart and wishlist management, promo coupon engine, secure checkout with safe payment simulation, customer order tracking, and a dedicated Administrative Management Panel.

---

## 🌟 Key Highlights & Architectural Principles

- **Preserved Visual Identity**: Retains the clean, minimalist black-and-white fashion design, typography, color accents, pill-shaped buttons, and responsive grid layouts.
- **Pure Relational Database Backing**: Completely decoupled from external mock APIs. All 48+ products, 13 categories, customer accounts, orders, reviews, and inventory levels are stored in MySQL (`ecommerce_management_db`).
- **Secure Authentication**: Salted password hashing with `bcryptjs`, tamper-proof `jsonwebtoken` (JWT) session tokens, and strict role-based access control (Customer vs. Admin).
- **Transactional Order Placement**: Database ACID transactions ensure that orders, order details, payments, deliveries, and stock reductions are committed atomically.
- **Customer Privacy**: Regular customers can only access their own orders and profile data. Admin routes and financial reports are locked to unauthorized users with HTTP `403 Forbidden`.

---

## 🛍️ Features Overview

### 1. Homepage & Storefront
- **Promotional Hero Banner**: Visual summer hero with direct call-to-action button.
- **Interactive Flash Sale Banner**: Live ticking countdown timer with promo code `FASHION20`.
- **Department Quick Circles**: Instant category filtering for Men, Women, and Accessories.
- **Filter & Search Toolbar**:
  - Live full-text search across titles, descriptions, categories, and brands.
  - Category filter pills (All, Men's Clothing, Women's Clothing, T-Shirts, Shirts, Jeans, Trousers, Dresses, Jackets, Hoodies, Shoes, Bags, Watches, Accessories).
  - Price range selector (`Under ₹1,000`, `₹1,000 - ₹2,500`, `₹2,500 - ₹5,000`, `Above ₹5,000`).
  - Size filtering (`XS`, `S`, `M`, `L`, `XL`, `XXL`).
  - Multi-criteria sorting (Featured First, Price: Low to High, Price: High to Low, Customer Rating, Newest Arrivals).
- **Curated Collections**: Men's Collection showcase, Women's Designer showcase, and Accessories spotlights.
- **Featured Designer Brands**: Sartoria Roma, Atelier Mode, Cuero Milano, Rebel Moto, Nordic Storm, Heritage Club, and Chronos Geneve.
- **Customer Reviews & Testimonials**: Verified customer feedback with 5-star ratings.
- **Newsletter Subscription**: Working subscription feedback mechanism.
- **Professional Footer**: Useful navigation, customer service details, store policies, and contact information.

### 2. Product Details Page
- High-resolution fashion imagery and responsive product card layouts.
- Dynamic discount percentage badges (`-20% OFF`), `NEW` arrival badges, and `HOT` trending labels.
- Live stock availability badge (`In Stock (X units)` or `Only X left in stock!`).
- Size and Color selectors with active selection indicators.
- Quantity counter with upper-bound stock constraints.
- Verified customer reviews list with star rating breakdown.
- **Write a Review Form**: Logged-in customers can submit ratings and comments, automatically recalculating the product's average rating in the database.
- **Related Products Carousel**: Contextual recommendations from the same category.

### 3. Shopping Cart & Wishlist
- Add to cart with specific size, color, and quantity.
- Real-time subtotal, discount, delivery charges, and grand total calculations.
- Quantity increment and decrement controls.
- Promo coupon engine supporting:
  - `FASHION20`: 20% discount up to ₹1,000
  - `FIRST50`: Flat ₹50 discount
  - `SUMMER15`: 15% discount up to ₹750
- Free shipping threshold (Free delivery on orders over ₹999, else ₹99).
- Synchronized cart and wishlist: Logged-in customers sync with MySQL; guest shoppers maintain local session state.
- Empty cart and empty wishlist states with easy "Continue Shopping" CTAs.

### 4. Checkout & Order Tracking
- Complete shipping address capture (Name, Phone, Street, City, State, PIN code).
- Order summary review with breakdown of savings and delivery fee.
- **Safe Demo Payment Simulation**:
  - Instant Demo Payment (Simulated test cards, UPI QR simulation)
  - Cash on Delivery (COD)
- Atomic MySQL transaction creates:
  - Order entry in `orders`
  - Item details in `order_details`
  - Payment record in `payments`
  - Delivery dispatch in `deliveries`
  - Decrements live inventory in `products`
  - Clears purchased items from `cart_items`
- **Order Tracking Timeline**: Interactive 5-step status progression bar:
  `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`

### 5. User Account & Profile
- Toggleable Login and Registration modal.
- Profile management page (`/profile`):
  - View account email and registration status.
  - Update full name, phone number, and default delivery address.
  - Change password with existing password verification and bcrypt hashing.
  - Quick links to Order History, Wishlist, and Cart.

### 6. Admin Management Dashboard (`/admin`)
- Accessible strictly to users with `role = 'admin'`.
- **Overview Metrics**:
  - Total Products count
  - Total Sales Revenue (₹)
  - Total Orders count
  - Total Customers count
  - Critical Inventory Alert (< 15 units in stock)
- **Product Management**:
  - Filterable and searchable table of all catalog products.
  - "Add New Product" modal with image URL, price, discount, sizes, colors, and stock.
  - "Edit Product" modal to update pricing, inventory, and details.
  - "Deactivate Product" (soft delete) to hide out-of-season items.
- **Order Management**:
  - Table of all orders across all customers.
  - Real-time Order Status dropdown selector (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) which immediately syncs delivery statuses in the database.
- **Category Management**:
  - View all categories and product counts.
  - Add new categories.
- **Customer Directory**:
  - View registered customers, order counts, and total lifetime spend.

---

## 🔐 Demo Credentials

Use these pre-configured accounts for testing:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fashionista.com` | `admin123` | Full access to Admin Panel (`/admin`), Product/Order/Category management |
| **Customer** | `customer@fashionista.com` | `password123` | Shopping, cart, wishlist, placing orders, writing reviews, order tracking |
| **Customer 2** | `rahul@example.com` | `password123` | Regular customer shopping account |

*(You can also click "Register" on the Login page to create a brand new account at any time).*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, React Router DOM 6, Axios, Context API, CSS3.
- **Backend**: Node.js, Express 5, CORS, Dotenv.
- **Database**: MySQL 8+ with `mysql2/promise` connection pooling.
- **Security**: `bcryptjs` (password salting & hashing), `jsonwebtoken` (JWT bearer tokens).

---

## 📁 Project Directory Structure

```text
fashionista/
├── server/
│   ├── middleware/
│   │   └── auth.js             # JWT verification and Admin role checks
│   ├── routes/
│   │   ├── auth.js             # /api/auth (register, login, me, profile)
│   │   ├── products.js         # /api/products (CRUD, search, filters)
│   │   ├── categories.js       # /api/categories (CRUD)
│   │   ├── cart.js             # /api/cart (CRUD, stock check)
│   │   ├── wishlist.js         # /api/wishlist (CRUD)
│   │   ├── orders.js           # /api/orders (transactional checkout & status)
│   │   ├── reviews.js          # /api/products/:id/reviews
│   │   └── reports.js          # /api/reports (admin dashboard & analytics)
│   ├── database_schema.sql     # Full SQL schema DDL & initial setup script
│   ├── migrate-and-seed.js     # Database migration & catalog seed script
│   ├── test-all-apis.js        # Basic API smoke test suite
│   ├── comprehensive-test.js   # 32-point end-to-end automated verification suite
│   ├── db.js                   # MySQL connection pool configuration
│   ├── server.js               # Express server entry point
│   ├── .env                    # Database credentials & JWT secret
│   └── package.json            # Backend dependencies
├── src/
│   ├── assets/images/          # Existing branding assets & user photos
│   ├── components/
│   │   ├── Navbar.jsx          # Top bar, search, cart/wishlist counters, account menu
│   │   └── Footer.jsx          # Footer links, newsletter, store policies
│   ├── context/
│   │   ├── AuthContext.jsx     # User authentication state & JWT session management
│   │   └── CartContext.jsx     # Cart, wishlist, coupon, & price calculations
│   ├── pages/
│   │   ├── Home.jsx            # Expanded homepage with filters, curated collections, & catalog
│   │   ├── ProductDetails.jsx  # Product detail view, size/color selectors, reviews, related
│   │   ├── Cart.jsx            # Shopping cart, quantity controls, coupons, delivery rules
│   │   ├── Wishlist.jsx        # Saved wishlist page
│   │   ├── Checkout.jsx        # Checkout form, demo payments, order placement
│   │   ├── Orders.jsx          # Order history & 5-step status tracking timeline
│   │   ├── Login.jsx           # Sign in & registration with quick demo account fills
│   │   ├── Profile.jsx         # Profile management & password updates
│   │   └── Admin.jsx           # Admin Dashboard (stats, products, orders, categories, customers)
│   ├── services/
│   │   └── api.js              # Centralized Axios client with JWT interceptor
│   ├── App.jsx                 # Routing configuration
│   ├── main.jsx                # React root with AuthProvider & CartProvider
│   └── style.css               # Clean styling preserving Fashionista visual identity
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration with /api reverse proxy
└── package.json                # Frontend dependencies & npm scripts
```

---

## 🚀 Installation & Execution Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MySQL Server** (running on port 3306)

### 2. Configure Backend Environment
Ensure the `server/.env` file contains your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_management_db
PORT=5000
JWT_SECRET=fashionista_jwt_secret_token_key_2026_xyz
```

### 3. Database Migration & Catalog Seeding
Run the database migration and catalog expansion script to create all tables and populate the 48+ realistic fashion items, categories, reviews, and test accounts:
```bash
node server/migrate-and-seed.js
```

### 4. Start the Express Backend Server
```bash
npm run server
# Or: cd server && npm start
```
The backend API will run at `http://localhost:5000`.

### 5. Start the Vite React Frontend
In a separate terminal:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` HTTP header.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer account (hashes password with bcrypt) |
| `POST` | `/api/auth/login` | Public | Log in and receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update name, phone, address, or change password |
| `POST` | `/api/auth/logout` | Authenticated | Log out current session |

### Products (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Fetch products (supports `search`, `category`, `minPrice`, `maxPrice`, `size`, `color`, `sort`, `featured`, `trending`, `newArrival`, `page`, `limit`) |
| `GET` | `/api/products/:id` | Public | Get single product with reviews and related category items |
| `POST` | `/api/products` | Admin | Create a new product in MySQL |
| `PUT` | `/api/products/:id` | Admin | Update existing product details, price, or stock |
| `DELETE` | `/api/products/:id` | Admin | Soft-delete / deactivate product or permanent removal |

### Categories (`/api/categories`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Get all categories with active product counts |
| `POST` | `/api/categories` | Admin | Create a new product category |
| `PUT` | `/api/categories/:id` | Admin | Update existing category |
| `DELETE` | `/api/categories/:id` | Admin | Delete a category |

### Cart (`/api/cart`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Authenticated | Retrieve customer's cart with items and subtotal |
| `POST` | `/api/cart` | Authenticated | Add item to cart with stock validation |
| `PUT` | `/api/cart/:id` | Authenticated | Update quantity of a cart item |
| `DELETE` | `/api/cart/:id` | Authenticated | Remove single item from cart |
| `DELETE` | `/api/cart` | Authenticated | Clear all items from cart |

### Wishlist (`/api/wishlist`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | Authenticated | Get customer's saved favorite products |
| `POST` | `/api/wishlist` | Authenticated | Add product to wishlist |
| `DELETE` | `/api/wishlist/:id` | Authenticated | Remove product from wishlist |

### Orders & Checkout (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Authenticated | Get order history (Customers get their own; Admin gets all) |
| `GET` | `/api/orders/:id` | Authenticated | Get detailed order summary (strictly isolated per user) |
| `POST` | `/api/orders` | Authenticated | Place order with stock decrement, coupon, delivery & payment creation |
| `PUT` | `/api/orders/:id/status`| Admin | Update order status (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) |

### Reviews (`/api/products/:id/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products/:id/reviews` | Public | Get reviews for a specific product |
| `POST` | `/api/products/:id/reviews` | Authenticated | Submit star rating (1-5) and comment; recalculates average rating |

### Admin Reports (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | Admin | High-level metrics: total products, customers, orders, revenue, low stock |
| `GET` | `/api/reports/sales` | Admin | Revenue by order status and monthly breakdown |
| `GET` | `/api/reports/products` | Admin | Low-stock alert table and top-selling products list |
| `GET` | `/api/reports/customers` | Admin | Complete customer roster with order totals and lifetime spend |

---

## 🧪 Automated End-to-End Testing

A complete automated test suite is provided in `server/comprehensive-test.js`. It tests all 32 core requirements against the live database:
```bash
node -e "const app = require('./server/server'); const s = app.listen(5000, () => { const child = require('child_process').fork('./server/comprehensive-test.js'); child.on('exit', (code) => { s.close(() => process.exit(code)); }); });"
```

Output:
```text
==========================================================
  FASHIONISTA E-COMMERCE END-TO-END VERIFICATION SUITE  
==========================================================
PASS: Backend health check responds with 200 online
PASS: Categories fetched from database (13 categories)
PASS: Products loaded from database (48 products)
PASS: Product search by keyword filter works
PASS: Category filtering works correctly
PASS: Price ascending sorting works correctly
PASS: Single product detail with related products loads correctly
PASS: Customer registration creates user with bcrypt hash & JWT token
PASS: Customer login succeeds with verified password
PASS: Customer profile retrieved via GET /api/auth/me
PASS: Customer profile update works
PASS: Product added and fetched from wishlist in MySQL
PASS: Product removed from wishlist
PASS: Product added to cart with size and quantity
PASS: Cart quantity updated via PUT /api/cart/:id
PASS: Stock validation correctly blocked excessive order quantity (400)
PASS: Order placed successfully via checkout API
PASS: Product stock decremented in MySQL
PASS: Cart cleared automatically after order placement
PASS: Delivery record created with status 'Processing'
PASS: Payment record created with status 'Paid'
PASS: Customer can fetch their own order history
PASS: Access isolation verified: Customer B blocked (403 Forbidden) from viewing Customer A's order
PASS: Access control verified: Regular customer blocked (403 Forbidden) from Admin routes
PASS: Admin login succeeds with admin privileges
PASS: Admin can view total orders, sales and dashboard statistics
PASS: Admin can create new products in database
PASS: Admin can edit product details in database
PASS: Admin can update order status to 'Shipped'
PASS: Admin can deactivate products (soft delete)
PASS: Customer can submit product reviews to database
PASS: Product reviews retrieved and updated in database
==========================================================
TOTAL TESTS: 32 | PASSED: 32 | FAILED: 0
==========================================================
ALL 25 COMPREHENSIVE SYSTEM TESTS PASSED PERFECTLY! 🎉
```

---

## 📜 Database Schema Summary

The database includes the following relational tables in `ecommerce_management_db`:
1. `customers`: User accounts with bcrypt password hashes, contact details, and `role` (`customer` or `admin`).
2. `categories`: 13 product categories with slug and descriptive metadata.
3. `products`: 48+ realistic fashion items with regular and discount pricing, brand, sizes, colors, rating, stock levels, and active status.
4. `sellers`: Verified vendor and partner boutique records.
5. `cart` & `cart_items`: User carts with product, selected size, color, and quantity.
6. `wishlist`: Customer saved items with unique constraints.
7. `orders`: Orders with shipping address, coupon deductions, delivery fees, and order status.
8. `order_details`: Line items per order linking to products with unit prices and size/color tags.
9. `payments`: Payment audit trail with payment method and status (`Paid`, `Pending`, `Failed`).
10. `deliveries`: Courier delivery tracking with current shipment status.
11. `reviews`: Verified buyer star ratings and feedback comments.

A full exportable DDL file is preserved at [`server/database_schema.sql`](./server/database_schema.sql).
