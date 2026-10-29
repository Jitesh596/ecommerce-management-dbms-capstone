# Fashionista — Automated Test Cases & Verification Report

## 1. Test Suite Summary
- **Target System:** Fashionista E-Commerce Management Database System
- **Test Runner:** `server/tests/run-tests.js`
- **Execution Date:** 2026-10-29
- **Total Test Cases Executed:** 21
- **Passed:** 21
- **Failed:** 0
- **Success Rate:** 100%

---

## 2. Test Cases and Empirical Execution Results

| Test ID | Category | Description | Input / Action | Expected Result | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Auth | Valid Customer Registration | `POST /api/auth/register` with valid payload | HTTP 201, JWT issued, user role forced to `customer` | HTTP 201, valid JWT token returned, role is `customer` | **PASS** |
| **TC-02** | Auth | Duplicate Email Registration | `POST /api/auth/register` with registered email | HTTP 400 rejection, informative duplicate message | HTTP 400, rejected duplicate email registration | **PASS** |
| **TC-03** | Auth | Weak / Short Password | `POST /api/auth/register` with password length < 6 | HTTP 400 rejection | HTTP 400, password length validated | **PASS** |
| **TC-04** | Auth | Valid Login | `POST /api/auth/login` with registered credentials | HTTP 200, JWT token returned, user profile returned | HTTP 200, valid JWT token returned | **PASS** |
| **TC-05** | Auth | Invalid Password Login | `POST /api/auth/login` with wrong password | HTTP 401 Unauthorized | HTTP 401, rejected bad password attempt | **PASS** |
| **TC-06** | Auth | Admin Login | `POST /api/auth/login` as `admin@fashionista.com` | HTTP 200, user role is `admin` | HTTP 200, role is `admin` | **PASS** |
| **TC-07** | RBAC | Customer Accessing Admin API | `GET /api/admin/overview` with Customer Bearer token | HTTP 403 Forbidden | HTTP 403, forbidden from administrative routes | **PASS** |
| **TC-08** | RBAC | Admin Accessing Admin API | `GET /api/admin/overview` with Admin Bearer token | HTTP 200, aggregate summary metrics returned | HTTP 200, metrics returned from MySQL | **PASS** |
| **TC-09** | Validation | Negative Product Quantity | `POST /api/orders/checkout` with `quantity: -2` | HTTP 400 rejection | HTTP 400, positive quantity enforced | **PASS** |
| **TC-10** | Validation | Invalid Product ID | `POST /api/orders/checkout` with `product_id: 999999` | HTTP 404 rejection | HTTP 404, non-existent product rejected | **PASS** |
| **TC-11** | Validation | Insufficient Stock | `POST /api/orders/checkout` requesting 999,999 units | HTTP 400 rejection | HTTP 400, insufficient stock message returned | **PASS** |
| **TC-12** | Transaction | Atomic Rollback on Failure | Checkout with 1 valid item and 1 invalid item | Transaction rolls back; 0 orders created; stock unchanged | Verified: `orders` count unchanged, stock untouched | **PASS** |
| **TC-13** | Transaction | Successful Checkout Placement | `POST /api/orders/checkout` with valid item list | HTTP 201, new order_id, status Confirmed | HTTP 201, order created, payment & delivery rows inserted | **PASS** |
| **TC-14** | Inventory | Authoritative Stock Decrement | Inspect stock in `products` after TC-13 order | Stock decremented by exact purchased quantity | Verified: product stock decremented by purchased qty | **PASS** |
| **TC-15** | Security | Cross-Customer Order Isolation | Customer B attempts to read Customer A's order | HTTP 403 Forbidden | HTTP 403, Customer B blocked from viewing Order A | **PASS** |
| **TC-16** | Security | Customer Accessing Own Order | Customer A reads Customer A's order | HTTP 200, line items, payment and delivery returned | HTTP 200, customer's own order retrieved | **PASS** |
| **TC-17** | Procedure | Order Cancellation via Procedure | `PUT /api/orders/:id/cancel` | HTTP 200, status updated to `Cancelled` | HTTP 200, `sp_update_order_status` executed | **PASS** |
| **TC-18** | Inventory | Inventory Restored on Cancel | Inspect product stock after TC-17 cancellation | Product stock restored back to original count | Verified: product stock incremented back | **PASS** |
| **TC-19** | Validation | Repeat Order Cancellation | Attempt to cancel already cancelled order | HTTP 400 rejection | HTTP 400, repeat cancellation rejected | **PASS** |
| **TC-20** | Routine | Stored SQL Functions Test | `fn_calculate_order_subtotal` & `fn_calculate_gst` | Accurate numeric subtotal and demo GST computed | Verified: Subtotal and GST calculated dynamically | **PASS** |
| **TC-21** | Reports | Analytical Report Execution | `GET /api/reports/monthly-sales` with Admin token | HTTP 200, aggregated monthly sales dataset | HTTP 200, live query results returned | **PASS** |

---

## 3. How to Run the Automated Test Suite
Ensure MySQL is running and execute:
```bash
node server/tests/run-tests.js
```
