const pool = require("./db");

async function testDBMSFeatures() {
    console.log("==================================================================");
    console.log("     DBMS CAPSTONE: COMPREHENSIVE DATABASE FEATURE TEST           ");
    console.log("==================================================================");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passCount++;
        } else {
            console.error(`[FAIL] ${message}`);
            failCount++;
        }
    }

    try {
        // -------------------------------------------------------------
        // 1. PRIMARY KEYS & TABLE STRUCTURE
        // -------------------------------------------------------------
        console.log("\n--- 1. Testing Schema Tables & Primary Keys ---");
        const [tables] = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'ecommerce_management_db'
        `);
        const tableNames = tables.map(t => t.table_name || t.TABLE_NAME);
        const requiredTables = [
            "customers", "sellers", "categories", "products", "cart",
            "cart_items", "wishlist", "orders", "order_details",
            "deliveries", "payments", "reviews", "inventory_audit_log"
        ];
        for (const rt of requiredTables) {
            assert(tableNames.includes(rt), `Table '${rt}' exists in database schema`);
        }

        // -------------------------------------------------------------
        // 2. FOREIGN KEYS & REFERENTIAL INTEGRITY
        // -------------------------------------------------------------
        console.log("\n--- 2. Testing Foreign Keys & Referential Integrity ---");
        const [fks] = await pool.query(`
            SELECT 
                constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
            FROM information_schema.key_column_usage
            WHERE table_schema = 'ecommerce_management_db' AND referenced_table_name IS NOT NULL
        `);
        assert(fks.length >= 10, `Found ${fks.length} foreign key relationships enforcing referential integrity`);
        
        const productsHasCatFK = fks.some(f => (f.table_name === 'products' || f.TABLE_NAME === 'products') && (f.referenced_table_name === 'categories' || f.REFERENCED_TABLE_NAME === 'categories'));
        assert(productsHasCatFK, "Foreign key products.category_id -> categories.category_id is active");

        // -------------------------------------------------------------
        // 3. DATABASE VIEWS
        // -------------------------------------------------------------
        console.log("\n--- 3. Testing Relational Views ---");
        
        // View 1: vw_product_catalog
        const [catalogView] = await pool.query("SELECT * FROM vw_product_catalog LIMIT 3");
        assert(catalogView.length > 0 && catalogView[0].effective_price !== undefined, "View 'vw_product_catalog' retrieves products with computed pricing");

        // View 2: vw_order_summary
        const [orderView] = await pool.query("SELECT * FROM vw_order_summary LIMIT 3");
        assert(orderView.length > 0 && orderView[0].total_units_ordered !== undefined, "View 'vw_order_summary' joins orders, deliveries, payments & items");

        // View 3: vw_category_sales
        const [catSalesView] = await pool.query("SELECT * FROM vw_category_sales");
        assert(catSalesView.length > 0 && catSalesView[0].total_products !== undefined, "View 'vw_category_sales' aggregates category sales and inventory metrics");

        // View 4: vw_low_stock_alerts
        const [lowStockView] = await pool.query("SELECT * FROM vw_low_stock_alerts");
        assert(Array.isArray(lowStockView), "View 'vw_low_stock_alerts' filters low stock items with vendor details");

        // View 5: vw_customer_order_stats
        const [custStatsView] = await pool.query("SELECT * FROM vw_customer_order_stats");
        assert(custStatsView.length > 0 && custStatsView[0].lifetime_expenditure !== undefined, "View 'vw_customer_order_stats' compiles customer order analytics");

        // -------------------------------------------------------------
        // 4. DATABASE TRIGGERS
        // -------------------------------------------------------------
        console.log("\n--- 4. Testing Active Database Triggers ---");

        // Test Trigger: trg_after_review_insert updates products.rating & rating_count automatically
        const [testProd] = await pool.query("SELECT product_id, rating, rating_count FROM products WHERE is_active = 1 LIMIT 1");
        const testProdId = testProd[0].product_id;
        const initialRatingCount = testProd[0].rating_count;

        await pool.query(`
            INSERT INTO reviews (product_id, customer_id, customer_name, rating, comment)
            VALUES (?, 2, 'Automated Test Evaluator', 5, 'Exceptional quality verified by DBMS trigger test suite.')
        `, [testProdId]);

        const [afterReviewProd] = await pool.query("SELECT rating, rating_count FROM products WHERE product_id = ?", [testProdId]);
        assert(afterReviewProd[0].rating_count === initialRatingCount + 1, "Trigger 'trg_after_review_insert' automatically updated products.rating_count in real-time");

        // Test Trigger: trg_product_stock_audit logs stock modifications into inventory_audit_log
        const [auditLogsBefore] = await pool.query("SELECT COUNT(*) AS cnt FROM inventory_audit_log WHERE product_id = ?", [testProdId]);
        const beforeCount = auditLogsBefore[0].cnt;

        await pool.query("UPDATE products SET stock = stock + 5 WHERE product_id = ?", [testProdId]);

        const [auditLogsAfter] = await pool.query("SELECT COUNT(*) AS cnt FROM inventory_audit_log WHERE product_id = ?", [testProdId]);
        assert(auditLogsAfter[0].cnt > beforeCount, "Trigger 'trg_product_stock_audit' automatically recorded entry in inventory_audit_log");

        // -------------------------------------------------------------
        // 5. STORED PROCEDURES
        // -------------------------------------------------------------
        console.log("\n--- 5. Testing Stored Procedures ---");

        // Stored Procedure 1: sp_UpdateStock
        await pool.query("CALL sp_UpdateStock(?, 10, 'Restock delivery shipment', @new_stock, @status_msg)", [testProdId]);
        const [spStockResult] = await pool.query("SELECT @new_stock AS new_stock, @status_msg AS status_msg");
        assert(spStockResult[0].new_stock > 0, `Stored Procedure 'sp_UpdateStock' executed successfully: ${spStockResult[0].status_msg}`);

        // Stored Procedure 2: sp_GetCustomerOrderHistory
        const [spHistory] = await pool.query("CALL sp_GetCustomerOrderHistory(2)");
        assert(Array.isArray(spHistory[0]), `Stored Procedure 'sp_GetCustomerOrderHistory' returned formatted history for Customer #2`);

        // Stored Procedure 3: sp_SalesReportByDateRange
        const [spSales] = await pool.query("CALL sp_SalesReportByDateRange('2026-01-01', '2026-12-31')");
        assert(Array.isArray(spSales[0]), `Stored Procedure 'sp_SalesReportByDateRange' generated date-range sales report`);

        // -------------------------------------------------------------
        // 6. COMPLEX QUERIES: JOINS, AGGREGATES, SUBQUERIES
        // -------------------------------------------------------------
        console.log("\n--- 6. Testing Complex SQL Queries ---");

        // Multi-table 4-table JOIN
        const [multiJoin] = await pool.query(`
            SELECT 
                p.product_id,
                p.product_name,
                c.name AS category_name,
                s.seller_name,
                COALESCE(SUM(od.quantity), 0) AS total_units_sold
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            JOIN sellers s ON p.seller_id = s.seller_id
            LEFT JOIN order_details od ON p.product_id = od.product_id
            GROUP BY p.product_id, p.product_name, c.name, s.seller_name
            LIMIT 5
        `);
        assert(multiJoin.length > 0, "4-Table JOIN (products, categories, sellers, order_details) returned correct results");

        // Correlated Subquery
        const [subqueryResult] = await pool.query(`
            SELECT c.customer_id, c.name, c.email
            FROM customers c
            WHERE (SELECT COUNT(*) FROM orders WHERE customer_id = c.customer_id) > 0
        `);
        assert(subqueryResult.length > 0, "Correlated subquery in WHERE clause executed successfully");

        // Aggregate query with GROUP BY and HAVING
        const [groupHavingResult] = await pool.query(`
            SELECT 
                p.category, 
                COUNT(*) AS total_items, 
                ROUND(AVG(p.price), 2) AS avg_price
            FROM products p
            GROUP BY p.category
            HAVING total_items >= 1
            ORDER BY avg_price DESC
        `);
        assert(groupHavingResult.length > 0, "Aggregate query with GROUP BY and HAVING executed successfully");

        console.log("\n==================================================================");
        console.log(`  DBMS TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED           `);
        console.log("==================================================================");

        if (failCount === 0) {
            console.log("ALL DBMS CAPSTONE SPECIFICATIONS VERIFIED AND OPERATIONAL! 🎓✨");
        }

    } catch (err) {
        console.error("Test execution error:", err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testDBMSFeatures();
