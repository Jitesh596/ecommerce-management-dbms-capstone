const pool = require('./db');

async function testRoutines() {
  try {
    // Drop existing if any
    await pool.query('DROP FUNCTION IF EXISTS fn_calculate_order_subtotal');
    await pool.query(`
      CREATE FUNCTION fn_calculate_order_subtotal(p_order_id INT)
      RETURNS DECIMAL(10,2)
      DETERMINISTIC
      READS SQL DATA
      BEGIN
        DECLARE v_subtotal DECIMAL(10,2);
        SELECT COALESCE(SUM(quantity * unit_price), 0.00)
        INTO v_subtotal
        FROM order_details
        WHERE order_id = p_order_id;
        RETURN v_subtotal;
      END
    `);
    console.log('Function fn_calculate_order_subtotal created successfully!');

    // Test function
    const [res] = await pool.query('SELECT fn_calculate_order_subtotal(1) AS subtotal');
    console.log('Order 1 subtotal test:', res[0].subtotal);

  } catch (err) {
    console.error('Error creating/testing routine:', err.message);
  } finally {
    await pool.end();
  }
}

testRoutines();
