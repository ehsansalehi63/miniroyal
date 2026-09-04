-- Mini Royal: reset demo sales and inventory data for production launch.
-- Confirmed scope: preserve products, customers, users, media, and settings.
-- This is intentionally destructive and should be run only after a database backup.

-- Use DELETE rather than TRUNCATE: phpMyAdmin may execute statements in
-- separate sessions, while TRUNCATE is rejected when foreign keys reference
-- the table even if the child table is empty.
DELETE FROM order_items;
DELETE FROM inventory_reservations;
DELETE FROM orders;
DELETE FROM inventory_movements;
DELETE FROM inventory_alerts;
DELETE FROM stock_count_items;
DELETE FROM stock_counts;
DELETE FROM inventory_lots;
DELETE FROM inventory_balances;

UPDATE product_variants SET stock = 0, updated_at = CURRENT_TIMESTAMP;
