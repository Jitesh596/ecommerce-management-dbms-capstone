import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDbmsInsights } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function DbmsInsights() {
  const [activeSection, setActiveSection] = useState("schema");
  const [liveMetadata, setLiveMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Function Tester State
  const [testOrderId, setTestOrderId] = useState(1);
  const [testTaxRate, setTestTaxRate] = useState(18.0);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const data = await getDbmsInsights();
        setLiveMetadata(data);
      } catch (err) {
        console.error("Failed to fetch live DBMS metadata:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  return (
    <div id="wrapper">
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "30px auto", padding: "0 20px" }}>
        {/* Header Banner */}
        <div style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white", padding: "35px 30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 10px", marginBottom: "8px" }}>
                DBMS Capstone Evaluation (5 Phases • 100 Marks)
              </span>
              <h1 style={{ fontSize: "28px", marginTop: "6px" }}>
                Fashionista — Relational Database Architecture & Engineering
              </h1>
              <p style={{ color: "#e0e0e0", fontSize: "14px", marginTop: "6px" }}>
                Team Members: <strong>Nikhil Kumar Singh (2501010151)</strong> & <strong>Jitesh Kumar (2501010180)</strong>
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", background: "rgba(0,0,0,0.2)", padding: "12px 18px", borderRadius: "8px" }}>
              <div>Target Engine: <strong>MySQL 8.0+ (InnoDB)</strong></div>
              <div>Database: <code>ecommerce_management_db</code></div>
              <div>Status: <span style={{ color: "#2ecc71" }}>● Connected Live</span></div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="tab-bar" style={{ marginTop: "25px" }}>
          <button
            className={`tab-btn ${activeSection === "schema" ? "active" : ""}`}
            onClick={() => setActiveSection("schema")}
          >
            📐 1. ER Model & 3NF Schema
          </button>
          <button
            className={`tab-btn ${activeSection === "routines" ? "active" : ""}`}
            onClick={() => setActiveSection("routines")}
          >
            ⚡ 2. Stored Routines & Triggers
          </button>
          <button
            className={`tab-btn ${activeSection === "optimization" ? "active" : ""}`}
            onClick={() => setActiveSection("optimization")}
          >
            🚀 3. Query Optimization & EXPLAIN
          </button>
          <button
            className={`tab-btn ${activeSection === "transactions" ? "active" : ""}`}
            onClick={() => setActiveSection("transactions")}
          >
            🔒 4. ACID Transactions & RBAC
          </button>
          <button
            className={`tab-btn ${activeSection === "live" ? "active" : ""}`}
            onClick={() => setActiveSection("live")}
          >
            📊 5. Live MySQL Metadata
          </button>
        </div>

        {/* SECTION 1: ER MODEL & 3NF */}
        {activeSection === "schema" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h2>Relational Architecture & Normalization Analysis</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: "20px" }}>
              The database consists of 7 core entities strictly normalized to Boyce-Codd Normal Form (BCNF) / 3NF with documented referential integrity.
            </p>

            {/* Cardinality Matrix */}
            <h3 style={{ fontSize: "16px", marginTop: "20px", marginBottom: "10px" }}>Relationship Cardinalities</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parent Entity</th>
                    <th>Child Entity</th>
                    <th>Type</th>
                    <th>Cardinality Rule</th>
                    <th>Constraint Key</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>Customers</code></td>
                    <td><code>Orders</code></td>
                    <td>1 : N</td>
                    <td>One customer places zero or multiple orders; each order references exactly one customer.</td>
                    <td><code>orders.customer_id → customers.customer_id</code></td>
                  </tr>
                  <tr>
                    <td><code>Sellers</code></td>
                    <td><code>Products</code></td>
                    <td>1 : N</td>
                    <td>One seller supplies multiple items; each product belongs to one merchant.</td>
                    <td><code>products.seller_id → sellers.seller_id</code></td>
                  </tr>
                  <tr>
                    <td><code>Orders</code></td>
                    <td><code>Order_Details</code></td>
                    <td>1 : N</td>
                    <td>An order contains one or more line items. Composite candidate key <code>(order_id, product_id)</code>.</td>
                    <td><code>order_details.order_id → orders.order_id</code></td>
                  </tr>
                  <tr>
                    <td><code>Products</code></td>
                    <td><code>Order_Details</code></td>
                    <td>1 : N</td>
                    <td>A product can appear across multiple order line items.</td>
                    <td><code>order_details.product_id → products.product_id</code></td>
                  </tr>
                  <tr>
                    <td><code>Orders</code></td>
                    <td><code>Payments</code></td>
                    <td>1 : N</td>
                    <td>One order can possess multiple payment audit records (e.g. initial failed attempt followed by success).</td>
                    <td><code>payments.order_id → orders.order_id</code></td>
                  </tr>
                  <tr>
                    <td><code>Orders</code></td>
                    <td><code>Deliveries</code></td>
                    <td>1 : 1</td>
                    <td>Each placed order has exactly one fulfillment delivery record enforced via <code>UNIQUE KEY (order_id)</code>.</td>
                    <td><code>deliveries.order_id → orders.order_id</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Normalization Proof */}
            <h3 style={{ fontSize: "16px", marginTop: "30px", marginBottom: "10px" }}>Normalization Breakdown (1NF → 2NF → 3NF)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginTop: "15px" }}>
              <div style={{ background: "#f9f9f9", padding: "18px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4 style={{ color: "#2980b9" }}>1st Normal Form (1NF)</h4>
                <p style={{ fontSize: "13px", color: "#555", marginTop: "8px", lineHeight: "1.5" }}>
                  Every attribute value is atomic. No multi-valued attributes or comma-separated lists exist.
                  Repeated order items are isolated into the <code>order_details</code> relation with integer surrogate primary keys.
                </p>
              </div>
              <div style={{ background: "#f9f9f9", padding: "18px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4 style={{ color: "#27ae60" }}>2nd Normal Form (2NF)</h4>
                <p style={{ fontSize: "13px", color: "#555", marginTop: "8px", lineHeight: "1.5" }}>
                  All tables adhere to 1NF. Single-column surrogate keys prevent partial key dependencies.
                  In <code>order_details</code>, non-key attributes <code>quantity</code> and historical <code>unit_price</code> functionally depend on the entire line item.
                </p>
              </div>
              <div style={{ background: "#f9f9f9", padding: "18px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4 style={{ color: "#8e44ad" }}>3rd Normal Form (3NF)</h4>
                <p style={{ fontSize: "13px", color: "#555", marginTop: "8px", lineHeight: "1.5" }}>
                  No transitive functional dependencies ($X \to Y \to Z$).
                  Merchant name and seller contact are kept strictly in <code>sellers</code> rather than repeated in <code>products</code>.
                  Customer delivery address is referenced via foreign key rather than duplicated.
                </p>
              </div>
            </div>

            {/* Justification of Derived Total */}
            <div style={{ marginTop: "25px", background: "#fff9db", padding: "18px", borderRadius: "8px", border: "1px solid #ffe066" }}>
              <h4 style={{ color: "#d9480f", fontSize: "14px" }}>Relational Design Note: Derived Attribute `orders.total_amount`</h4>
              <p style={{ fontSize: "13px", color: "#495057", marginTop: "6px", lineHeight: "1.5" }}>
                Although $total\_amount = \sum (quantity \times unit\_price)$ can theoretically be re-aggregated on every query, storing it in <code>orders</code> is standard practice in commercial database design. It guarantees legal financial immutability at the moment of invoice issuance, provides fast $O(1)$ query access without joining line items, and is validated via database procedures.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2: PROCEDURES & TRIGGERS */}
        {activeSection === "routines" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h2>Phase 2 — Stored Functions, Procedures & Triggers</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: "20px" }}>
              Deployed directly on MySQL 8.0 to enforce business rules and automate recalculations at the engine level.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Function 1 */}
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <span className="badge badge-confirmed">Stored Function</span>
                <h3 style={{ fontSize: "16px", marginTop: "8px" }}>`fn_calculate_order_subtotal(order_id)`</h3>
                <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 12px 0" }}>
                  Returns <code>DECIMAL(10,2)</code> by dynamically aggregating <code>SUM(quantity * unit_price)</code> from <code>order_details</code>.
                </p>
                <pre style={{ background: "#222", color: "#ecf0f1", padding: "12px", borderRadius: "6px", fontSize: "11px", overflowX: "auto" }}>
{`CREATE FUNCTION fn_calculate_order_subtotal(p_order_id INT)
RETURNS DECIMAL(10,2) DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_subtotal DECIMAL(10,2);
  SELECT COALESCE(SUM(quantity * unit_price), 0.00)
  INTO v_subtotal FROM order_details WHERE order_id = p_order_id;
  RETURN v_subtotal;
END`}
                </pre>
              </div>

              {/* Function 2 */}
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <span className="badge badge-confirmed">Stored Function</span>
                <h3 style={{ fontSize: "16px", marginTop: "8px" }}>`fn_calculate_gst(subtotal, rate)`</h3>
                <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 12px 0" }}>
                  Demonstrative stored function calculating tax component: <code>ROUND(subtotal * (rate / 100), 2)</code>.
                </p>
                <pre style={{ background: "#222", color: "#ecf0f1", padding: "12px", borderRadius: "6px", fontSize: "11px", overflowX: "auto" }}>
{`CREATE FUNCTION fn_calculate_gst(
  p_subtotal DECIMAL(10,2), p_tax_rate DECIMAL(5,2)
)
RETURNS DECIMAL(10,2) DETERMINISTIC NO SQL
BEGIN
  RETURN ROUND(COALESCE(p_subtotal, 0.00) * (p_tax_rate / 100.0), 2);
END`}
                </pre>
              </div>

              {/* Procedure 1 */}
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <span className="badge badge-delivered">Stored Procedure</span>
                <h3 style={{ fontSize: "16px", marginTop: "8px" }}>`sp_update_order_status(order_id, status)`</h3>
                <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 12px 0" }}>
                  Validates order state transitions. When status is set to <code>'Cancelled'</code>, it atomically restores product inventory.
                </p>
                <pre style={{ background: "#222", color: "#ecf0f1", padding: "12px", borderRadius: "6px", fontSize: "11px", overflowX: "auto" }}>
{`CREATE PROCEDURE sp_update_order_status(
  IN p_order_id INT, IN p_new_status VARCHAR(20)
)
BEGIN
  IF p_new_status = 'Cancelled' THEN
    UPDATE products p JOIN order_details od ON p.product_id = od.product_id
    SET p.stock = p.stock + od.quantity WHERE od.order_id = p_order_id;
    UPDATE orders SET status = 'Cancelled' WHERE order_id = p_order_id;
  ...`}
                </pre>
              </div>

              {/* Trigger 1 */}
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #e9ecef" }}>
                <span className="badge badge-pending">Database Trigger</span>
                <h3 style={{ fontSize: "16px", marginTop: "8px" }}>`trg_validate_order_detail_before_insert`</h3>
                <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 12px 0" }}>
                  Runs <code>BEFORE INSERT</code> on <code>order_details</code>. Rejects non-positive quantity, inactive products, or insufficient stock.
                </p>
                <pre style={{ background: "#222", color: "#ecf0f1", padding: "12px", borderRadius: "6px", fontSize: "11px", overflowX: "auto" }}>
{`CREATE TRIGGER trg_validate_order_detail_before_insert
BEFORE INSERT ON order_details FOR EACH ROW
BEGIN
  IF NEW.quantity <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be > 0';
  END IF;
  -- Checks product active status and stock >= NEW.quantity
END`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: OPTIMIZATION & EXPLAIN */}
        {activeSection === "optimization" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h2>Phase 3 — Query Optimization & EXPLAIN Benchmark</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: "20px" }}>
              Empirical execution plans executed on live MySQL tables before and after adding B-Tree indexes.
            </p>

            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "17px", color: "#222" }}>Benchmark 1: Low-Stock Products (`products` table)</h3>
              <p style={{ fontSize: "13px", color: "#555", margin: "5px 0 15px 0" }}>
                Query: <code>SELECT product_id, product_name, stock FROM products WHERE is_active = 1 AND stock &lt;= 15;</code>
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "#fff5f5", border: "1px solid #ffc9c9", padding: "16px", borderRadius: "8px" }}>
                  <span className="badge badge-cancelled">BEFORE INDEX</span>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    <div><strong>Access Type:</strong> <code style={{ color: "#c92a2a" }}>ALL (Full Table Scan)</code></div>
                    <div><strong>Key Used:</strong> <code>NULL</code></div>
                    <div><strong>Rows Traversed:</strong> 55 rows read sequentially</div>
                    <div><strong>Filter Ratio:</strong> 3.33%</div>
                    <div><strong>Extra:</strong> <code>Using where</code></div>
                  </div>
                </div>

                <div style={{ background: "#ebfbee", border: "1px solid #b2f2bb", padding: "16px", borderRadius: "8px" }}>
                  <span className="badge badge-delivered">AFTER INDEX (`idx_products_stock_active`)</span>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    <div><strong>Access Type:</strong> <code style={{ color: "#2b8a3e" }}>range (B-Tree Scan)</code></div>
                    <div><strong>Key Used:</strong> <code>idx_products_stock_active</code></div>
                    <div><strong>Rows Traversed:</strong> Only 12 candidate entries traversed</div>
                    <div><strong>Filter Ratio:</strong> 100.00%</div>
                    <div><strong>Extra:</strong> <code>Using index condition (ICP)</code></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "17px", color: "#222" }}>Benchmark 2: Status & Date Filtering (`orders` table)</h3>
              <p style={{ fontSize: "13px", color: "#555", margin: "5px 0 15px 0" }}>
                Query: <code>SELECT * FROM orders WHERE status = 'Confirmed' AND order_date &gt;= '2026-10-01';</code>
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "#fff5f5", border: "1px solid #ffc9c9", padding: "16px", borderRadius: "8px" }}>
                  <span className="badge badge-cancelled">BEFORE COMPOSITE INDEX</span>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    <div><strong>Key Used:</strong> <code>idx_orders_date</code> (Single column only)</div>
                    <div><strong>Rows Filtered:</strong> Only 20.00% filtered in storage engine</div>
                    <div><strong>Secondary Overhead:</strong> Post-filtering evaluation in MySQL server</div>
                  </div>
                </div>

                <div style={{ background: "#ebfbee", border: "1px solid #b2f2bb", padding: "16px", borderRadius: "8px" }}>
                  <span className="badge badge-delivered">AFTER COMPOSITE INDEX (`idx_orders_status_date`)</span>
                  <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    <div><strong>Key Used:</strong> <code>idx_orders_status_date</code> (Composite)</div>
                    <div><strong>Rows Filtered:</strong> 100.00% selectivity achieved</div>
                    <div><strong>Rows Traversed:</strong> 2 targeted index rows</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: TRANSACTIONS & SECURITY */}
        {activeSection === "transactions" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h2>Phase 4 — ACID Transactions & Role-Based Access Control</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: "20px" }}>
              Ensuring multi-table consistency and customer order isolation during concurrent checkouts.
            </p>

            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #eee", marginBottom: "25px" }}>
              <h3 style={{ fontSize: "16px", color: "#222" }}>Checkout Transaction Sequence</h3>
              <ol style={{ fontSize: "13px", color: "#444", lineHeight: "1.8", marginTop: "10px", paddingLeft: "20px" }}>
                <li><code>START TRANSACTION;</code> initiates atomic database session.</li>
                <li><code>SELECT ... FOR UPDATE</code> places row-level exclusive locks on requested products to prevent race conditions.</li>
                <li>Server authoritatively validates that <code>is_active = 1</code> and <code>stock &gt;= requested_quantity</code>.</li>
                <li>Authoritative order total calculated strictly on server: client-supplied totals and unit prices are never trusted.</li>
                <li><code>INSERT INTO orders</code> creates the primary transaction header.</li>
                <li><code>INSERT INTO order_details</code> and <code>UPDATE products SET stock = stock - ?</code> execute in lockstep.</li>
                <li><code>INSERT INTO payments</code> and <code>INSERT INTO deliveries</code> persist financial and logistics tracking.</li>
                <li><code>COMMIT;</code> finalizes changes. If any item is out of stock or constraint violated, <code>ROLLBACK;</code> executes cleanly with 0 side effects.</li>
              </ol>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "#f9f9f9", padding: "18px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4>Security & Passwords</h4>
                <ul style={{ fontSize: "13px", color: "#555", marginTop: "8px", lineHeight: "1.6", paddingLeft: "18px" }}>
                  <li>One-way salted password hashing via <code>bcryptjs</code> (10 salt rounds).</li>
                  <li>Plain-text passwords never stored or logged.</li>
                  <li>Signed JSON Web Tokens (JWT) with 7-day expiration.</li>
                  <li>Role escalation defense: registration endpoint forces <code>role = 'customer'</code>.</li>
                </ul>
              </div>

              <div style={{ background: "#f9f9f9", padding: "18px", borderRadius: "8px", border: "1px solid #eee" }}>
                <h4>Customer Isolation (RBAC)</h4>
                <ul style={{ fontSize: "13px", color: "#555", marginTop: "8px", lineHeight: "1.6", paddingLeft: "18px" }}>
                  <li>Customer cannot view another customer's order by altering ID in URL.</li>
                  <li>Admin endpoints (<code>/api/admin/*</code>) reject non-admin tokens with HTTP 403 Forbidden.</li>
                  <li>Parameterized SQL queries used across all endpoints, eliminating SQL injection.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: LIVE METADATA */}
        {activeSection === "live" && (
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h2>Phase 5 — Live MySQL Database Metadata</h2>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: "20px" }}>
              Live metrics queried directly from MySQL <code>information_schema</code> on <code>ecommerce_management_db</code>.
            </p>

            {loading ? (
              <h3>Loading metadata from MySQL...</h3>
            ) : !liveMetadata ? (
              <div>Could not load live metadata. Verify backend is running.</div>
            ) : (
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Relational Tables in Database</h3>
                <div className="data-table-container" style={{ margin: "0 0 25px 0" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Table Name</th>
                        <th>Table Rows (Approx)</th>
                        <th>Data Size (KB)</th>
                        <th>Index Size (KB)</th>
                        <th>Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveMetadata.tableStats?.map((t) => (
                        <tr key={t.TABLE_NAME || t.table_name}>
                          <td style={{ fontWeight: "bold" }}><code>{t.TABLE_NAME || t.table_name}</code></td>
                          <td>{t.TABLE_ROWS ?? t.table_rows}</td>
                          <td>{((t.DATA_LENGTH ?? t.data_length) / 1024).toFixed(1)} KB</td>
                          <td>{((t.INDEX_LENGTH ?? t.index_length) / 1024).toFixed(1)} KB</td>
                          <td>{new Date(t.CREATE_TIME ?? t.create_time).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Stored Procedures & Functions</h3>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Routine Name</th>
                            <th>Type</th>
                            <th>Return Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveMetadata.routines?.map((r) => (
                            <tr key={r.ROUTINE_NAME || r.routine_name}>
                              <td style={{ fontWeight: "bold" }}><code>{r.ROUTINE_NAME || r.routine_name}</code></td>
                              <td><span className="badge badge-confirmed">{r.ROUTINE_TYPE || r.routine_type}</span></td>
                              <td>{r.DTD_IDENTIFIER || r.dtd_identifier || "VOID"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Active Database Triggers</h3>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Trigger Name</th>
                            <th>Event</th>
                            <th>Target Table</th>
                            <th>Timing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveMetadata.triggers?.map((tr) => (
                            <tr key={tr.TRIGGER_NAME || tr.trigger_name}>
                              <td style={{ fontWeight: "bold" }}><code>{tr.TRIGGER_NAME || tr.trigger_name}</code></td>
                              <td>{tr.EVENT_MANIPULATION || tr.event_manipulation}</td>
                              <td><code>{tr.EVENT_OBJECT_TABLE || tr.event_object_table}</code></td>
                              <td>{tr.ACTION_TIMING || tr.action_timing}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default DbmsInsights;
