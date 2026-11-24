const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function exportFallback() {
    try {
        const [cats] = await pool.query(`
            SELECT 
                c.category_id,
                c.name,
                c.slug,
                c.image_url,
                c.description,
                COUNT(p.product_id) AS product_count
            FROM categories c
            LEFT JOIN products p ON (p.category = c.name OR p.category_id = c.category_id) AND p.is_active = 1
            GROUP BY c.category_id
            ORDER BY c.category_id ASC
        `);

        const [prods] = await pool.query(`
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
                s.seller_name
            FROM products p
            LEFT JOIN sellers s ON p.seller_id = s.seller_id
            WHERE p.is_active = 1
            ORDER BY p.is_featured DESC, p.product_id DESC
        `);

        console.log('Categories count:', cats.length);
        console.log('Products count:', prods.length);

        const dataDir = path.resolve(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const outPath = path.resolve(dataDir, 'fallbackData.js');
        const content = 'module.exports = ' + JSON.stringify({ categories: cats, products: prods }, null, 2) + ';\n';
        fs.writeFileSync(outPath, content, 'utf8');
        console.log('Successfully written fallbackData.js!');
    } catch (e) {
        console.error('Error exporting fallback data:', e);
    }
    process.exit(0);
}

exportFallback();
