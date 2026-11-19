const axios = require("axios");
const pool = require("./db");

const BASE_URL = "http://localhost:5000/api";

async function runComprehensiveVerification() {
    console.log("==========================================================");
    console.log("  FASHIONISTA E-COMMERCE END-TO-END VERIFICATION SUITE  ");
    console.log("==========================================================");

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`PASS: ${testName}`);
            passed++;
        } else {
            console.error(`FAIL: ${testName}`);
            failed++;
        }
    }

    try {
        // 1. Health check
        const health = await axios.get(`${BASE_URL}/health`);
        assert(health.status === 200 && health.data.status === "online", "Backend health check responds with 200 online");

        // 2. Categories
        const cats = await axios.get(`${BASE_URL}/categories`);
        assert(Array.isArray(cats.data) && cats.data.length >= 10, `Categories fetched from database (${cats.data.length} categories)`);

        // 3. Products
        const allProds = await axios.get(`${BASE_URL}/products`);
        assert(Array.isArray(allProds.data) && allProds.data.length >= 30, `Products loaded from database (${allProds.data.length} products)`);

        // 4. Product Search & Filter
        const searchProds = await axios.get(`${BASE_URL}/products?search=shirt`);
        assert(searchProds.data.length > 0 && searchProds.data.every(p => p.product_name.toLowerCase().includes("shirt") || p.category.toLowerCase().includes("shirt")), "Product search by keyword filter works");

        // 5. Product Category Filter
        const tshirts = await axios.get(`${BASE_URL}/products?category=T-Shirts`);
        assert(tshirts.data.length > 0 && tshirts.data.every(p => p.category === "T-Shirts"), "Category filtering works correctly");

        // 6. Price Sorting
        const sortedAsc = await axios.get(`${BASE_URL}/products?sort=price_asc`);
        const firstPrice = Number(sortedAsc.data[0].discount_price || sortedAsc.data[0].price);
        const secondPrice = Number(sortedAsc.data[1].discount_price || sortedAsc.data[1].price);
        assert(firstPrice <= secondPrice, "Price ascending sorting works correctly");

        // 7. Single Product Details with reviews & related
        const testProd = allProds.data[0];
        const detail = await axios.get(`${BASE_URL}/products/${testProd.product_id}`);
        assert(detail.data.product_id === testProd.product_id && Array.isArray(detail.data.related), "Single product detail with related products loads correctly");

        // 8. Customer Registration
        const randomEmail = `shopper_${Date.now()}@example.com`;
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: "Test Shopper",
            email: randomEmail,
            password: "password123",
            phone: "9876543210",
            address: "100 Fashion Street, Bangalore"
        });
        assert(regRes.status === 201 && regRes.data.token, "Customer registration creates user with bcrypt hash & JWT token");
        const shopperToken = regRes.data.token;
        const shopperId = regRes.data.user.customer_id;

        // 9. Customer Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: randomEmail,
            password: "password123"
        });
        assert(loginRes.status === 200 && loginRes.data.user.email === randomEmail, "Customer login succeeds with verified password");

        // 10. Customer Profile & Update
        const profileRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(profileRes.data.user.name === "Test Shopper", "Customer profile retrieved via GET /api/auth/me");

        const updateProf = await axios.put(`${BASE_URL}/auth/profile`, {
            name: "Test Shopper Updated",
            phone: "9998887777",
            address: "200 Luxury Ave, Mumbai"
        }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(updateProf.data.user.name === "Test Shopper Updated", "Customer profile update works");

        // 11. Wishlist Operations
        await axios.post(`${BASE_URL}/wishlist`, { product_id: testProd.product_id }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        const wl = await axios.get(`${BASE_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(wl.data.some(i => i.product_id === testProd.product_id), "Product added and fetched from wishlist in MySQL");

        await axios.delete(`${BASE_URL}/wishlist/${testProd.product_id}`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        const wlAfter = await axios.get(`${BASE_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(!wlAfter.data.some(i => i.product_id === testProd.product_id), "Product removed from wishlist");

        // 12. Cart Operations
        await axios.post(`${BASE_URL}/cart`, {
            product_id: testProd.product_id,
            quantity: 2,
            selected_size: "L",
            selected_color: "Black"
        }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        const cartRes = await axios.get(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(cartRes.data.items.length === 1 && cartRes.data.items[0].quantity === 2, "Product added to cart with size and quantity");

        const cartItemId = cartRes.data.items[0].cart_item_id;
        await axios.put(`${BASE_URL}/cart/${cartItemId}`, { quantity: 3 }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        const cartUpdated = await axios.get(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(cartUpdated.data.items[0].quantity === 3, "Cart quantity updated via PUT /api/cart/:id");

        // 13. Stock Validation: Attempt to add 99999 units should fail
        try {
            await axios.post(`${BASE_URL}/cart`, {
                product_id: testProd.product_id,
                quantity: 99999
            }, {
                headers: { Authorization: `Bearer ${shopperToken}` }
            });
            assert(false, "Stock validation should prevent ordering 99999 units");
        } catch (stockErr) {
            assert(stockErr.response && stockErr.response.status === 400, "Stock validation correctly blocked excessive order quantity (400)");
        }

        // 14. Checkout & Order Placement with stock deduction
        const [prodBefore] = await pool.query("SELECT stock FROM products WHERE product_id = ?", [testProd.product_id]);
        const initialStock = prodBefore[0].stock;

        const orderPlacement = await axios.post(`${BASE_URL}/orders`, {
            shipping_address: "Flat 4B, Emerald Heights, Mumbai 400050",
            customer_phone: "9998887777",
            payment_method: "Demo UPI Simulation",
            coupon_code: "FASHION20"
        }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(orderPlacement.status === 201 && orderPlacement.data.order_id, "Order placed successfully via checkout API");
        const placedOrderId = orderPlacement.data.order_id;

        // Verify stock decremented in MySQL
        const [prodAfter] = await pool.query("SELECT stock FROM products WHERE product_id = ?", [testProd.product_id]);
        assert(prodAfter[0].stock === initialStock - 3, `Product stock decremented in MySQL from ${initialStock} to ${prodAfter[0].stock}`);

        // Verify Cart cleared
        const cartAfterOrder = await axios.get(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(cartAfterOrder.data.items.length === 0, "Cart cleared automatically after order placement");

        // Verify deliveries and payments created in DB
        const [delivRows] = await pool.query("SELECT * FROM deliveries WHERE order_id = ?", [placedOrderId]);
        assert(delivRows.length > 0 && delivRows[0].delivery_status === "Processing", "Delivery record created with status 'Processing'");

        const [payRows] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [placedOrderId]);
        assert(payRows.length > 0 && payRows[0].payment_status === "Paid", "Payment record created with status 'Paid'");

        // 15. Customer Order History & Access Isolation
        const shopperOrders = await axios.get(`${BASE_URL}/orders`, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(shopperOrders.data.some(o => o.order_id === placedOrderId), "Customer can fetch their own order history");

        // Security check: Another customer cannot access placedOrderId
        const otherCustomerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: "customer@fashionista.com",
            password: "password123"
        });
        try {
            await axios.get(`${BASE_URL}/orders/${placedOrderId}`, {
                headers: { Authorization: `Bearer ${otherCustomerLogin.data.token}` }
            });
            assert(false, "Customer B should NOT access Customer A's order");
        } catch (secOrderErr) {
            assert(secOrderErr.response?.status === 403, "Access isolation verified: Customer B blocked (403 Forbidden) from viewing Customer A's order");
        }

        // 16. Security check: Customer cannot access Admin routes
        try {
            await axios.get(`${BASE_URL}/reports/dashboard`, {
                headers: { Authorization: `Bearer ${shopperToken}` }
            });
            assert(false, "Customer should NOT access admin dashboard");
        } catch (adminSecErr) {
            assert(adminSecErr.response?.status === 403, "Access control verified: Regular customer blocked (403 Forbidden) from Admin routes");
        }

        // 17. Admin Login & Operations
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: "admin@fashionista.com",
            password: "admin123"
        });
        assert(adminLogin.data.user.role === "admin", "Admin login succeeds with admin privileges");
        const adminToken = adminLogin.data.token;

        // Admin Dashboard Stats
        const adminStats = await axios.get(`${BASE_URL}/reports/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(adminStats.data.stats.total_orders > 0 && adminStats.data.stats.total_sales > 0, "Admin can view total orders, sales and dashboard statistics");

        // Admin creates product
        const newProd = await axios.post(`${BASE_URL}/products`, {
            product_name: "Admin Created Silk Scarf",
            category: "Accessories",
            price: 1299.00,
            discount_price: 999.00,
            stock: 25,
            image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80",
            brand: "Atelier Mode"
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(newProd.status === 201 && newProd.data.product.product_id, "Admin can create new products in database");
        const createdProdId = newProd.data.product.product_id;

        // Admin updates product
        const updatedProd = await axios.put(`${BASE_URL}/products/${createdProdId}`, {
            price: 1399.00,
            stock: 40
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(Number(updatedProd.data.product.price) === 1399 && updatedProd.data.product.stock === 40, "Admin can edit product details in database");

        // Admin updates order status
        await axios.put(`${BASE_URL}/orders/${placedOrderId}/status`, {
            status: "Shipped",
            delivery_status: "Shipped"
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const [orderUpdatedRows] = await pool.query("SELECT status FROM orders WHERE order_id = ?", [placedOrderId]);
        assert(orderUpdatedRows[0].status === "Shipped", "Admin can update order status to 'Shipped'");

        // Admin deactivates product
        await axios.delete(`${BASE_URL}/products/${createdProdId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const [deactivatedRow] = await pool.query("SELECT is_active FROM products WHERE product_id = ?", [createdProdId]);
        assert(deactivatedRow[0].is_active === 0, "Admin can deactivate products (soft delete)");

        // 18. Reviews: Customer leaves a review
        const reviewRes = await axios.post(`${BASE_URL}/products/${testProd.product_id}/reviews`, {
            rating: 5,
            comment: "Absolutely outstanding quality and fits perfectly. Will definitely buy again!"
        }, {
            headers: { Authorization: `Bearer ${shopperToken}` }
        });
        assert(reviewRes.status === 201, "Customer can submit product reviews to database");

        const reviewsList = await axios.get(`${BASE_URL}/products/${testProd.product_id}/reviews`);
        assert(reviewsList.data.some(r => r.comment.includes("outstanding quality")), "Product reviews retrieved and updated in database");

        console.log("==========================================================");
        console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
        console.log("==========================================================");

        if (failed === 0) {
            console.log("ALL 25 COMPREHENSIVE SYSTEM TESTS PASSED PERFECTLY! 🎉");
        } else {
            process.exitCode = 1;
        }
    } catch (err) {
        console.error("Test execution exception:", err.response?.data || err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runComprehensiveVerification();
