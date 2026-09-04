-- Mini Royal: Postex shipment identifiers and live tracking metadata.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postex_parcel_no VARCHAR(100) NULL AFTER tracking_code;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postex_order_no VARCHAR(100) NULL AFTER postex_parcel_no;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(100) NULL AFTER postex_order_no;
CREATE INDEX IF NOT EXISTS idx_orders_postex_parcel ON orders (postex_parcel_no);
