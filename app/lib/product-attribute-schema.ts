import type { Pool, PoolConnection } from "mysql2/promise";

let schemaPromise: Promise<void> | null = null;

export function ensureProductAttributeTables(db: Pool | PoolConnection) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
      await db.execute(`CREATE TABLE IF NOT EXISTS category_attribute_definitions (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, category_id INT UNSIGNED NOT NULL, field_key VARCHAR(100) NOT NULL, label VARCHAR(150) NOT NULL, help_text TEXT NULL, input_type ENUM('text','textarea','number','select','multiselect','boolean') NOT NULL DEFAULT 'text', unit VARCHAR(30) NULL, options_json JSON NULL, is_required TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_category_attribute_key (category_id, field_key), INDEX idx_category_attribute_active (category_id, is_active, sort_order)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await db.execute(`CREATE TABLE IF NOT EXISTS product_attributes (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, definition_id INT UNSIGNED NULL, field_key VARCHAR(100) NOT NULL, label VARCHAR(150) NOT NULL, value_text TEXT NULL, value_json JSON NULL, unit VARCHAR(30) NULL, is_custom TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_product_attribute_key (product_id, field_key), INDEX idx_product_attributes_key (field_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await db.execute(`CREATE TABLE IF NOT EXISTS attribute_value_suggestions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, field_key VARCHAR(100) NOT NULL, label VARCHAR(150) NULL, normalized_value VARCHAR(255) NOT NULL, display_value VARCHAR(255) NOT NULL, usage_count INT UNSIGNED NOT NULL DEFAULT 1, last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_attribute_suggestion (field_key, normalized_value), INDEX idx_attribute_suggestion_search (field_key, display_value)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await db.execute(`CREATE TABLE IF NOT EXISTS application_logs (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, level ENUM('debug','info','warn','error') NOT NULL DEFAULT 'info', event VARCHAR(120) NOT NULL, route VARCHAR(255) NULL, method VARCHAR(12) NULL, status_code SMALLINT UNSIGNED NULL, message TEXT NULL, context_json JSON NULL, request_id VARCHAR(80) NULL, ip VARCHAR(64) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_application_logs_time (created_at), INDEX idx_application_logs_level (level, created_at), INDEX idx_application_logs_event (event, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      const templates = [
        ["material", "جنس پارچه", "نام دقیق جنس اصلی لباس؛ مانند نخ پنبه، دورس یا لینن.", "text", null, 1, 10, null],
        ["care", "روش شست‌وشو", "روش شست‌وشوی ایمن را کوتاه و قابل فهم بنویسید.", "textarea", null, 0, 20, null],
        ["season", "فصل استفاده", "فصل یا شرایط آب‌وهوایی مناسب استفاده را انتخاب کنید.", "select", null, 0, 30, JSON.stringify(["بهار", "تابستان", "پاییز", "زمستان", "چهارفصل"])],
        ["fit", "فرم و تن‌خور", "توضیح دهید لباس جذب، معمولی یا آزاد است.", "text", null, 0, 40, null],
      ];
      for (const template of templates) await db.execute("INSERT IGNORE INTO category_attribute_definitions (category_id, field_key, label, help_text, input_type, unit, is_required, sort_order, options_json) SELECT id, ?, ?, ?, ?, ?, ?, ?, ? FROM categories WHERE parent_id IS NULL", template);
      await db.execute("INSERT IGNORE INTO category_attribute_definitions (category_id, field_key, label, help_text, input_type, unit, is_required, sort_order) SELECT id, 'weight', 'وزن تقریبی لباس', 'وزن خود لباس بدون بسته‌بندی را وارد کنید.', 'number', 'گرم', 0, 50 FROM categories WHERE slug = 'nozad'");
      await db.execute("INSERT IGNORE INTO category_attribute_definitions (category_id, field_key, label, help_text, input_type, unit, is_required, sort_order) SELECT id, 'pieces', 'تعداد تکه‌های ست', 'تعداد لباس‌ها و اقلام داخل ست را وارد کنید.', 'number', 'تکه', 0, 50 FROM categories WHERE slug = 'set'");
      await db.execute("INSERT IGNORE INTO category_attribute_definitions (category_id, field_key, label, help_text, input_type, unit, is_required, sort_order) SELECT id, 'occasion', 'مناسبت استفاده', 'موقعیت مناسب پوشیدن لباس را مشخص کنید.', 'select', NULL, 0, 50 FROM categories WHERE slug IN ('majlesi', 'madreseh')");
    })().catch((error) => { schemaPromise = null; throw error; });
  }
  return schemaPromise;
}
