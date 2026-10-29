-- ============================================================================
-- Fashionista E-Commerce Management Database System
-- Capstone Project: Phase 2 Stored Procedures, Functions & Triggers
-- Team: Nikhil Kumar Singh (2501010151), Jitesh Kumar (2501010180)
-- Target Database: ecommerce_management_db (MySQL 8.0+)
-- ============================================================================

USE `ecommerce_management_db`;

-- ----------------------------------------------------------------------------
-- 1. STORED FUNCTION: fn_calculate_order_subtotal
-- Purpose: Aggregates order item prices and quantities from order_details
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_calculate_order_subtotal`;

DELIMITER $$
CREATE FUNCTION `fn_calculate_order_subtotal`(p_order_id INT)
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
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 2. STORED FUNCTION: fn_calculate_gst
-- Purpose: Calculates demonstration GST amount on an order subtotal.
-- Note: Configurable demonstration data for academic evaluation; not real tax advice.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_calculate_gst`;

DELIMITER $$
CREATE FUNCTION `fn_calculate_gst`(p_subtotal DECIMAL(10,2), p_tax_rate DECIMAL(5,2))
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
    
    -- Demonstrative calculation: Subtotal * (Tax Rate / 100)
    SET v_gst = ROUND(p_subtotal * (p_tax_rate / 100.0), 2);
    RETURN v_gst;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: sp_recalculate_order_total
-- Purpose: Recalculates and updates orders.total_amount using the subtotal function
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_recalculate_order_total`;

DELIMITER $$
CREATE PROCEDURE `sp_recalculate_order_total`(IN p_order_id INT)
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
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: sp_update_order_status
-- Purpose: Enforces valid state transitions and manages cancellation inventory
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_update_order_status`;

DELIMITER $$
CREATE PROCEDURE `sp_update_order_status`(
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

    -- Disallow updating already Delivered or Cancelled orders
    IF v_curr_status = 'Delivered' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify status of an already Delivered order.';
    END IF;

    IF v_curr_status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify status of an already Cancelled order.';
    END IF;

    -- If cancelling, restore inventory atomically
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
        
        -- Sync delivery status appropriately
        IF p_new_status = 'Shipped' THEN
            UPDATE deliveries SET delivery_status = 'Shipped' WHERE order_id = p_order_id;
        ELSEIF p_new_status = 'Delivered' THEN
            UPDATE deliveries SET delivery_status = 'Delivered', delivery_date = NOW() WHERE order_id = p_order_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------------------------
-- 5. TRIGGER: trg_validate_order_detail_before_insert
-- Purpose: Enforces product availability, positive quantity, active status and stock
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_validate_order_detail_before_insert`;

DELIMITER $$
CREATE TRIGGER `trg_validate_order_detail_before_insert`
BEFORE INSERT ON `order_details`
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    DECLARE v_active TINYINT;
    DECLARE v_count INT;

    -- 1. Validate positive quantity
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Quantity must be greater than zero.';
    END IF;

    -- 2. Validate non-negative unit price
    IF NEW.unit_price < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Unit price cannot be negative.';
    END IF;

    -- 3. Check product existence and active status
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

    -- 4. Check available stock
    IF NEW.quantity > v_stock THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Insufficient stock available for this product.';
    END IF;
END$$
DELIMITER ;
