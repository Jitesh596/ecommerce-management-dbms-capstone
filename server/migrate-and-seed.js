const pool = require("./db");
const bcrypt = require("bcryptjs");

async function migrateAndSeed() {
    console.log("Starting database migration and seeding...");
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Ensure Categories table exists
        await conn.query(`
            CREATE TABLE IF NOT EXISTS categories (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                image_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
        console.log("Checked/created categories table.");

        // 2. Enhance Customers table
        // Check if unique index on email exists
        try {
            await conn.query(`ALTER TABLE customers ADD UNIQUE KEY unique_email (email);`);
        } catch (e) {
            // Already exists or duplicate email handled
        }

        // 3. Enhance Products table with new columns if missing
        const [productCols] = await conn.query(`DESCRIBE products`);
        const colNames = productCols.map(c => c.Field);

        if (!colNames.includes("discount_price")) {
            await conn.query(`ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) NULL AFTER price`);
        }
        if (!colNames.includes("brand")) {
            await conn.query(`ALTER TABLE products ADD COLUMN brand VARCHAR(100) DEFAULT 'Fashionista' AFTER image_url`);
        }
        if (!colNames.includes("sizes")) {
            await conn.query(`ALTER TABLE products ADD COLUMN sizes VARCHAR(255) DEFAULT 'S, M, L, XL' AFTER brand`);
        }
        if (!colNames.includes("colors")) {
            await conn.query(`ALTER TABLE products ADD COLUMN colors VARCHAR(255) DEFAULT 'Black, White, Navy' AFTER sizes`);
        }
        if (!colNames.includes("rating")) {
            await conn.query(`ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 4.5 AFTER colors`);
        }
        if (!colNames.includes("rating_count")) {
            await conn.query(`ALTER TABLE products ADD COLUMN rating_count INT DEFAULT 12 AFTER rating`);
        }
        if (!colNames.includes("category_id")) {
            await conn.query(`ALTER TABLE products ADD COLUMN category_id INT NULL AFTER category`);
        }
        if (!colNames.includes("is_featured")) {
            await conn.query(`ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active`);
        }
        if (!colNames.includes("is_trending")) {
            await conn.query(`ALTER TABLE products ADD COLUMN is_trending TINYINT(1) DEFAULT 0 AFTER is_featured`);
        }
        if (!colNames.includes("is_new_arrival")) {
            await conn.query(`ALTER TABLE products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 1 AFTER is_trending`);
        }
        console.log("Checked/enhanced products table columns.");

        // 4. Update orders table status enum to support 'Processing' and additional fields
        await conn.query(`
            ALTER TABLE orders 
            MODIFY COLUMN status ENUM('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending';
        `);

        const [orderCols] = await conn.query(`DESCRIBE orders`);
        const orderColNames = orderCols.map(c => c.Field);

        if (!orderColNames.includes("customer_name")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100) NULL AFTER customer_id`);
        }
        if (!orderColNames.includes("customer_email")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN customer_email VARCHAR(100) NULL AFTER customer_name`);
        }
        if (!orderColNames.includes("customer_phone")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_email`);
        }
        if (!orderColNames.includes("shipping_address")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL AFTER customer_phone`);
        }
        if (!orderColNames.includes("payment_method")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash on Delivery' AFTER total_amount`);
        }
        if (!orderColNames.includes("payment_status")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN payment_status ENUM('Pending','Paid','Failed','Refunded') DEFAULT 'Pending' AFTER payment_method`);
        }
        if (!orderColNames.includes("delivery_charge")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0.00 AFTER payment_status`);
        }
        if (!orderColNames.includes("discount_amount")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER delivery_charge`);
        }
        if (!orderColNames.includes("coupon_code")) {
            await conn.query(`ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER discount_amount`);
        }
        console.log("Checked/enhanced orders table columns.");

        // 5. Enhance order_details table
        const [odCols] = await conn.query(`DESCRIBE order_details`);
        const odColNames = odCols.map(c => c.Field);
        if (!odColNames.includes("selected_size")) {
            await conn.query(`ALTER TABLE order_details ADD COLUMN selected_size VARCHAR(50) DEFAULT 'M' AFTER quantity`);
        }
        if (!odColNames.includes("selected_color")) {
            await conn.query(`ALTER TABLE order_details ADD COLUMN selected_color VARCHAR(50) DEFAULT 'Default' AFTER selected_size`);
        }

        // 6. Create cart and cart_items table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS cart (
                cart_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

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
                UNIQUE KEY unique_cart_product (cart_id, product_id, selected_size, selected_color),
                FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("Checked/created cart and cart_items tables.");

        // 7. Create wishlist table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_cust_prod (customer_id, product_id),
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("Checked/created wishlist table.");

        // 8. Create reviews table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                review_id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                customer_id INT NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log("Checked/created reviews table.");

        // 9. Seed Categories
        const categoriesData = [
            { name: "Men's Clothing", slug: "mens-clothing", image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500&auto=format&fit=crop&q=80", description: "Timeless styles, sharp tailoring and everyday essentials for men." },
            { name: "Women's Clothing", slug: "womens-clothing", image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80", description: "Chic outfits, elegant silhouettes and contemporary fashion for women." },
            { name: "T-Shirts", slug: "t-shirts", image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80", description: "Graphic, crewneck and oversized comfortable t-shirts." },
            { name: "Shirts", slug: "shirts", image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80", description: "Crisp formal and relaxed casual button-down shirts." },
            { name: "Jeans", slug: "jeans", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80", description: "Slim, tapered, relaxed and vintage wash denim jeans." },
            { name: "Trousers", slug: "trousers", image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80", description: "Smart chinos, pleated trousers and casual comfort pants." },
            { name: "Dresses", slug: "dresses", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80", description: "Flowy sundresses, formal cocktail attire and everyday casuals." },
            { name: "Jackets", slug: "jackets", image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80", description: "Leather biker jackets, cozy puffers, bombers and winter coats." },
            { name: "Hoodies", slug: "hoodies", image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80", description: "Warm fleece hoodies and comfortable streetwear pullovers." },
            { name: "Shoes", slug: "shoes", image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80", description: "Premium leather sneakers, running trainers and formal loafers." },
            { name: "Bags", slug: "bags", image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80", description: "Everyday leather totes, modern backpacks and crossbody satchels." },
            { name: "Watches", slug: "watches", image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80", description: "Minimalist analog timepieces, luxury chronographs and sporty styles." },
            { name: "Accessories", slug: "accessories", image_url: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=500&auto=format&fit=crop&q=80", description: "Belts, sunglasses, silk scarves, hats and silver jewelry." }
        ];

        for (const cat of categoriesData) {
            await conn.query(`
                INSERT INTO categories (name, slug, image_url, description)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    slug = VALUES(slug),
                    image_url = VALUES(image_url),
                    description = VALUES(description);
            `, [cat.name, cat.slug, cat.image_url, cat.description]);
        }
        console.log("Seeded/updated categories.");

        // 10. Seed/Update Users with hashed passwords
        const defaultHash = await bcrypt.hash("password123", 10);
        const adminHash = await bcrypt.hash("admin123", 10);

        // Update existing customers if password is null
        await conn.query(`
            UPDATE customers 
            SET password_hash = ? 
            WHERE password_hash IS NULL OR password_hash = '';
        `, [defaultHash]);

        // Insert or update Admin account
        await conn.query(`
            INSERT INTO customers (name, email, password_hash, phone, address, role)
            VALUES ('Fashionista Admin', 'admin@fashionista.com', ?, '9999900000', 'Fashionista HQ, Mumbai', 'admin')
            ON DUPLICATE KEY UPDATE 
                password_hash = VALUES(password_hash),
                role = 'admin';
        `, [adminHash]);

        // Insert demo customer accounts if not present
        await conn.query(`
            INSERT INTO customers (name, email, password_hash, phone, address, role)
            VALUES ('Demo Customer', 'customer@fashionista.com', ?, '9876543210', '221B Fashion Boulevard, Bengaluru', 'customer')
            ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
        `, [defaultHash]);
        console.log("Seeded/updated customers with secure password hashes.");

        // 11. Seed Rich Product Catalog
        // We will seed a comprehensive set of 36 high-quality realistic fashion products
        const productsCatalog = [
            // T-Shirts
            {
                name: "Oversized Vintage Graphic Tee",
                category: "T-Shirts",
                price: 899.00,
                discount_price: 699.00,
                stock: 45,
                image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
                brand: "UrbanTrend",
                sizes: "S, M, L, XL, XXL",
                colors: "Washed Black, Off-White, Sage Green",
                description: "Crafted from 100% heavy 240 GSM organic cotton with a soft vintage mineral wash and dropped shoulders for relaxed everyday street styling.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 38
            },
            {
                name: "Supima Cotton Classic Crewneck",
                category: "T-Shirts",
                price: 1199.00,
                discount_price: 999.00,
                stock: 60,
                image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
                brand: "Fashionista Luxe",
                sizes: "XS, S, M, L, XL",
                colors: "Charcoal, Pure White, Navy Blue",
                description: "Tailored from rare American Supima long-staple cotton for unmatched softness, vibrant color retention, and resistance to pilling.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 0,
                rating: 4.9,
                rating_count: 52
            },
            {
                name: "Breton Striped Casual Tee",
                category: "T-Shirts",
                price: 799.00,
                discount_price: 599.00,
                stock: 35,
                image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
                brand: "CoastalVibe",
                sizes: "S, M, L, XL",
                colors: "Navy/White, Red/White, Olive/Ecru",
                description: "Timeless French maritime striped jersey shirt with ribbed neckline and breathable knit construction.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.6,
                rating_count: 19
            },

            // Shirts
            {
                name: "Oxford Cotton Button-Down Shirt",
                category: "Shirts",
                price: 1799.00,
                discount_price: 1499.00,
                stock: 40,
                image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
                brand: "Heritage Club",
                sizes: "38, 40, 42, 44",
                colors: "Sky Blue, Crisp White, Light Pink",
                description: "A sartorial staple woven in durable Oxford cloth with a neat button-down collar and tailored slim-regular silhouette.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.7,
                rating_count: 44
            },
            {
                name: "Pure Linen Relaxed Resort Shirt",
                category: "Shirts",
                price: 2199.00,
                discount_price: 1799.00,
                stock: 25,
                image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
                brand: "Sol & Sea",
                sizes: "S, M, L, XL",
                colors: "Natural Beige, Olive Green, Ocean Blue",
                description: "Lightweight European flax linen featuring a camp collar, breathable weave, and natural moisture-wicking drape for warm weather.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.8,
                rating_count: 27
            },
            {
                name: "Rugged Denim Workshirt",
                category: "Shirts",
                price: 1899.00,
                discount_price: null,
                stock: 30,
                image_url: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&auto=format&fit=crop&q=80",
                brand: "RawCraft",
                sizes: "M, L, XL",
                colors: "Indigo Wash, Faded Vintage",
                description: "Heavy-duty 8oz cotton denim featuring dual chest flap pockets, pearl snap buttons, and reinforced double-needle stitching.",
                is_featured: 0,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.5,
                rating_count: 16
            },

            // Jeans
            {
                name: "Slim Fit Indigo Selvedge Jeans",
                category: "Jeans",
                price: 2999.00,
                discount_price: 2499.00,
                stock: 30,
                image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80",
                brand: "RawCraft",
                sizes: "30, 32, 34, 36",
                colors: "Deep Indigo, Raw Black",
                description: "13.5 oz authentic shuttle-loom selvedge denim with 1% elastane for comfort. Designed to form unique natural fading whiskers over time.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.9,
                rating_count: 65
            },
            {
                name: "High-Rise Vintage Straight Jeans",
                category: "Jeans",
                price: 2499.00,
                discount_price: 1999.00,
                stock: 28,
                image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
                brand: "DenimStudio",
                sizes: "26, 28, 30, 32",
                colors: "Light Stone Wash, Classic Blue",
                description: "90s-inspired straight leg silhouette with a flattering high waist, authentic copper rivets, and a classic button fly.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.7,
                rating_count: 31
            },

            // Trousers
            {
                name: "Pleated Relaxed Tailored Trousers",
                category: "Trousers",
                price: 2299.00,
                discount_price: 1899.00,
                stock: 22,
                image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
                brand: "Atelier Mode",
                sizes: "30, 32, 34, 36",
                colors: "Charcoal Grey, Khaki, Almond",
                description: "Double front pleats with tapered drape, concealed tab closure, and premium wool-blend fabrication for sophisticated office and casual wear.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 24
            },
            {
                name: "Stretch Twill Everyday Chinos",
                category: "Trousers",
                price: 1699.00,
                discount_price: 1399.00,
                stock: 35,
                image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80",
                brand: "Heritage Club",
                sizes: "30, 32, 34, 36",
                colors: "Navy, British Tan, Olive",
                description: "Garment-dyed cotton twill engineered with 3% stretch for maximum all-day flexibility. Clean flat-front finish.",
                is_featured: 0,
                is_trending: 0,
                is_new_arrival: 0,
                rating: 4.6,
                rating_count: 42
            },

            // Dresses
            {
                name: "Floral Tiered Midi Sundress",
                category: "Dresses",
                price: 2499.00,
                discount_price: 1999.00,
                stock: 20,
                image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
                brand: "Flora & Bloom",
                sizes: "XS, S, M, L",
                colors: "Pastel Yellow Floral, Blush Pink",
                description: "Chiffon midi dress featuring ruffled tiers, sweet sweetheart neckline, adjustable tie straps, and an airy silhouette.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 47
            },
            {
                name: "Silk Satin Slip Cocktail Dress",
                category: "Dresses",
                price: 3499.00,
                discount_price: 2799.00,
                stock: 15,
                image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
                brand: "Atelier Mode",
                sizes: "S, M, L",
                colors: "Emerald Green, Midnight Black, Champagne",
                description: "Luxurious cowl neck slip dress cut on the bias in heavyweight mulberry silk satin for effortless fluid motion.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 36
            },
            {
                name: "Bohemian Embroidered Maxi Dress",
                category: "Dresses",
                price: 2899.00,
                discount_price: 2299.00,
                stock: 18,
                image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
                brand: "BohoChic",
                sizes: "S, M, L, XL",
                colors: "Ivory, Terracotta",
                description: "Handcrafted intricate floral embroidery on breathable cotton voile with voluminous bishop sleeves and tiered skirt.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.7,
                rating_count: 21
            },

            // Jackets
            {
                name: "Lambskin Leather Biker Jacket",
                category: "Jackets",
                price: 5999.00,
                discount_price: 4999.00,
                stock: 12,
                image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
                brand: "RebelMoto",
                sizes: "S, M, L, XL",
                colors: "Classic Black, Cognac Brown",
                description: "Genuine full-grain lambskin leather equipped with asymmetric heavy metal zippers, snap lapels, and quilted satin interior lining.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 5.0,
                rating_count: 58
            },
            {
                name: "Thermal Quilted Down Puffer Jacket",
                category: "Jackets",
                price: 4299.00,
                discount_price: 3499.00,
                stock: 20,
                image_url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80",
                brand: "NordicStorm",
                sizes: "M, L, XL, XXL",
                colors: "Matte Black, Forest Green, Metallic Silver",
                description: "650-fill power responsibly sourced goose down insulation inside a water-resistant ripstop nylon shell with storm cuffs.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 33
            },
            {
                name: "Classic Belted Trench Coat",
                category: "Jackets",
                price: 4999.00,
                discount_price: 3999.00,
                stock: 14,
                image_url: "https://images.unsplash.com/photo-1539533018447-63fcce667823?w=600&auto=format&fit=crop&q=80",
                brand: "LondonFog",
                sizes: "S, M, L",
                colors: "Honey Beige, Slate Grey",
                description: "Double-breasted weatherproof cotton gabardine trench coat with waist sash belt, horn buttons, and storm shield cape.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.9,
                rating_count: 29
            },

            // Hoodies
            {
                name: "Heavyweight French Terry Hoodie",
                category: "Hoodies",
                price: 2199.00,
                discount_price: 1799.00,
                stock: 35,
                image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
                brand: "UrbanTrend",
                sizes: "S, M, L, XL, XXL",
                colors: "Heather Grey, Jet Black, Forest Green",
                description: "Luxurious 450 GSM French terry cotton with double-lined drawstring hood, kangaroo pouch, and structured ribbed trims.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 73
            },
            {
                name: "Zip-Up Fleece Urban Hoodie",
                category: "Hoodies",
                price: 1899.00,
                discount_price: 1499.00,
                stock: 28,
                image_url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80",
                brand: "StreetEssence",
                sizes: "M, L, XL",
                colors: "Oatmeal, Deep Charcoal, Burgundy",
                description: "Plush brushed fleece interior with smooth two-way metal front zip, ergonomic thumbholes, and ribbed side panels.",
                is_featured: 0,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.7,
                rating_count: 31
            },

            // Shoes
            {
                name: "Minimalist Italian White Leather Sneakers",
                category: "Shoes",
                price: 3999.00,
                discount_price: 3199.00,
                stock: 25,
                image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
                brand: "Veloce Footwear",
                sizes: "40, 41, 42, 43, 44",
                colors: "Triple White, White/Navy Tab",
                description: "Full-grain nappa leather uppers, stitched Margom rubber cupsole, and antimicrobial calfskin lining for immaculate street style.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 84
            },
            {
                name: "Goodyear-Welted Chelsea Boots",
                category: "Shoes",
                price: 4999.00,
                discount_price: 3999.00,
                stock: 18,
                image_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80",
                brand: "Heritage Club",
                sizes: "41, 42, 43, 44",
                colors: "Dark Tan Suede, Black Calfskin",
                description: "Handcrafted Chelsea boots with heavy elastic side gussets, stacked leather heel, Dainite rubber outsole, and pull tabs.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 0,
                rating: 4.8,
                rating_count: 41
            },
            {
                name: "Aero Cushion Pro Running Trainers",
                category: "Shoes",
                price: 3299.00,
                discount_price: 2599.00,
                stock: 30,
                image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
                brand: "HyperAthletics",
                sizes: "39, 40, 41, 42, 43, 44",
                colors: "Crimson Red, Phantom Black, Neon Volt",
                description: "Engineered breathable jacquard mesh upper with reactive EVA foam midsole and carbon plate shank for explosive energy return.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 55
            },

            // Bags
            {
                name: "Full-Grain Leather Executive Tote Bag",
                category: "Bags",
                price: 4499.00,
                discount_price: 3699.00,
                stock: 16,
                image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
                brand: "Cuero Milano",
                sizes: "One Size",
                colors: "Saddle Tan, Obsidian Black",
                description: "Spacious luxury leather tote featuring dedicated 15-inch laptop sleeve, magnetic closure, and reinforced rolled handles.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 39
            },
            {
                name: "Waterproof Urban Roll-Top Backpack",
                category: "Bags",
                price: 2799.00,
                discount_price: 2199.00,
                stock: 24,
                image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
                brand: "NordicStorm",
                sizes: "25L",
                colors: "Matte Olive, Stealth Black",
                description: "TPU laminated ballistic nylon with quick-access side laptop compartment, padded air-mesh harness, and fidlock magnetic buckle.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.7,
                rating_count: 23
            },
            {
                name: "Minimalist Half-Moon Crossbody Bag",
                category: "Bags",
                price: 1999.00,
                discount_price: 1599.00,
                stock: 22,
                image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80",
                brand: "Atelier Mode",
                sizes: "Medium",
                colors: "Burgundy, Caramel, Cream",
                description: "Sculptural half-moon silhouette made from smooth vegan leather with gold-tone hardware and adjustable shoulder strap.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.8,
                rating_count: 28
            },

            // Watches
            {
                name: "Chronograph Sapphire Stainless Watch",
                category: "Watches",
                price: 6999.00,
                discount_price: 5499.00,
                stock: 15,
                image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
                brand: "Chronos Geneve",
                sizes: "42mm",
                colors: "Silver/Sunburst Blue, Rose Gold/Black",
                description: "Precision Japanese quartz movement with triple sub-dials, scratch-resistant sapphire crystal glass, and 100m water resistance.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 5.0,
                rating_count: 62
            },
            {
                name: "Minimalist Bauhaus Mesh Strap Watch",
                category: "Watches",
                price: 3499.00,
                discount_price: 2799.00,
                stock: 20,
                image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
                brand: "Nordic Horology",
                sizes: "38mm, 40mm",
                colors: "Rose Gold, Matte Gunmetal",
                description: "Ultra-slim 6mm profile with clean minimalist hour markers, Milanese stainless steel magnetic mesh band, and date window.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.8,
                rating_count: 35
            },

            // Accessories
            {
                name: "Handcrafted Full-Grain Leather Belt",
                category: "Accessories",
                price: 1299.00,
                discount_price: 999.00,
                stock: 40,
                image_url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80",
                brand: "Cuero Milano",
                sizes: "32, 34, 36, 38",
                colors: "Dark Brown, Antique Black",
                description: "Vegetable-tanned 38mm solid leather strap finished with solid brushed brass buckle and burnished beveled edges.",
                is_featured: 1,
                is_trending: 0,
                is_new_arrival: 1,
                rating: 4.7,
                rating_count: 48
            },
            {
                name: "Polarized Aviator Gold Sunglasses",
                category: "Accessories",
                price: 1999.00,
                discount_price: 1499.00,
                stock: 35,
                image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
                brand: "SunOptics",
                sizes: "Standard",
                colors: "Gold Frame/Green Lens, Matte Black/Grey",
                description: "Lightweight titanium-alloy wireframe with 100% UV400 anti-glare polarized lenses and silicone nose pads.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.8,
                rating_count: 51
            },
            {
                name: "Mulberry Silk Geometric Scarf",
                category: "Accessories",
                price: 1599.00,
                discount_price: 1199.00,
                stock: 25,
                image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80",
                brand: "Atelier Mode",
                sizes: "90x90 cm",
                colors: "Navy/Gold, Emerald/Rose",
                description: "100% 16-momme pure mulberry silk twill with hand-rolled hems and sophisticated hand-screened heritage prints.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 22
            },

            // Men's Clothing
            {
                name: "Italian Wool Slim Fit Two-Piece Suit",
                category: "Men's Clothing",
                price: 9999.00,
                discount_price: 7999.00,
                stock: 12,
                image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
                brand: "Sartoria Roma",
                sizes: "38R, 40R, 42R, 44R",
                colors: "Midnight Navy, Charcoal",
                description: "Woven in Biella, Italy from Super 120s virgin wool. Features half-canvas chest construction, notch lapels, and matching flat-front trousers.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 5.0,
                rating_count: 45
            },
            {
                name: "Knitted Cotton Mercerized Polo",
                category: "Men's Clothing",
                price: 1599.00,
                discount_price: 1299.00,
                stock: 35,
                image_url: "https://images.unsplash.com/photo-1625910513413-5753b7d14d13?w=600&auto=format&fit=crop&q=80",
                brand: "Heritage Club",
                sizes: "S, M, L, XL",
                colors: "Sage Green, Cream, Burgundy",
                description: "Fine-gauge knitted polo with mother-of-pearl buttons and a silky mercerized cotton sheen. Perfect for elevated smart-casual style.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.7,
                rating_count: 32
            },

            // Women's Clothing
            {
                name: "Tailored Linen Blazer & Trouser Co-ord",
                category: "Women's Clothing",
                price: 4999.00,
                discount_price: 3999.00,
                stock: 15,
                image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
                brand: "Atelier Mode",
                sizes: "S, M, L",
                colors: "Terracotta, Ivory Beige",
                description: "Modern power-suiting in lightweight pure flax linen. Single-breasted relaxed blazer paired with high-waisted wide-leg trousers.",
                is_featured: 1,
                is_trending: 1,
                is_new_arrival: 1,
                rating: 4.9,
                rating_count: 37
            },
            {
                name: "Ribbed Knit Bodycon Midi Dress",
                category: "Women's Clothing",
                price: 2199.00,
                discount_price: 1699.00,
                stock: 25,
                image_url: "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=600&auto=format&fit=crop&q=80",
                brand: "Flora & Bloom",
                sizes: "XS, S, M, L",
                colors: "Mocha Brown, Olive, Black",
                description: "Sculpting vertical rib-knit fabric with square neck silhouette and elegant side leg slit for day-to-night versatility.",
                is_featured: 0,
                is_trending: 1,
                is_new_arrival: 0,
                rating: 4.8,
                rating_count: 40
            }
        ];

        // Fetch category mapping
        const [cats] = await conn.query(`SELECT category_id, name FROM categories`);
        const catMap = {};
        for (const c of cats) {
            catMap[c.name] = c.category_id;
        }

        // Insert or update catalog products
        for (const p of productsCatalog) {
            const catId = catMap[p.category] || null;
            // Check if product exists by name
            const [existing] = await conn.query(`SELECT product_id FROM products WHERE product_name = ?`, [p.name]);
            if (existing.length > 0) {
                await conn.query(`
                    UPDATE products SET
                        description = ?,
                        category = ?,
                        category_id = ?,
                        price = ?,
                        discount_price = ?,
                        stock = ?,
                        image_url = ?,
                        brand = ?,
                        sizes = ?,
                        colors = ?,
                        is_featured = ?,
                        is_trending = ?,
                        is_new_arrival = ?,
                        rating = ?,
                        rating_count = ?,
                        seller_id = 1,
                        is_active = 1
                    WHERE product_id = ?;
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
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1);
                `, [
                    p.name, p.description, p.category, catId, p.price, p.discount_price,
                    p.stock, p.image_url, p.brand, p.sizes, p.colors, p.is_featured,
                    p.is_trending, p.is_new_arrival, p.rating, p.rating_count
                ]);
            }
        }
        console.log(`Catalog populated with ${productsCatalog.length} realistic fashion items!`);

        // Also update existing initial 15 products with image URLs and details if they had null images
        const [oldProds] = await conn.query(`SELECT product_id, product_name, category FROM products WHERE image_url IS NULL OR image_url = ''`);
        for (const op of oldProds) {
            let img = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Jeans") img = "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Footwear") img = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Hoodies") img = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Dresses") img = "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Jackets") img = "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Shirts") img = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Trousers" || op.category === "Shorts") img = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80";
            if (op.category === "Accessories") img = "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80";

            await conn.query(`
                UPDATE products SET 
                    image_url = ?, 
                    brand = COALESCE(brand, 'Fashionista Urban'),
                    sizes = COALESCE(sizes, 'S, M, L, XL'),
                    colors = COALESCE(colors, 'Classic Black, Navy, White'),
                    rating = COALESCE(rating, 4.6),
                    rating_count = COALESCE(rating_count, 18),
                    discount_price = COALESCE(discount_price, ROUND(price * 0.85, 2))
                WHERE product_id = ?
            `, [img, op.product_id]);
        }
        console.log("Updated legacy products with image URLs and defaults.");

        // 12. Seed some initial reviews for products
        const [firstFewProds] = await conn.query(`SELECT product_id FROM products LIMIT 6`);
        for (const p of firstFewProds) {
            await conn.query(`
                INSERT IGNORE INTO reviews (product_id, customer_id, customer_name, rating, comment)
                VALUES 
                    (?, 1, 'Rahul Sharma', 5, 'Exceptional quality! The fabric feels premium and fit is true to size.'),
                    (?, 2, 'Priya Verma', 5, 'Super stylish and quick delivery! Highly recommend to everyone.');
            `, [p.product_id, p.product_id]);
        }
        console.log("Seeded sample customer reviews.");

        await conn.commit();
        console.log("Database migration and seeding completed successfully!");
    } catch (err) {
        await conn.rollback();
        console.error("Migration error:", err);
        process.exitCode = 1;
    } finally {
        conn.release();
        await pool.end();
    }
}

migrateAndSeed();
