const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticateUser, JWT_SECRET } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please provide name, email, and password." });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: "Please enter a valid email address." });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }

        // Check if user already exists
        const [existing] = await pool.execute(
            "SELECT customer_id FROM customers WHERE email = ?",
            [trimmedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: "An account with this email address already exists." });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO customers (name, email, password_hash, phone, address, role)
             VALUES (?, ?, ?, ?, ?, 'customer')`,
            [name.trim(), trimmedEmail, password_hash, phone || null, address || null]
        );

        const customerId = result.insertId;

        const token = jwt.sign(
            { customer_id: customerId, email: trimmedEmail, name: name.trim(), role: "customer" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful! Welcome to Fashionista.",
            token,
            user: {
                customer_id: customerId,
                name: name.trim(),
                email: trimmedEmail,
                phone: phone || "",
                address: address || "",
                role: "customer"
            }
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter both email and password." });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const [rows] = await pool.execute(
            "SELECT customer_id, name, email, password_hash, phone, address, role FROM customers WHERE email = ?",
            [trimmedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = rows[0];

        if (!user.password_hash) {
            return res.status(401).json({ error: "Account password is not set. Please reset your password." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { customer_id: user.customer_id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                customer_id: user.customer_id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                address: user.address || "",
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error during login." });
    }
});

// GET /api/auth/me
router.get("/me", authenticateUser, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT customer_id, name, email, phone, address, role, created_at FROM customers WHERE customer_id = ?",
            [req.user.customer_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User account not found." });
        }

        res.json({ user: rows[0] });
    } catch (error) {
        console.error("Auth me error:", error);
        res.status(500).json({ error: "Could not fetch user profile." });
    }
});

// PUT /api/auth/profile
router.put("/profile", authenticateUser, async (req, res) => {
    try {
        const { name, phone, address, currentPassword, newPassword } = req.body;
        const customerId = req.user.customer_id;

        const [rows] = await pool.execute(
            "SELECT * FROM customers WHERE customer_id = ?",
            [customerId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const user = rows[0];
        let newHash = user.password_hash;

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: "Please provide your current password to set a new one." });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password does not match." });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters." });
            }
            newHash = await bcrypt.hash(newPassword, 10);
        }

        const updatedName = name ? name.trim() : user.name;
        const updatedPhone = phone !== undefined ? phone : user.phone;
        const updatedAddress = address !== undefined ? address : user.address;

        await pool.execute(
            `UPDATE customers 
             SET name = ?, phone = ?, address = ?, password_hash = ?
             WHERE customer_id = ?`,
            [updatedName, updatedPhone, updatedAddress, newHash, customerId]
        );

        res.json({
            message: "Profile updated successfully!",
            user: {
                customer_id: customerId,
                name: updatedName,
                email: user.email,
                phone: updatedPhone || "",
                address: updatedAddress || "",
                role: user.role
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Could not update user profile." });
    }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
    res.json({ message: "Logout successful." });
});

module.exports = router;
