-- Mini Royal: reset demo sales and inventory data for production launch.
-- Confirmed scope: preserve products, customers, users, media, and settings.
-- This is intentionally destructive and should be run only after a database backup.

-- The current production database contains only the baseline sales tables.
-- The advanced inventory migration (002) has not been installed there, so
-- do not reference its optional tables.
DELETE FROM order_items;
DELETE FROM orders;

UPDATE product_variants SET stock = 0, updated_at = CURRENT_TIMESTAMP;
