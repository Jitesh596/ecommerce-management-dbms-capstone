const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const fallbackData = require("../data/fallbackData");

// GET /api/categories
router.get("/", async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT 
                c.category_id,
                c.name,
                c.slug,
                c.image_url,
                c.description,
                c.created_at,
                COUNT(p.product_id) AS product_count
            FROM categories c
            LEFT JOIN products p ON (p.category = c.name OR p.category_id = c.category_id) AND p.is_active = 1
            GROUP BY c.category_id
            ORDER BY c.category_id ASC
        `);

        res.json(categories);
    } catch (error) {
        console.warn("MySQL categories query notice, using catalog dataset:", error.message);
        res.json(fallbackData.categories || []);
    }
});

// POST /api/categories (Admin Only)
router.post("/", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { name, slug, image_url, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Category name is required." });
        }

        const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const [result] = await pool.execute(
            `INSERT INTO categories (name, slug, image_url, description)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), categorySlug, image_url || null, description || null]
        );

        const [created] = await pool.execute("SELECT * FROM categories WHERE category_id = ?", [result.insertId]);
        res.status(201).json({ message: "Category created successfully!", category: created[0] });
    } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({ error: "Could not create category." });
    }
});

// PUT /api/categories/:id (Admin Only)
router.put("/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const categoryId = Number(req.params.id);
        const { name, slug, image_url, description } = req.body;

        const [existing] = await pool.execute("SELECT * FROM categories WHERE category_id = ?", [categoryId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Category not found." });
        }

        const cur = existing[0];
        await pool.execute(
            `UPDATE categories SET
                name = ?,
                slug = ?,
                image_url = ?,
                description = ?
             WHERE category_id = ?`,
            [
                name !== undefined ? name.trim() : cur.name,
                slug !== undefined ? slug.trim() : cur.slug,
                image_url !== undefined ? image_url : cur.image_url,
                description !== undefined ? description : cur.description,
                categoryId
            ]
        );

        const [updated] = await pool.execute("SELECT * FROM categories WHERE category_id = ?", [categoryId]);
        res.json({ message: "Category updated successfully!", category: updated[0] });
    } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({ error: "Could not update category." });
    }
});

// DELETE /api/categories/:id (Admin Only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
        const categoryId = Number(req.params.id);
        await pool.execute("DELETE FROM categories WHERE category_id = ?", [categoryId]);
        res.json({ message: "Category deleted successfully." });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({ error: "Could not delete category." });
    }
});

module.exports = router;
