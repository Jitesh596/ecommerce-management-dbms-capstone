const pool = require('./db');

async function runPhase2() {
  try {
    console.log('Deploying Phase 2 Procedures, Functions, and Triggers...');

    // 1. Function fn_calculate_order_subtotal
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
    console.log('✓ Created fn_calculate_order_subtotal');

    // 2. Function fn_calculate_gst
    await pool.query('DROP FUNCTION IF EXISTS fn_calculate_gst');
    await pool.query(`
      CREATE FUNCTION fn_calculate_gst(p_subtotal DECIMAL(10,2), p_tax_rate DECIMAL(5,2))
      RETURNS DECIMAL(10,2)
      DETERMINISTIC
      NO SQL
      BEGIN
          DECLARE v_gst DECIMAL(10,2);
          IF p_subtotal IS NULL OR p_subtotal < 0 THEN
              SET p_subtotal = 0.00;
          END IF;
          IF p_tax_rate IS NULL OR p_tax_rate < 0 THEN
              SET p_tax_rate = 0.00;
          END IF;
          SET v_gst = ROUND(p_subtotal * (p_tax_rate / 100.0), 2);
          RETURN v_gst;
      END
    `);
    console.log('✓ Created fn_calculate_gst');

    // 3. Procedure sp_recalculate_order_total
    await pool.query('DROP PROCEDURE IF EXISTS sp_recalculate_order_total');
    await pool.query(`
      CREATE PROCEDURE sp_recalculate_order_total(IN p_order_id INT)
      BEGIN
          DECLARE v_subtotal DECIMAL(10,2);
          DECLARE v_order_exists INT;

          SELECT COUNT(*) INTO v_order_exists FROM orders WHERE order_id = p_order_id;
          IF v_order_exists = 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Order not found for total recalculation.';
          END IF;

          SET v_subtotal = fn_calculate_order_subtotal(p_order_id);

          UPDATE orders
          SET total_amount = v_subtotal
          WHERE order_id = p_order_id;
      END
    `);
    console.log('✓ Created sp_recalculate_order_total');

    // 4. Procedure sp_update_order_status
    await pool.query('DROP PROCEDURE IF EXISTS sp_update_order_status');
    await pool.query(`
      CREATE PROCEDURE sp_update_order_status(
          IN p_order_id INT,
          IN p_new_status VARCHAR(20)
      )
      BEGIN
          DECLARE v_curr_status VARCHAR(20);
          DECLARE v_order_exists INT;

          SELECT COUNT(*) INTO v_order_exists FROM orders WHERE order_id = p_order_id;
          IF v_order_exists = 0 THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order does not exist.';
          END IF;

          SELECT status INTO v_curr_status FROM orders WHERE order_id = p_order_id;

          IF v_curr_status = 'Delivered' THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify status of an already Delivered order.';
          END IF;

          IF v_curr_status = 'Cancelled' THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify status of an already Cancelled order.';
          END IF;

          IF p_new_status = 'Cancelled' THEN
              UPDATE products p
              JOIN order_details od ON p.product_id = od.product_id
              SET p.stock = p.stock + od.quantity
              WHERE od.order_id = p_order_id;

              UPDATE orders SET status = 'Cancelled' WHERE order_id = p_order_id;
              UPDATE deliveries SET delivery_status = 'Cancelled' WHERE order_id = p_order_id;
              UPDATE payments SET payment_status = 'Refunded' WHERE order_id = p_order_id AND payment_status = 'Paid';
          ELSE
              UPDATE orders SET status = p_new_status WHERE order_id = p_order_id;
              
              IF p_new_status = 'Shipped' THEN
                  UPDATE deliveries SET delivery_status = 'Shipped' WHERE order_id = p_order_id;
              ELSEIF p_new_status = 'Delivered' THEN
                  UPDATE deliveries SET delivery_status = 'Delivered', delivery_date = NOW() WHERE order_id = p_order_id;
              END IF;
          END IF;
      END
    `);
    console.log('✓ Created sp_update_order_status');

    // 5. Trigger trg_validate_order_detail_before_insert
    await pool.query('DROP TRIGGER IF EXISTS trg_validate_order_detail_before_insert');
    await pool.query(`
      CREATE TRIGGER trg_validate_order_detail_before_insert
      BEFORE INSERT ON order_details
      FOR EACH ROW
      BEGIN
          DECLARE v_stock INT;
          DECLARE v_active TINYINT;
          DECLARE v_count INT;

          IF NEW.quantity <= 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Validation Error: Quantity must be greater than zero.';
          END IF;

          IF NEW.unit_price < 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Validation Error: Unit price cannot be negative.';
          END IF;

          SELECT COUNT(*), COALESCE(MAX(stock), 0), COALESCE(MAX(is_active), 0)
          INTO v_count, v_stock, v_active
          FROM products
          WHERE product_id = NEW.product_id;

          IF v_count = 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Validation Error: Referenced product does not exist.';
          END IF;

          IF v_active = 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Validation Error: Inactive products cannot be ordered.';
          END IF;

          IF NEW.quantity > v_stock THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Validation Error: Insufficient stock available for this product.';
          END IF;
      END
    `);
    console.log('✓ Created trg_validate_order_detail_before_insert');

    // Quick verification tests
    const [sub] = await pool.query('SELECT fn_calculate_order_subtotal(1) AS subtotal, fn_calculate_gst(fn_calculate_order_subtotal(1), 18.0) AS gst');
    console.log('Verification: Order 1 Subtotal =', sub[0].subtotal, '| GST (18% Demo) =', sub[0].gst);

    console.log('Phase 2 SQL objects successfully deployed and verified!');
  } catch (err) {
    console.error('Phase 2 deployment error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runPhase2();
