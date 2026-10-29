const axios = require('axios');
const pool = require('../db');
const app = require('../server');

const BASE_URL = 'http://localhost:5001/api';
let serverInstance;

// Helper to log test status
let passCount = 0;
let failCount = 0;
const testResults = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${testName}`);
    testResults.push({ name: testName, status: 'PASS', details });
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    testResults.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('FASHIONISTA DBMS CAPSTONE — AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  // Start test server on port 5001
  await new Promise((resolve) => {
    serverInstance = app.listen(5001, () => {
      console.log('Test server started on port 5001.\n');
      resolve();
    });
  });

  try {
    const testTimestamp = Date.now();
    const testCustomerEmail = `test_customer_${testTimestamp}@example.com`;
    const testAdminEmail = 'admin@fashionista.com';
    let customerToken = '';
    let customerId = null;
    let adminToken = '';

    // ------------------------------------------------------------------------
    // TEST 1: Valid Customer Registration
    // ------------------------------------------------------------------------
    console.log('[Phase 4.A] Authentication & Registration Tests');
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Runner Customer',
        email: testCustomerEmail,
        password: 'Password@123',
        phone: '9876599999',
        address: 'Test Suite Flat 101, Test City'
      });
      assert(res.status === 201 && res.data.token && res.data.user.role === 'customer', 'Valid customer registration creates account with role customer');
      customerToken = res.data.token;
      customerId = res.data.user.customer_id;
    } catch (err) {
      assert(false, 'Valid customer registration', err.response?.data?.error || err.message);
    }

    // ------------------------------------------------------------------------
    // TEST 2: Duplicate Registration Rejection
    // ------------------------------------------------------------------------
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Duplicate Attempt',
        email: testCustomerEmail,
        password: 'Password@123'
      });
      assert(false, 'Duplicate registration rejection', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Duplicate email registration rejected with 400');
    }

    // ------------------------------------------------------------------------
    // TEST 3: Invalid Password Rejection (< 6 chars)
    // ------------------------------------------------------------------------
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Short Pwd',
        email: `short_${testTimestamp}@example.com`,
        password: '123'
      });
      assert(false, 'Password < 6 chars rejection', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Short password (< 6 chars) rejected with 400');
    }

    // ------------------------------------------------------------------------
    // TEST 4: Valid Login & Invalid Password Login
    // ------------------------------------------------------------------------
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: testCustomerEmail,
        password: 'Password@123'
      });
      assert(res.status === 200 && res.data.token, 'Valid login returns JWT token');
    } catch (err) {
      assert(false, 'Valid login', err.response?.data?.error || err.message);
    }

    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testCustomerEmail,
        password: 'WrongPassword!99'
      });
      assert(false, 'Invalid password login rejection', 'Should have failed with 401');
    } catch (err) {
      assert(err.response?.status === 401, 'Invalid password correctly rejected with 401');
    }

    // Login as Admin
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: testAdminEmail,
        password: 'Admin@123'
      });
      assert(res.status === 200 && res.data.user.role === 'admin', 'Admin login successful with role admin');
      adminToken = res.data.token;
    } catch (err) {
      assert(false, 'Admin login', err.response?.data?.error || err.message);
    }

    // ------------------------------------------------------------------------
    // TEST 5: Role-Based Access Control (RBAC)
    // ------------------------------------------------------------------------
    console.log('\n[Phase 4.B] Role-Based Access Control (RBAC) Tests');
    try {
      await axios.get(`${BASE_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(false, 'Customer accessing admin endpoint rejection', 'Should have returned 403 Forbidden');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer forbidden (403) from accessing admin overview endpoint');
    }

    try {
      const res = await axios.get(`${BASE_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200 && res.data.total_customers >= 5, 'Admin successfully accesses admin overview endpoint');
    } catch (err) {
      assert(false, 'Admin accessing admin overview', err.response?.data?.error || err.message);
    }

    // ------------------------------------------------------------------------
    // TEST 6: Validation on Checkout (Negative Quantity, Invalid Product ID)
    // ------------------------------------------------------------------------
    console.log('\n[Phase 4.C] Database Transactions & Inventory Validation Tests');
    try {
      await axios.post(
        `${BASE_URL}/orders/checkout`,
        { items: [{ product_id: 1, quantity: -2 }] },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(false, 'Negative quantity rejection', 'Should have returned 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Negative order quantity rejected with 400');
    }

    try {
      await axios.post(
        `${BASE_URL}/orders/checkout`,
        { items: [{ product_id: 999999, quantity: 1 }] },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(false, 'Invalid product ID rejection', 'Should have returned 404');
    } catch (err) {
      assert(err.response?.status === 404, 'Non-existent product ID rejected with 404');
    }

    // ------------------------------------------------------------------------
    // TEST 7: Insufficient Stock & Atomic Transaction Rollback
    // ------------------------------------------------------------------------
    let initialOrdersCount = 0;
    let initialProductStock = 0;
    const [ordRows] = await pool.query('SELECT COUNT(*) as c FROM orders');
    initialOrdersCount = ordRows[0].c;

    const [prodRows] = await pool.query('SELECT stock FROM products WHERE product_id = 1');
    initialProductStock = prodRows[0].stock;

    try {
      await axios.post(
        `${BASE_URL}/orders/checkout`,
        {
          items: [
            { product_id: 1, quantity: 1 }, // Valid
            { product_id: 2, quantity: 999999 } // Way beyond available stock!
          ]
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(false, 'Insufficient stock rejection', 'Should have returned 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Insufficient stock rejected with 400');
    }

    // Verify atomic rollback: No new order created, stock of product 1 remains untouched!
    const [afterOrdRows] = await pool.query('SELECT COUNT(*) as c FROM orders');
    const [afterProdRows] = await pool.query('SELECT stock FROM products WHERE product_id = 1');
    assert(
      afterOrdRows[0].c === initialOrdersCount && afterProdRows[0].stock === initialProductStock,
      'Atomic Transaction Rollback: No partial order created and stock remains intact on failure'
    );

    // ------------------------------------------------------------------------
    // TEST 8: Successful Order Placement inside Database Transaction
    // ------------------------------------------------------------------------
    let createdOrderId = null;
    const orderQty = 2;
    try {
      const res = await axios.post(
        `${BASE_URL}/orders/checkout`,
        {
          items: [{ product_id: 1, quantity: orderQty }],
          delivery_address: '123 MG Road, Bangalore, Karnataka',
          payment_method: 'UPI Demo'
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(res.status === 201 && res.data.order_id, 'Successful checkout creates order inside database transaction');
      createdOrderId = res.data.order_id;

      // Verify stock was decremented accurately
      const [newProdRows] = await pool.query('SELECT stock FROM products WHERE product_id = 1');
      assert(newProdRows[0].stock === initialProductStock - orderQty, `Authoritative stock decremented by ${orderQty}`);
    } catch (err) {
      assert(false, 'Successful checkout placement', err.response?.data?.error || err.message);
    }

    // ------------------------------------------------------------------------
    // TEST 9: Unauthorized Order Access Between Customers
    // ------------------------------------------------------------------------
    console.log('\n[Phase 4.D] Order Access Protection & Isolation Tests');
    // Login as a second customer
    const secondCustEmail = `second_${testTimestamp}@example.com`;
    let secondToken = '';
    const regSecond = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Second Customer',
      email: secondCustEmail,
      password: 'Password@123'
    });
    secondToken = regSecond.data.token;

    try {
      // Second customer attempts to read createdOrderId belonging to first customer
      await axios.get(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${secondToken}` }
      });
      assert(false, 'Customer accessing another customer order', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer forbidden (403) from accessing another customer\'s order');
    }

    // First customer CAN access their own order
    try {
      const res = await axios.get(`${BASE_URL}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert(res.status === 200 && res.data.order_id === createdOrderId, 'Customer can access their own order');
    } catch (err) {
      assert(false, 'Customer accessing own order', err.response?.data?.error || err.message);
    }

    // ------------------------------------------------------------------------
    // TEST 10: Order Cancellation & Inventory Restoration
    // ------------------------------------------------------------------------
    console.log('\n[Phase 4.E] Order Cancellation & Inventory Restoration Tests');
    try {
      const res = await axios.put(
        `${BASE_URL}/orders/${createdOrderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(res.status === 200 && res.data.status === 'Cancelled', 'Order cancellation successfully updates status');

      // Verify inventory restoration
      const [restoredProdRows] = await pool.query('SELECT stock FROM products WHERE product_id = 1');
      assert(restoredProdRows[0].stock === initialProductStock, 'Cancelled order atomically restored reserved inventory to products table');
    } catch (err) {
      assert(false, 'Order cancellation', err.response?.data?.error || err.message);
    }

    // Repeat cancellation rejection
    try {
      await axios.put(
        `${BASE_URL}/orders/${createdOrderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      assert(false, 'Repeat cancellation rejection', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Repeat cancellation of already cancelled order rejected with 400');
    }

    // ------------------------------------------------------------------------
    // TEST 11: SQL Functions & Phase 3 Reports Execution
    // ------------------------------------------------------------------------
    console.log('\n[Phase 3 & 4] SQL Stored Routines & Reports Verification');
    try {
      const [subtotalRes] = await pool.query('SELECT fn_calculate_order_subtotal(1) as subtotal, fn_calculate_gst(fn_calculate_order_subtotal(1), 18.0) as gst');
      assert(Number(subtotalRes[0].subtotal) > 0 && Number(subtotalRes[0].gst) > 0, 'fn_calculate_order_subtotal and fn_calculate_gst return accurate values');
    } catch (err) {
      assert(false, 'SQL stored functions test', err.message);
    }

    try {
      const res = await axios.get(`${BASE_URL}/reports/monthly-sales`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200 && Array.isArray(res.data), 'Analytical report (Monthly Sales) executes and returns array');
    } catch (err) {
      assert(false, 'Monthly sales report', err.message);
    }

  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('====================================================');
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

runTestSuite();
