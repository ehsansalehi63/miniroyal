-- Mini Royal: product management fields used by the admin panel and virtual try-on.
ALTER TABLE products ADD COLUMN IF NOT EXISTS features_json JSON NULL AFTER size_chart_json;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_material VARCHAR(255) NULL AFTER features_json;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wash_care TEXT NULL AFTER fabric_material;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_profile_json JSON NULL AFTER wash_care;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tryon_asset_json JSON NULL AFTER fit_profile_json;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by INT UNSIGNED NULL AFTER updated_at;

CREATE INDEX IF NOT EXISTS idx_products_category_status ON products (category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured, status, published_at);
