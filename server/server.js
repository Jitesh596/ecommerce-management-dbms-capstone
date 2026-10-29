const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const pool = require("./db");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fashionista_secure_jwt_secret_capstone_2026";

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ============================================================================
// AUTHENTICATION & RBAC MIDDLEWARES
// ============================================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Authentication token required." });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired authentication token." });
    }
    req.user = decodedUser;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Administrative privileges required." });
  }
  next();
}

// Optional Auth (attaches req.user if token present, but does not reject if absent)
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    req.user = err ? null : decodedUser;
    next();
  });
}

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      customer_id: user.customer_id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ============================================================================
// SYSTEM & HEALTH ENDPOINTS
// ============================================================================
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS db, NOW() AS server_time");
    res.json({
      status: "healthy",
      database: rows[0].db,
      server_time: rows[0].server_time,
      message: "Fashionista DBMS backend is operational."
    });
  } catch (error) {
    res.status(500).json({
      status: "degraded",
      error: error.message
    });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters in length." });
    }

    // Check for duplicate email
    const [existing] = await pool.execute("SELECT customer_id FROM customers WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    // Password hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Enforce role: customers cannot self-assign admin
    const enforcedRole = "customer";

    const [result] = await pool.execute(
      `INSERT INTO customers (name, email, password_hash, phone, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, phone || null, address || null, enforcedRole]
    );

    const newCustomerId = result.insertId;
    const user = {
      customer_id: newCustomerId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      address: address || null,
      role: enforcedRole
    };

    const token = generateToken(user);

    res.status(201).json({
      message: "Customer account registered successfully.",
      token,
      user
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Server error during registration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [customers] = await pool.execute(
      "SELECT customer_id, name, email, password_hash, phone, address, role FROM customers WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (customers.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const customer = customers[0];

    if (!customer.password_hash) {
      return res.status(401).json({ error: "Account password not initialized. Please reset password." });
    }

    const isValidPassword = await bcrypt.compare(password, customer.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = {
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      role: customer.role
    };

    const token = generateToken(user);

    res.json({
      message: "Login successful.",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Server error during login." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Successfully logged out." });
});

app.get("/api/customers/me", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT customer_id, name, email, phone, address, role, created_at FROM customers WHERE customer_id = ?",
      [req.user.customer_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer record not found." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ error: "Could not fetch customer profile." });
  }
});

app.put("/api/customers/me", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    await pool.execute(
      "UPDATE customers SET name = ?, phone = ?, address = ? WHERE customer_id = ?",
      [name.trim(), phone || null, address || null, req.user.customer_id]
    );

    const [updated] = await pool.execute(
      "SELECT customer_id, name, email, phone, address, role FROM customers WHERE customer_id = ?",
      [req.user.customer_id]
    );

    res.json({
      message: "Profile updated successfully.",
      user: updated[0]
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ error: "Could not update customer profile." });
  }
});

// ============================================================================
// PRODUCT CATALOGUE ENDPOINTS
// ============================================================================
app.get("/api/products", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page, limit } = req.query;

    let query = `
      SELECT
        p.product_id,
        p.product_name,
        p.description,
        p.category,
        p.price,
        p.stock,
        p.image_url,
        p.seller_id,
        p.is_active,
        p.created_at,
        s.seller_name
      FROM products p
      LEFT JOIN sellers s ON p.seller_id = s.seller_id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category && category !== "All" && category.trim() !== "") {
      query += " AND p.category = ?";
      params.push(category.trim());
    }

    if (search && search.trim() !== "") {
      query += " AND (p.product_name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)";
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (minPrice !== undefined && minPrice !== "") {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        query += " AND p.price >= ?";
        params.push(min);
      }
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        query += " AND p.price <= ?";
        params.push(max);
      }
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        query += " ORDER BY p.price ASC";
        break;
      case "price_desc":
        query += " ORDER BY p.price DESC";
        break;
      case "name_asc":
        query += " ORDER BY p.product_name ASC";
        break;
      case "stock_asc":
        query += " ORDER BY p.stock ASC";
        break;
      case "newest":
      default:
        query += " ORDER BY p.product_id DESC";
        break;
    }

    // Pagination if requested
    if (limit && Number(limit) > 0) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Number(limit));
      const offset = (pageNum - 1) * limitNum;

      // Count total matching
      const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS subq`;
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      query += ` LIMIT ${limitNum} OFFSET ${offset}`;
      const [products] = await pool.query(query, params);

      return res.json({
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        products
      });
    }

    const [products] = await pool.query(query, params);
    res.json(products);
  } catch (error) {
    console.error("Products API error:", error.message);
    res.status(500).json({ error: "Could not fetch products from the database." });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT category, COUNT(*) AS count
      FROM products
      WHERE is_active = TRUE AND category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `);
    res.json(categories);
  } catch (error) {
    console.error("Categories API error:", error.message);
    res.status(500).json({ error: "Could not fetch product categories." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: "Invalid product ID." });
    }

    const [products] = await pool.execute(
      `SELECT
         p.product_id,
         p.product_name,
         p.description,
         p.category,
         p.price,
         p.stock,
         p.image_url,
         p.seller_id,
         p.is_active,
         p.created_at,
         s.seller_name,
         s.email AS seller_email,
         s.phone AS seller_phone
       FROM products p
       LEFT JOIN sellers s ON p.seller_id = s.seller_id
       WHERE p.product_id = ? AND p.is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found or inactive." });
    }

    res.json(products[0]);
  } catch (error) {
    console.error("Product API error:", error.message);
    res.status(500).json({ error: "Could not fetch the product." });
  }
});

// ============================================================================
// ORDERS & TRANSACTIONAL CHECKOUT
// ============================================================================
app.post("/api/orders/checkout", authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const customerId = req.user.customer_id;
    const { items, delivery_address, payment_method } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Checkout requires a non-empty list of items." });
    }

    // Clean address
    let shippingAddress = delivery_address && delivery_address.trim() !== "" ? delivery_address.trim() : null;
    if (!shippingAddress) {
      const [cust] = await conn.execute("SELECT address FROM customers WHERE customer_id = ?", [customerId]);
      shippingAddress = (cust[0] && cust[0].address) || "Delivery Address on File";
    }

    // Valid payment methods
    const allowedMethods = ["UPI Demo", "Card Demo", "Cash on Delivery"];
    const chosenMethod = allowedMethods.includes(payment_method) ? payment_method : "UPI Demo";

    // BEGIN DATABASE TRANSACTION
    await conn.beginTransaction();

    let serverTotal = 0;
    const orderItemsToInsert = [];

    // Authoritative verification with row-level locks
    for (const item of items) {
      const pid = Number(item.product_id || item.id);
      const qty = Number(item.quantity);

      if (!Number.isInteger(pid) || pid <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Invalid product ID: ${item.product_id}` });
      }

      if (!Number.isInteger(qty) || qty <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Invalid item quantity (${qty}) for product #${pid}. Quantity must be positive.` });
      }

      // Read authoritative price & stock with FOR UPDATE lock
      const [rows] = await conn.execute(
        "SELECT product_id, product_name, price, stock, is_active FROM products WHERE product_id = ? FOR UPDATE",
        [pid]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: `Product #${pid} was not found in the database.` });
      }

      const dbProduct = rows[0];

      if (!dbProduct.is_active) {
        await conn.rollback();
        return res.status(400).json({ error: `Product "${dbProduct.product_name}" is currently unavailable/inactive.` });
      }

      if (dbProduct.stock < qty) {
        await conn.rollback();
        return res.status(400).json({
          error: `Insufficient stock for "${dbProduct.product_name}". Requested: ${qty}, Available: ${dbProduct.stock}.`
        });
      }

      const unitPrice = Number(dbProduct.price);
      serverTotal += unitPrice * qty;

      orderItemsToInsert.push({
        product_id: pid,
        quantity: qty,
        unit_price: unitPrice
      });
    }

    // 1. Insert Orders Record
    const orderStatus = "Confirmed";
    const [orderResult] = await conn.execute(
      "INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES (?, NOW(), ?, ?)",
      [customerId, serverTotal, orderStatus]
    );
    const newOrderId = orderResult.insertId;

    // 2. Insert Order Details & Update Stock Atomically
    for (const line of orderItemsToInsert) {
      await conn.execute(
        "INSERT INTO order_details (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [newOrderId, line.product_id, line.quantity, line.unit_price]
      );

      // Decrement stock
      await conn.execute(
        "UPDATE products SET stock = stock - ? WHERE product_id = ?",
        [line.quantity, line.product_id]
      );
    }

    // 3. Insert Payment Record
    const paymentStatus = chosenMethod === "Cash on Delivery" ? "Pending" : "Paid";
    const paymentDate = paymentStatus === "Paid" ? new Date() : null;

    await conn.execute(
      `INSERT INTO payments (order_id, payment_date, amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?)`,
      [newOrderId, paymentDate, serverTotal, chosenMethod, paymentStatus]
    );

    // 4. Insert Delivery Record
    await conn.execute(
      `INSERT INTO deliveries (order_id, delivery_address, delivery_date, delivery_status)
       VALUES (?, ?, NULL, 'Processing')`,
      [newOrderId, shippingAddress]
    );

    // COMMIT TRANSACTION
    await conn.commit();

    res.status(201).json({
      message: "Order placed successfully!",
      order_id: newOrderId,
      total_amount: serverTotal,
      status: orderStatus,
      payment_method: chosenMethod,
      payment_status: paymentStatus,
      delivery_address: shippingAddress
    });
  } catch (error) {
    await conn.rollback();
    console.error("Checkout transaction error:", error.message);
    res.status(500).json({ error: "Checkout transaction failed: " + error.message });
  } finally {
    conn.release();
  }
});

// Customer's Orders or Admin's All Orders
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === "admin";
    let query = `
      SELECT
        o.order_id,
        o.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        o.order_date,
        o.total_amount,
        o.status,
        p.payment_status,
        p.payment_method,
        d.delivery_status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id
    `;
    const params = [];

    if (!isUserAdmin) {
      query += " WHERE o.customer_id = ?";
      params.push(req.user.customer_id);
    }

    query += " ORDER BY o.order_id DESC";

    const [orders] = await pool.query(query, params);
    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.status(500).json({ error: "Could not fetch orders." });
  }
});

// Get Single Order Details
app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const [orders] = await pool.execute(
      `SELECT
         o.order_id,
         o.customer_id,
         c.name AS customer_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         o.order_date,
         o.total_amount,
         o.status,
         p.payment_id,
         p.payment_date,
         p.amount AS payment_amount,
         p.payment_method,
         p.payment_status,
         d.delivery_id,
         d.delivery_address,
         d.delivery_date,
         d.delivery_status
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       LEFT JOIN payments p ON o.order_id = p.order_id
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = orders[0];

    // Authorization check: Customer cannot view another customer's order
    if (req.user.role !== "admin" && order.customer_id !== req.user.customer_id) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to view this order." });
    }

    // Line items
    const [items] = await pool.execute(
      `SELECT
         od.order_detail_id,
         od.product_id,
         p.product_name,
         p.image_url,
         p.category,
         od.quantity,
         od.unit_price,
         (od.quantity * od.unit_price) AS line_total
       FROM order_details od
       JOIN products p ON od.product_id = p.product_id
       WHERE od.order_id = ?`,
      [orderId]
    );

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error("Get order detail error:", error.message);
    res.status(500).json({ error: "Could not fetch order details." });
  }
});

// Cancel Order
app.put("/api/orders/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const [orders] = await pool.execute(
      "SELECT customer_id, status FROM orders WHERE order_id = ?",
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = orders[0];

    if (req.user.role !== "admin" && order.customer_id !== req.user.customer_id) {
      return res.status(403).json({ error: "Forbidden: You cannot cancel another user's order." });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ error: "Delivered orders cannot be cancelled." });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    // Execute Stored Procedure sp_update_order_status to atomically cancel & restore stock
    await pool.query("CALL sp_update_order_status(?, 'Cancelled')", [orderId]);

    res.json({
      message: `Order #${orderId} has been successfully cancelled and inventory restored.`,
      status: "Cancelled"
    });
  } catch (error) {
    console.error("Cancel order error:", error.message);
    res.status(500).json({ error: error.message || "Could not cancel order." });
  }
});

// ============================================================================
// ADMIN MANAGEMENT ENDPOINTS
// ============================================================================
app.get("/api/admin/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [custCount] = await pool.query("SELECT COUNT(*) AS total FROM customers WHERE role = 'customer'");
    const [sellCount] = await pool.query("SELECT COUNT(*) AS total FROM sellers");
    const [prodCount] = await pool.query("SELECT COUNT(*) AS total FROM products WHERE is_active = 1");
    const [ordCount] = await pool.query("SELECT COUNT(*) AS total FROM orders");
    const [paidSales] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'Paid'");
    const [pendingOrders] = await pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'Pending'");
    const [lowStock] = await pool.query("SELECT COUNT(*) AS total FROM products WHERE stock <= 15 AND is_active = 1");

    res.json({
      total_customers: custCount[0].total,
      total_sellers: sellCount[0].total,
      active_products: prodCount[0].total,
      total_orders: ordCount[0].total,
      paid_sales_total: Number(paidSales[0].total),
      pending_orders: pendingOrders[0].total,
      low_stock_products: lowStock[0].total
    });
  } catch (error) {
    console.error("Admin overview error:", error.message);
    res.status(500).json({ error: "Could not fetch admin overview statistics." });
  }
});

app.get("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, s.seller_name
      FROM products p
      LEFT JOIN sellers s ON p.seller_id = s.seller_id
      ORDER BY p.product_id DESC
    `);
    res.json(products);
  } catch (error) {
    console.error("Admin get products error:", error.message);
    res.status(500).json({ error: "Could not fetch products." });
  }
});

app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { product_name, description, category, price, stock, image_url, seller_id } = req.body;

    if (!product_name || price === undefined || stock === undefined || !seller_id) {
      return res.status(400).json({ error: "Product name, price, stock, and seller_id are required." });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);
    const numSeller = Number(seller_id);

    if (numPrice < 0 || numStock < 0) {
      return res.status(400).json({ error: "Price and stock must be non-negative." });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (product_name, description, category, price, stock, image_url, seller_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [product_name.trim(), description || null, category || "Fashion", numPrice, numStock, image_url || null, numSeller]
    );

    res.status(201).json({
      message: "Product created successfully.",
      product_id: result.insertId
    });
  } catch (error) {
    console.error("Admin create product error:", error.message);
    res.status(500).json({ error: "Could not create product: " + error.message });
  }
});

app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { product_name, description, category, price, stock, image_url, seller_id, is_active } = req.body;

    const [existing] = await pool.execute("SELECT product_id FROM products WHERE product_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    await pool.execute(
      `UPDATE products
       SET product_name = COALESCE(?, product_name),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           price = COALESCE(?, price),
           stock = COALESCE(?, stock),
           image_url = COALESCE(?, image_url),
           seller_id = COALESCE(?, seller_id),
           is_active = COALESCE(?, is_active)
       WHERE product_id = ?`,
      [
        product_name !== undefined ? product_name.trim() : null,
        description !== undefined ? description : null,
        category !== undefined ? category : null,
        price !== undefined ? Number(price) : null,
        stock !== undefined ? Number(stock) : null,
        image_url !== undefined ? image_url : null,
        seller_id !== undefined ? Number(seller_id) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    );

    res.json({ message: "Product updated successfully." });
  } catch (error) {
    console.error("Admin update product error:", error.message);
    res.status(500).json({ error: "Could not update product: " + error.message });
  }
});

app.get("/api/admin/sellers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [sellers] = await pool.query(`
      SELECT
        s.*,
        COUNT(p.product_id) AS products_count,
        COALESCE(SUM(p.stock), 0) AS total_inventory
      FROM sellers s
      LEFT JOIN products p ON s.seller_id = p.seller_id
      GROUP BY s.seller_id
      ORDER BY s.seller_id ASC
    `);
    res.json(sellers);
  } catch (error) {
    console.error("Admin get sellers error:", error.message);
    res.status(500).json({ error: "Could not fetch sellers." });
  }
});

app.post("/api/admin/sellers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { seller_name, email, phone, address } = req.body;
    if (!seller_name || !email) {
      return res.status(400).json({ error: "Seller name and email are required." });
    }

    const [existing] = await pool.execute("SELECT seller_id FROM sellers WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "A seller with this email already exists." });
    }

    const [result] = await pool.execute(
      "INSERT INTO sellers (seller_name, email, phone, address) VALUES (?, ?, ?, ?)",
      [seller_name.trim(), email.trim().toLowerCase(), phone || null, address || null]
    );

    res.status(201).json({
      message: "Seller registered successfully.",
      seller_id: result.insertId
    });
  } catch (error) {
    console.error("Admin create seller error:", error.message);
    res.status(500).json({ error: "Could not create seller: " + error.message });
  }
});

app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        o.total_amount,
        o.status,
        c.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        p.payment_method,
        p.payment_status,
        d.delivery_status,
        d.delivery_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      ORDER BY o.order_id DESC
    `);
    res.json(orders);
  } catch (error) {
    console.error("Admin get orders error:", error.message);
    res.status(500).json({ error: "Could not fetch orders." });
  }
});

app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status, delivery_status } = req.body;

    const allowedStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status value." });
    }

    if (status) {
      // Execute stored procedure sp_update_order_status
      await pool.query("CALL sp_update_order_status(?, ?)", [orderId, status]);
    }

    if (delivery_status) {
      await pool.execute(
        "UPDATE deliveries SET delivery_status = ? WHERE order_id = ?",
        [delivery_status, orderId]
      );
    }

    res.json({ message: `Order #${orderId} status successfully updated.` });
  } catch (error) {
    console.error("Admin update order status error:", error.message);
    res.status(500).json({ error: error.message || "Could not update status." });
  }
});

// ============================================================================
// PHASE 3 ANALYTICAL REPORTS ENDPOINTS
// ============================================================================
app.get("/api/reports/catalogue-sellers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.product_id, p.product_name, p.category, p.price, p.stock, s.seller_name, s.email AS seller_email, s.phone AS seller_phone
      FROM products p
      JOIN sellers s ON p.seller_id = s.seller_id
      WHERE p.is_active = 1
      ORDER BY p.category, p.price ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/monthly-sales", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY sale_month DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/customer-orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY cumulative_spent DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/top-selling", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/low-stock", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY p.stock ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/orders-by-status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        status AS order_status,
        COUNT(*) AS total_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS percentage,
        COALESCE(SUM(total_amount), 0.00) AS aggregate_order_value
      FROM orders
      GROUP BY status
      ORDER BY total_count DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/payments-by-status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(payment_method, 'Unspecified') AS payment_method,
        payment_status,
        COUNT(*) AS transactions_count,
        COALESCE(SUM(amount), 0.00) AS total_amount
      FROM payments
      GROUP BY payment_method, payment_status
      ORDER BY payment_status, transactions_count DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/sales-by-seller", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY total_sales_revenue DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/detailed-orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY o.order_id DESC, od.order_detail_id ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/subtotals-gst", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY o.order_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic reports dispatcher
app.get("/api/reports/:name", authenticateToken, requireAdmin, async (req, res) => {
  const mapping = {
    "catalogue-sellers": "/api/reports/catalogue-sellers",
    "monthly-sales": "/api/reports/monthly-sales",
    "customer-orders": "/api/reports/customer-orders",
    "top-selling": "/api/reports/top-selling",
    "low-stock": "/api/reports/low-stock",
    "orders-by-status": "/api/reports/orders-by-status",
    "payments-by-status": "/api/reports/payments-by-status",
    "sales-by-seller": "/api/reports/sales-by-seller",
    "detailed-orders": "/api/reports/detailed-orders",
    "subtotals-gst": "/api/reports/subtotals-gst"
  };
  const target = mapping[req.params.name];
  if (!target) {
    return res.status(404).json({ error: "Report not found." });
  }
  return res.redirect(target);
});

// ============================================================================
// DBMS INSIGHTS ENDPOINT (Academic Capstone Live Demo)
// ============================================================================
app.get("/api/dbms-insights", async (req, res) => {
  try {
    // 1. Table status & row counts
    const [tableStats] = await pool.query(`
      SELECT table_name, table_rows, data_length, index_length, create_time
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    // 2. Routines (Procedures & Functions)
    const [routines] = await pool.query(`
      SELECT routine_name, routine_type, dtd_identifier, routine_body, created
      FROM information_schema.routines
      WHERE routine_schema = DATABASE()
    `);

    // 3. Triggers
    const [triggers] = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = DATABASE()
    `);

    // 4. Indexes
    const [indexes] = await pool.query(`
      SELECT table_name, index_name, non_unique, column_name, seq_in_index
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
      ORDER BY table_name, index_name, seq_in_index
    `);

    res.json({
      database: process.env.DB_NAME || "ecommerce_management_db",
      tableStats,
      routines,
      triggers,
      indexes
    });
  } catch (error) {
    console.error("DBMS Insights error:", error.message);
    res.status(500).json({ error: "Could not fetch DBMS insights: " + error.message });
  }
});

// Start the server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Fashionista backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
