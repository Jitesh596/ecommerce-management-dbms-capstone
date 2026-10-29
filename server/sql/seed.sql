-- ============================================================================
-- Fashionista E-Commerce Management Database System
-- Capstone Project: Phase 1 & Catalogue Expansion Seed Script
-- Safe & Repeatable (Idempotent) Data Population
-- Target Database: ecommerce_management_db (MySQL 8.0+)
-- ============================================================================

USE `ecommerce_management_db`;

-- ----------------------------------------------------------------------------
-- 1. SEED / UPDATE SELLERS (Preserve existing 1, 2, 3)
-- ----------------------------------------------------------------------------
INSERT INTO `sellers` (`seller_id`, `seller_name`, `email`, `phone`, `address`)
VALUES
  (1, 'Fashion Hub', 'fashion@example.com', '9876511111', 'Delhi, India'),
  (2, 'Style Store', 'style@example.com', '9876522222', 'Gurugram, Haryana'),
  (3, 'Trendy Wear', 'trendy@example.com', '9876533333', 'Jaipur, Rajasthan')
ON DUPLICATE KEY UPDATE
  `seller_name` = VALUES(`seller_name`),
  `phone` = VALUES(`phone`),
  `address` = VALUES(`address`);

-- ----------------------------------------------------------------------------
-- 2. SEED / UPDATE CUSTOMERS & ADMIN ACCOUNT
-- ----------------------------------------------------------------------------
-- Update password_hash for existing demo customers if currently NULL (Password: Password@123)
UPDATE `customers`
SET `password_hash` = '$2b$10$1VyGXy0Mg6kg2qoCq/PXOeJ301q/bv1VmmsQH4Y9gJ2KYPRJvlSLO'
WHERE `password_hash` IS NULL;

-- Insert/Ensure Demonstration Admin Account (Password: Admin@123)
INSERT INTO `customers` (`name`, `email`, `password_hash`, `phone`, `address`, `role`)
VALUES
  ('Fashionista Admin', 'admin@fashionista.com', '$2b$10$vgk7lDQEvQ7mFjXwmAKwqe/HxyAtc.86UcJ87SrE1MiF3JGdbnC5K', '9999900000', 'Corporate Office, Cyber City, Gurugram', 'admin')
ON DUPLICATE KEY UPDATE
  `role` = 'admin';

-- ----------------------------------------------------------------------------
-- 3. UPDATE IMAGES FOR EXISTING 15 PRODUCTS (Replace NULLs with Curated Unsplash CDN Links)
-- ----------------------------------------------------------------------------
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 1 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 2 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 3 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 4 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 5 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 6 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 7 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 8 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 9 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 10 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 11 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 12 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 13 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 14 AND (`image_url` IS NULL OR `image_url` = '');
UPDATE `products` SET `image_url` = 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80' WHERE `product_id` = 15 AND (`image_url` IS NULL OR `image_url` = '');

-- ----------------------------------------------------------------------------
-- 4. EXPAND PRODUCT CATALOGUE (Add ~40 Additional Fashion Products Safely)
-- ----------------------------------------------------------------------------
INSERT INTO `products` (`product_name`, `description`, `category`, `price`, `stock`, `image_url`, `seller_id`, `is_active`)
SELECT * FROM (
  SELECT 'Oversized Streetwear Tee', 'Heavyweight cotton graphic streetwear t-shirt with drop shoulders', 'T-Shirts and Tops', 899.00, 35, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Ribbed Knit Crop Top', 'Fitted stretch ribbed crop top for casual summer outings', 'T-Shirts and Tops', 649.00, 42, 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Vintage Henley Tee', 'Soft waffle-knit henley shirt with three-button placket', 'T-Shirts and Tops', 749.00, 28, 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Striped Breton Long Sleeve', 'Classic nautical horizontal striped cotton long sleeve tee', 'T-Shirts and Tops', 849.00, 30, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Oxford Button-Down Shirt', 'Tailored 100% combed cotton Oxford dress shirt in pastel blue', 'Shirts', 1399.00, 24, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Cuban Collar Resort Shirt', 'Breathable camp collar floral print shirt ideal for vacation wear', 'Shirts', 1199.00, 22, 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Linen Mandarin Collar Shirt', 'Pure linen band collar breathable shirt for breezy summer styling', 'Shirts', 1599.00, 18, 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Buffalo Check Flannel Shirt', 'Warm brushed cotton flannel shirt in vintage red-and-black check', 'Shirts', 1449.00, 26, 'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Distressed Tapered Denim', 'Medium wash authentic denim with hand-finished subtle distressing', 'Jeans and Trousers', 1799.00, 25, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'High-Rise Wide Leg Jeans', 'Flattering vintage-inspired relaxed fit flared wide leg jeans', 'Jeans and Trousers', 1899.00, 20, 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Pleated Chino Trousers', 'Smart casual tailored front-pleat chinos in versatile khaki', 'Jeans and Trousers', 1349.00, 32, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Urban Cargo Joggers', 'Utility multi-pocket cotton jogger pants with elasticized cuffs', 'Jeans and Trousers', 1299.00, 30, 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Floral Chiffon Maxi Dress', 'Elegant flowy floral maxi dress with tie-up belt and bell sleeves', 'Dresses and Skirts', 2199.00, 14, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Satin Midi Slip Dress', 'Luxurious bias-cut cowl neckline emerald satin evening slip dress', 'Dresses and Skirts', 2499.00, 12, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Pleated A-Line Midi Skirt', 'Accordion pleated high-waisted flowing skirt in metallic blush', 'Dresses and Skirts', 1299.00, 19, 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Wrap Linen Mini Dress', 'Effortless wrap-front silhouette in breathable washed Belgian linen', 'Dresses and Skirts', 1699.00, 16, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL

  SELECT 'Fleece Pullover Hoodie', 'Heavy 380 GSM brushed fleece relaxed hoodie with kangaroo pocket', 'Hoodies and Sweatshirts', 1599.00, 28, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Vintage Crewneck Sweatshirt', 'Acid wash relaxed collegiate crewneck with ribbed hem and cuffs', 'Hoodies and Sweatshirts', 1399.00, 34, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Zip-Up Thermal Jacket Hoodie', 'Double-layered fleece-lined zip front hoodie for cold weather', 'Hoodies and Sweatshirts', 1799.00, 18, 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Faux Leather Biker Jacket', 'Edgy moto jacket with asymmetrical silver hardware and belted waist', 'Jackets', 3299.00, 12, 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Water-Resistant Bomber Jacket', 'Minimalist military satin finish nylon bomber jacket in olive drab', 'Jackets', 2699.00, 16, 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Wool Blend Overcoat', 'Structured double-breasted longline camel coat with notched lapel', 'Jackets', 4499.00, 9, 'https://images.unsplash.com/photo-1539533018447-63fcce667883?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Lightweight Windbreaker', 'Colourblock packable zip-up windbreaker with storm flap and hood', 'Jackets', 1899.00, 22, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Retro High-Top Basketball Shoes', 'Perforated leather high-top ankle support sneakers with cushioned sole', 'Sneakers and Footwear', 3299.00, 15, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Minimalist White Tennis Sneakers', 'Clean silhouette low-profile genuine leather sneakers in chalk white', 'Sneakers and Footwear', 2799.00, 20, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Chunky Trail Running Sneakers', 'Aggressive tread vibram lugged platform sole athletic trail trainers', 'Sneakers and Footwear', 3499.00, 14, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Classic Chelsea Leather Boots', 'Handcrafted oiled pull-up leather boots with elastic side gussets', 'Sneakers and Footwear', 3899.00, 11, 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Polarized Wayfarer Sunglasses', 'UV400 scratch-resistant polarized tortoiseshell acetate sunglasses', 'Accessories', 899.00, 40, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Stainless Steel Chronograph Watch', 'Precision quartz movement matte black metal link mesh wrist watch', 'Accessories', 2499.00, 16, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Hand-Woven Silk Jacquard Tie', 'Rich paisley motif formal silk necktie with matching pocket square', 'Accessories', 699.00, 30, 'https://images.unsplash.com/photo-1589756823695-278bc923f962?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Knit Merino Wool Beanie', 'Chunky ribbed cuffed skull cap beanie in charcoal heather grey', 'Accessories', 499.00, 45, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL

  SELECT 'Genuine Leather Commuter Backpack', 'Padded 15.6 inch laptop compartment water-resistant city rucksack', 'Bags and Backpacks', 2999.00, 18, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Canvas Weekend Duffle Bag', 'Heavy 16oz waxed canvas duffel with brass fixtures and shoe pocket', 'Bags and Backpacks', 2299.00, 20, 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Quilted Crossbody Clutch', 'Pebbled vegan leather chain-strap evening camera bag in noir', 'Bags and Backpacks', 1599.00, 25, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Minimalist Cotton Tote Bag', 'Heavyweight organic cotton grocery shopping shoulder bag', 'Bags and Backpacks', 599.00, 50, 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL

  SELECT 'Autumn Sherpa Corduroy Overshirt', 'Cozy faux-sherpa lined ribbed corduroy shirt jacket in rust orange', 'Seasonal and Trending Fashion', 2499.00, 15, 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Bohemian Crochet Cardigan', 'Handmade open-stitch artisan fringe cardigan for festival layers', 'Seasonal and Trending Fashion', 1899.00, 14, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80', 3, 1 UNION ALL
  SELECT 'Monochrome Resort Linen Co-ord', 'Matching Cuban collar shirt and relaxed shorts twin resort set', 'Seasonal and Trending Fashion', 2299.00, 17, 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=600&auto=format&fit=crop&q=80', 1, 1 UNION ALL
  SELECT 'Quilted Puffer Vest', 'Ultralight duck-down insulated thermal sleeveless gilet vest in jet black', 'Seasonal and Trending Fashion', 1999.00, 22, 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop&q=80', 2, 1 UNION ALL
  SELECT 'Chunky Cable Knit Sweater', 'Timeless cream fisherman cable knit pullover with ribbed crewneck', 'Seasonal and Trending Fashion', 2199.00, 19, 'https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?w=600&auto=format&fit=crop&q=80', 3, 1
) AS new_items
WHERE NOT EXISTS (
  SELECT 1 FROM `products` p WHERE p.`product_name` = new_items.`product_name`
);

-- ----------------------------------------------------------------------------
-- 5. SEED ADDITIONAL SAMPLE ORDERS, ORDER DETAILS, PAYMENTS & DELIVERIES
-- ----------------------------------------------------------------------------
-- Order 4 (Customer 4, Confirmed)
INSERT INTO `orders` (`order_id`, `customer_id`, `order_date`, `total_amount`, `status`)
SELECT 4, 4, '2026-10-25 10:15:00', 3198.00, 'Confirmed'
WHERE NOT EXISTS (SELECT 1 FROM `orders` WHERE `order_id` = 4);

INSERT INTO `order_details` (`order_id`, `product_id`, `quantity`, `unit_price`)
SELECT 4, 7, 2, 999.00 WHERE NOT EXISTS (SELECT 1 FROM `order_details` WHERE `order_id` = 4 AND `product_id` = 7);

INSERT INTO `order_details` (`order_id`, `product_id`, `quantity`, `unit_price`)
SELECT 4, 8, 1, 1199.00 WHERE NOT EXISTS (SELECT 1 FROM `order_details` WHERE `order_id` = 4 AND `product_id` = 8);

INSERT INTO `payments` (`order_id`, `payment_date`, `amount`, `payment_method`, `payment_status`)
SELECT 4, '2026-10-25 10:20:00', 3198.00, 'UPI Demo', 'Paid'
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE `order_id` = 4);

INSERT INTO `deliveries` (`order_id`, `delivery_address`, `delivery_date`, `delivery_status`)
SELECT 4, 'Chandigarh, India', NULL, 'In Transit'
WHERE NOT EXISTS (SELECT 1 FROM `deliveries` WHERE `order_id` = 4);

-- Order 5 (Customer 5, Delivered)
INSERT INTO `orders` (`order_id`, `customer_id`, `order_date`, `total_amount`, `status`)
SELECT 5, 5, '2026-10-26 14:00:00', 2999.00, 'Delivered'
WHERE NOT EXISTS (SELECT 1 FROM `orders` WHERE `order_id` = 5);

INSERT INTO `order_details` (`order_id`, `product_id`, `quantity`, `unit_price`)
SELECT 5, 10, 1, 2999.00 WHERE NOT EXISTS (SELECT 1 FROM `order_details` WHERE `order_id` = 5 AND `product_id` = 10);

INSERT INTO `payments` (`order_id`, `payment_date`, `amount`, `payment_method`, `payment_status`)
SELECT 5, '2026-10-26 14:05:00', 2999.00, 'Card Demo', 'Paid'
WHERE NOT EXISTS (SELECT 1 FROM `payments` WHERE `order_id` = 5);

INSERT INTO `deliveries` (`order_id`, `delivery_address`, `delivery_date`, `delivery_status`)
SELECT 5, 'Noida, India', '2026-10-28 16:30:00', 'Delivered'
WHERE NOT EXISTS (SELECT 1 FROM `deliveries` WHERE `order_id` = 5);
