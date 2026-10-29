const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runSeed() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'seed.sql'), 'utf8');
    // Split on semicolon at end of line
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use '));

    console.log(`Found ${statements.length} statements to execute.`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt);
      } catch (err) {
        console.error(`Error in statement #${i + 1}:\n${stmt.substring(0, 100)}...\n`, err.message);
        throw err;
      }
    }

    console.log('All seed statements executed successfully!');

    const [products] = await pool.query('SELECT COUNT(*) as c FROM products');
    const [customers] = await pool.query('SELECT COUNT(*) as c FROM customers');
    const [orders] = await pool.query('SELECT COUNT(*) as c FROM orders');
    console.log(`Database state: ${products[0].c} products, ${customers[0].c} customers, ${orders[0].c} orders.`);
  } catch (err) {
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeed();
