const pool = require('./db');

async function createIndexSafe(table, indexName, columns) {
  const [existing] = await pool.query(
    'SELECT COUNT(*) as c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
    [table, indexName]
  );
  if (existing[0].c === 0) {
    await pool.query(`CREATE INDEX ${indexName} ON ${table}(${columns})`);
    console.log(`Created index ${indexName} on ${table}(${columns})`);
  } else {
    console.log(`Index ${indexName} already exists on ${table}`);
  }
}

async function testExplain() {
  try {
    console.log('=== BEFORE CREATING INDEXES ===');
    const [before1] = await pool.query('EXPLAIN SELECT product_id, product_name, stock FROM products WHERE is_active = 1 AND stock <= 15');
    console.log('Query: Products low-stock search (BEFORE)');
    console.table(before1);

    const [before2] = await pool.query("EXPLAIN SELECT * FROM orders WHERE status = 'Confirmed' AND order_date >= '2026-10-01'");
    console.log('Query: Orders status & date filter (BEFORE)');
    console.table(before2);

    console.log('\n--- CREATING INDEXES ---');
    await createIndexSafe('products', 'idx_products_stock_active', 'is_active, stock');
    await createIndexSafe('orders', 'idx_orders_status_date', 'status, order_date');
    await createIndexSafe('payments', 'idx_payments_status_method', 'payment_status, payment_method');

    console.log('\n=== AFTER CREATING INDEXES ===');
    const [after1] = await pool.query('EXPLAIN SELECT product_id, product_name, stock FROM products WHERE is_active = 1 AND stock <= 15');
    console.log('Query: Products low-stock search (AFTER)');
    console.table(after1);

    const [after2] = await pool.query("EXPLAIN SELECT * FROM orders WHERE status = 'Confirmed' AND order_date >= '2026-10-01'");
    console.log('Query: Orders status & date filter (AFTER)');
    console.table(after2);

  } catch (err) {
    console.error('Explain test error:', err);
  } finally {
    await pool.end();
  }
}

testExplain();
