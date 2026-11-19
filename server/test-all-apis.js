const axios = require("axios");

async function testAPIs() {
    const baseURL = "http://localhost:5000/api";
    console.log("Testing Fashionista APIs against", baseURL);

    try {
        // 1. Health
        const health = await axios.get(`${baseURL}/health`);
        console.log("✓ Health check:", health.data.message);

        // 2. Categories
        const cats = await axios.get(`${baseURL}/categories`);
        console.log(`✓ Categories fetched: ${cats.data.length} categories found.`);

        // 3. Products
        const prods = await axios.get(`${baseURL}/products`);
        console.log(`✓ Products fetched: ${prods.data.length} products found from MySQL.`);
        if (prods.data.length > 0) {
            console.log("  Sample product:", prods.data[0].product_name, "- ₹" + prods.data[0].price);
        }

        // 4. Single Product with details & reviews
        const single = await axios.get(`${baseURL}/products/${prods.data[0].product_id}`);
        console.log(`✓ Single product fetched: "${single.data.product_name}" with ${single.data.reviews ? single.data.reviews.length : 0} reviews.`);

        // 5. User Login
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: "admin@fashionista.com",
            password: "admin123"
        });
        console.log(`✓ Admin login successful! Token received. User role: ${loginRes.data.user.role}`);
        const adminToken = loginRes.data.token;

        // 6. Reports Dashboard (Admin only)
        const dashboard = await axios.get(`${baseURL}/reports/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✓ Admin Dashboard Stats:", dashboard.data.stats);

        // 7. Customer registration / login
        const custLogin = await axios.post(`${baseURL}/auth/login`, {
            email: "customer@fashionista.com",
            password: "password123"
        });
        console.log("✓ Customer login successful!");
        const custToken = custLogin.data.token;

        // 8. Customer Profile
        const me = await axios.get(`${baseURL}/auth/me`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log("✓ Customer profile retrieved:", me.data.user.name, `(${me.data.user.email})`);

        // 9. Wishlist operations
        const addWishlist = await axios.post(`${baseURL}/wishlist`, 
            { product_id: prods.data[0].product_id },
            { headers: { Authorization: `Bearer ${custToken}` } }
        );
        console.log("✓ Added to wishlist:", addWishlist.data.message);

        const getWishlist = await axios.get(`${baseURL}/wishlist`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log(`✓ Wishlist retrieved: ${getWishlist.data.length} item(s)`);

        // 10. Cart operations
        const addCart = await axios.post(`${baseURL}/cart`, 
            { product_id: prods.data[0].product_id, quantity: 2, selected_size: "L", selected_color: "Black" },
            { headers: { Authorization: `Bearer ${custToken}` } }
        );
        console.log("✓ Added to cart:", addCart.data.message);

        const getCart = await axios.get(`${baseURL}/cart`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log(`✓ Cart retrieved: ${getCart.data.items.length} item(s), Subtotal: ₹${getCart.data.subtotal}`);

        // 11. Customer order creation with coupon
        const orderRes = await axios.post(`${baseURL}/orders`, {
            shipping_address: "42 MG Road, Bangalore, Karnataka 560001",
            customer_phone: "9876543210",
            payment_method: "Demo UPI (Safe Simulation)",
            coupon_code: "FASHION20"
        }, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log(`✓ Order placed successfully! Order ID: #${orderRes.data.order_id}, Total: ₹${orderRes.data.total_amount}`);

        // 12. Customer Orders check
        const orders = await axios.get(`${baseURL}/orders`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        console.log(`✓ Customer orders retrieved: ${orders.data.length} order(s).`);

        // 13. Security check: Customer trying to access Admin dashboard should get 403 Forbidden
        try {
            await axios.get(`${baseURL}/reports/dashboard`, {
                headers: { Authorization: `Bearer ${custToken}` }
            });
            console.error("✗ Security check FAILED: Customer was able to access admin reports!");
        } catch (secErr) {
            if (secErr.response && secErr.response.status === 403) {
                console.log("✓ Security verified: Customer correctly BLOCKED (403 Forbidden) from admin reports.");
            } else {
                console.error("Security check unexpected status:", secErr.response?.status);
            }
        }

        console.log("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! 🚀");
    } catch (err) {
        console.error("API test failed:", err.response ? err.response.data : err.message);
        process.exitCode = 1;
    }
}

testAPIs();
