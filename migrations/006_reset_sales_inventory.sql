-- Mini Royal: reset demo sales and inventory data for production launch.
-- Confirmed scope: preserve products, customers, users, media, and settings.
-- This is intentionally destructive and should be run only after a database backup.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE inventory_movements;
TRUNCATE TABLE inventory_reservations;
TRUNCATE TABLE inventory_alerts;
TRUNCATE TABLE stock_count_items;
TRUNCATE TABLE stock_counts;
TRUNCATE TABLE inventory_lots;
TRUNCATE TABLE inventory_balances;

UPDATE product_variants SET stock = 0, updated_at = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;
