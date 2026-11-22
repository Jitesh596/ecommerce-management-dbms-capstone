const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser, requireAdmin, optionalAuth } = require("../middleware/auth");

// GET /api/products
router.get("/", optionalAuth, async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            size,
            color,
            brand,
            sort,
            featured,
            trending,
            newArrival,
            limit,
            page,
            includeInactive
        } = req.query;

        let query = `
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.category,
                p.category_id,
                p.price,
                p.discount_price,
                p.stock,
                p.image_url,
                p.brand,
                p.sizes,
                p.colors,
                p.rating,
                p.rating_count,
                p.seller_id,
                p.is_active,
                p.is_featured,
                p.is_trending,
                p.is_new_arrival,
                p.created_at,
                s.seller_name
            FROM products p
            LEFT JOIN sellers s ON p.seller_id = s.seller_id
            WHERE 1=1
        `;

        const params = [];

        // Inactive products filter (only admins can view inactive products if requested)
        const isAdmin = req.user && req.user.role === "admin";
        if (!isAdmin || includeInactive !== "true") {
            query += " AND p.is_active = 1";
        }

        // Search query
        if (search && search.trim()) {
            query += " AND (p.product_name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)";
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Category filter
        if (category && category.trim() && category !== "All") {
            query += " AND (p.category = ? OR p.category LIKE ?)";
            params.push(category.trim(), `%${category.trim()}%`);
        }

        // Price range
        if (minPrice && !isNaN(minPrice)) {
            query += " AND COALESCE(p.discount_price, p.price) >= ?";
            params.push(Number(minPrice));
        }
        if (maxPrice && !isNaN(maxPrice)) {
            query += " AND COALESCE(p.discount_price, p.price) <= ?";
            params.push(Number(maxPrice));
        }

        // Brand filter
        if (brand && brand.trim() && brand !== "All") {
            query += " AND p.brand = ?";
            params.push(brand.trim());
        }

        // Size filter
        if (size && size.trim() && size !== "All") {
            query += " AND p.sizes LIKE ?";
            params.push(`%${size.trim()}%`);
        }

        // Color filter
        if (color && color.trim() && color !== "All") {
            query += " AND p.colors LIKE ?";
            params.push(`%${color.trim()}%`);
        }

        // Flags
        if (featured === "1" || featured === "true") {
            query += " AND p.is_featured = 1";
        }
        if (trending === "1" || trending === "true") {
            query += " AND p.is_trending = 1";
        }
        if (newArrival === "1" || newArrival === "true") {
            query += " AND p.is_new_arrival = 1";
        }

        // Sorting
        switch (sort) {
            case "price_asc":
                query += " ORDER BY COALESCE(p.discount_price, p.price) ASC";
                break;
            case "price_desc":
                query += " ORDER BY COALESCE(p.discount_price, p.price) DESC";
                break;
            case "newest":
                query += " ORDER BY p.product_id DESC";
                break;
            case "popular":
                query += " ORDER BY p.rating_count DESC, p.rating DESC";
                break;
            case "rating":
                query += " ORDER BY p.rating DESC";
                break;
            default:
                query += " ORDER BY p.is_featured DESC, p.product_id DESC";
                break;
        }

        // Pagination
        const pageSize = limit ? Math.min(Number(limit), 100) : 50;
        const pageNum = page ? Math.max(Number(page), 1) : 1;
        const offset = (pageNum - 1) * pageSize;

        query += ` LIMIT ${pageSize} OFFSET ${offset}`;

        const [products] = await pool.query(query, params);

        res.json(products);
    } catch (error) {
        console.error("Products API error:", error);
        res.status(500).json({ error: "Could not fetch products from the database." });
    }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({ error: "Invalid product ID." });
        }

        const [products] = await pool.execute(
            `SELECT 
                p.*,
                s.seller_name,
                s.email AS seller_email,
                s.phone AS seller_phone
             FROM products p
             LEFT JOIN sellers s ON p.seller_id = s.seller_id
             WHERE p.product_id = ?`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: "Product not found." });
        }

        const product = products[0];

        // Fetch related products from same category
        const [related] = await pool.execute(
            `SELECT product_id, product_name, price, discount_price, image_url, category, rating, rating_count
             FROM products 
             WHERE category = ? AND product_id != ? AND is_active = 1
             LIMIT 4`,
            [product.category, productId]
        );

        // Fetch product reviews
        const [reviews] = await pool.execute(
            `SELECT review_id, customer_name, rating, comment, created_at
             FROM reviews
             WHERE product_id = ?
             ORDER BY review_id DESC`,
            [productId]
        );

        res.json({
            ...product,
            related,
            reviews
        });
    } catch (error) {
        console.error("Single product error:", error);
        res.status(500).json({ error: "Could not fetch the product details." });
    }
});

// POST /api/products (Admin Only)
router.post("/", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const {
            product_name,
            description,
            category,
            category_id,
            price,
            discount_price,
            stock,
            image_url,
            brand,
            sizes,
            colors,
            is_featured,
            is_trending,
            is_new_arrival,
            seller_id
        } = req.body;

        if (!product_name || !price || !category) {
            return res.status(400).json({ error: "Product name, category, and price are required." });
        }

        let resolvedCatId = category_id || null;
        if (!resolvedCatId && category) {
            const [cRows] = await pool.execute("SELECT category_id FROM categories WHERE name = ?", [category.trim()]);
            if (cRows.length > 0) {
                resolvedCatId = cRows[0].category_id;
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO products (
                product_name, description, category, category_id, price, discount_price,
                stock, image_url, brand, sizes, colors, is_featured, is_trending,
                is_new_arrival, seller_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                product_name.trim(),
                description || "",
                category.trim(),
                resolvedCatId,
                Number(price),
                discount_price ? Number(discount_price) : null,
                Number(stock || 0),
                image_url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
                brand || "Fashionista",
                sizes || "S, M, L, XL",
                colors || "Black, White",
                is_featured ? 1 : 0,
                is_trending ? 1 : 0,
                is_new_arrival ? 1 : 0,
                seller_id || 1
            ]
        );

        const newId = result.insertId;
        const [created] = await pool.execute("SELECT * FROM products WHERE product_id = ?", [newId]);

        res.status(201).json({
            message: "Product created successfully!",
            product: created[0]
        });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ error: "Could not create product." });
    }
});

// PUT /api/products/:id (Admin Only)
router.put("/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const {
            product_name,
            description,
            category,
            price,
            discount_price,
            stock,
            image_url,
            brand,
            sizes,
            colors,
            is_active,
            is_featured,
            is_trending,
            is_new_arrival
        } = req.body;

        const [existing] = await pool.execute("SELECT * FROM products WHERE product_id = ?", [productId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Product not found." });
        }

        const cur = existing[0];

        await pool.execute(
            `UPDATE products SET
                product_name = ?,
                description = ?,
                category = ?,
                price = ?,
                discount_price = ?,
                stock = ?,
                image_url = ?,
                brand = ?,
                sizes = ?,
                colors = ?,
                is_active = ?,
                is_featured = ?,
                is_trending = ?,
                is_new_arrival = ?
            WHERE product_id = ?`,
            [
                product_name !== undefined ? product_name : cur.product_name,
                description !== undefined ? description : cur.description,
                category !== undefined ? category : cur.category,
                price !== undefined ? Number(price) : cur.price,
                discount_price !== undefined ? (discount_price ? Number(discount_price) : null) : cur.discount_price,
                stock !== undefined ? Number(stock) : cur.stock,
                image_url !== undefined ? image_url : cur.image_url,
                brand !== undefined ? brand : cur.brand,
                sizes !== undefined ? sizes : cur.sizes,
                colors !== undefined ? colors : cur.colors,
                is_active !== undefined ? (is_active ? 1 : 0) : cur.is_active,
                is_featured !== undefined ? (is_featured ? 1 : 0) : cur.is_featured,
                is_trending !== undefined ? (is_trending ? 1 : 0) : cur.is_trending,
                is_new_arrival !== undefined ? (is_new_arrival ? 1 : 0) : cur.is_new_arrival,
                productId
            ]
        );

        const [updated] = await pool.execute("SELECT * FROM products WHERE product_id = ?", [productId]);

        res.json({
            message: "Product updated successfully!",
            product: updated[0]
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ error: "Could not update product." });
    }
});

// DELETE /api/products/:id (Admin Only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { permanent } = req.query;

        if (permanent === "true") {
            await pool.execute("DELETE FROM products WHERE product_id = ?", [productId]);
            return res.json({ message: "Product permanently deleted from database." });
        }

        // Default: Soft delete (set inactive)
        await pool.execute("UPDATE products SET is_active = 0 WHERE product_id = ?", [productId]);
        res.json({ message: "Product deactivated successfully." });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ error: "Could not delete or deactivate product." });
    }
});

module.exports = router;
