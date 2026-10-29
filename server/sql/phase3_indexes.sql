-- ============================================================================
-- Fashionista E-Commerce Management Database System
-- Capstone Project: Phase 3 Index Optimization Script
-- Target Database: ecommerce_management_db (MySQL 8.0+)
-- ============================================================================

USE `ecommerce_management_db`;

-- Drop existing optimization indexes if need to cleanly recreate
DROP INDEX IF EXISTS `idx_products_stock_active` ON `products`;
DROP INDEX IF EXISTS `idx_orders_status_date` ON `orders`;
DROP INDEX IF EXISTS `idx_payments_status_method` ON `payments`;

-- 1. Index on Products (is_active, stock)
-- Justification: Optimizes catalogue stock filtering, low-stock threshold alerts (stock <= 15),
-- and ensures range scanning rather than full table scans (type ALL -> range).
CREATE INDEX `idx_products_stock_active` ON `products` (`is_active`, `stock`);

-- 2. Composite Index on Orders (status, order_date)
-- Justification: Optimizes admin status dashboard filters, monthly sales aggregation excluding 'Cancelled'
-- orders, and date range sales queries.
CREATE INDEX `idx_orders_status_date` ON `orders` (`status`, `order_date`);

-- 3. Composite Index on Payments (payment_status, payment_method)
-- Justification: Optimizes payment audit queries, financial settlement grouping by payment method,
-- and reconciliation reports.
CREATE INDEX `idx_payments_status_method` ON `payments` (`payment_status`, `payment_method`);
