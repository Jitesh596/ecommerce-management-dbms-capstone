# Fashionista — SQL Query Optimization & Indexing Analysis

## 1. Overview
In a relational e-commerce management system, analytical reports, high-volume checkout queries, and inventory tracking place intensive read demands on the database. This document presents empirical performance tuning and `EXPLAIN` query execution plan comparisons before and after strategic B-tree indexing on `ecommerce_management_db`.

---

## 2. Documented Indexes & Technical Justifications

| Table | Index Name | Columns | Index Type | Business / Technical Justification |
| :--- | :--- | :--- | :--- | :--- |
| `products` | `idx_products_stock_active` | `(is_active, stock)` | Composite B-Tree | Accelerates inventory health monitoring, low-stock alerts (`stock <= 15`), and storefront active item lookups by enabling index range scans rather than full table scans. |
| `orders` | `idx_orders_status_date` | `(status, order_date)` | Composite B-Tree | Optimizes monthly sales aggregations (`WHERE status != 'Cancelled' AND order_date >= ...`) and admin status queries, reducing filtered overhead from 20% to 100%. |
| `payments`| `idx_payments_status_method` | `(payment_status, payment_method)` | Composite B-Tree | Speeds up financial reconciliation grouping by payment method and payment settlement status. |
| `order_details` | `uq_order_product` | `(order_id, product_id)` | Unique B-Tree | Prevents duplicate product rows per order and provides high-speed foreign key join lookups. |

---

## 3. Empirical EXPLAIN Plan Demonstrations

### Demonstration 1: Low-Stock Products Query (Report 5)
```sql
EXPLAIN SELECT product_id, product_name, stock 
FROM products 
WHERE is_active = 1 AND stock <= 15;
```

#### Execution Plan: BEFORE Creating Index
```
+----+-------------+----------+------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table    | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+----------+------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | products | NULL       | ALL  | NULL          | NULL | NULL    | NULL |   55 |     3.33 | Using where |
+----+-------------+----------+------------+------+---------------+------+---------+------+------+----------+-------------+
```
- **Access Type:** `ALL` (Full Table Scan across all 55 catalogue rows).
- **Key Used:** `NULL` (No index was eligible).
- **Rows Examined:** 55 rows read sequentially into memory.
- **Filtered Ratio:** Only 3.33% estimated to match.

#### Execution Plan: AFTER Creating `idx_products_stock_active`
```
+----+-------------+----------+------------+-------+----------------------------+----------------------------+---------+------+------+----------+-----------------------+
| id | select_type | table    | partitions | type  | possible_keys              | key                        | key_len | ref  | rows | filtered | Extra                 |
+----+-------------+----------+------------+-------+----------------------------+----------------------------+---------+------+------+----------+-----------------------+
|  1 | SIMPLE      | products | NULL       | range | idx_products_stock_active  | idx_products_stock_active  | 6       | NULL |   12 |   100.00 | Using index condition |
+----+-------------+----------+------------+-------+----------------------------+----------------------------+---------+------+------+----------+-----------------------+
```
- **Access Type:** Upgraded from `ALL` to `range` scan.
- **Key Used:** `idx_products_stock_active` (B-Tree).
- **Rows Examined:** Only 12 candidate index entries traversed instead of 55 table rows.
- **Filtered Ratio:** Improved to 100.00%.
- **Extra:** `Using index condition` (Index Condition Pushdown - ICP), minimizing storage engine I/O overhead.

---

### Demonstration 2: Order Filtering by Status and Date Range
```sql
EXPLAIN SELECT * 
FROM orders 
WHERE status = 'Confirmed' AND order_date >= '2026-10-01';
```

#### Execution Plan: BEFORE Composite Index (Only Single-Column `idx_orders_date` Existed)
```
+----+-------------+--------+------------+-------+-------------------+-------------------+---------+------+------+----------+------------------------------------+
| id | select_type | table  | partitions | type  | possible_keys     | key               | key_len | ref  | rows | filtered | Extra                              |
+----+-------------+--------+------------+-------+-------------------+-------------------+---------+------+------+----------+------------------------------------+
|  1 | SIMPLE      | orders | NULL       | range | idx_orders_date   | idx_orders_date   | 6       | NULL |    5 |    20.00 | Using index condition; Using where |
+----+-------------+--------+------------+-------+-------------------+-------------------+---------+------+------+----------+------------------------------------+
```
- **Rows Filtered:** Only 20.00% because MySQL evaluated `order_date` first and had to perform secondary post-filtering for `status = 'Confirmed'`.

#### Execution Plan: AFTER Adding Composite Index `idx_orders_status_date`
```
+----+-------------+--------+------------+-------+------------------------------------------+-----------------------+---------+------+------+----------+-----------------------+
| id | select_type | table  | partitions | type  | possible_keys                            | key                   | key_len | ref  | rows | filtered | Extra                 |
+----+-------------+--------+------------+-------+------------------------------------------+-----------------------+---------+------+------+----------+-----------------------+
|  1 | SIMPLE      | orders | NULL       | range | idx_orders_date,idx_orders_status_date   | idx_orders_status_date| 8       | NULL |    2 |   100.00 | Using index condition |
+----+-------------+--------+------------+-------+------------------------------------------+-----------------------+---------+------+------+----------+-----------------------+
```
- **Key Used:** Chosen composite index `idx_orders_status_date`.
- **Rows Examined:** Reduced to 2 targeted rows.
- **Filtered Ratio:** Increased from 20.00% to 100.00%, achieving optimal query selectivity.

---

## 4. Benchmark Conclusion
Strategic index design in `ecommerce_management_db` successfully eliminated full table scans, reduced examined row counts by up to 78%, and maximized engine-level filter selectivity (100%).
