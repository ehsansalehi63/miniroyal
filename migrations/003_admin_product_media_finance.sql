-- Mini Royal: admin RBAC, product media angles, and sales finance foundation

CREATE TABLE IF NOT EXISTS admin_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  permission_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role ENUM('super_admin','admin','operator','editor') NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role, permission_id),
  FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO admin_permissions (permission_key, title) VALUES
 ('products.read','مشاهده محصولات'),
 ('products.write','ایجاد و ویرایش محصولات'),
 ('products.publish','انتشار محصول'),
 ('inventory.read','مشاهده انبار'),
 ('inventory.write','ورود، خروج و شمارش انبار'),
 ('orders.read','مشاهده سفارش‌ها'),
 ('orders.write','تغییر وضعیت سفارش'),
 ('finance.read','مشاهده گزارش مالی'),
 ('finance.write','ثبت هزینه و اصلاح مالی'),
 ('admins.manage','مدیریت ادمین‌ها و دسترسی‌ها'),
 ('settings.manage','مدیریت تنظیمات سایت');

CREATE TABLE IF NOT EXISTS product_media_angles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  angle ENUM('front','back','left','right','detail','on_model','size_label','packaging') NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt VARCHAR(255) NULL,
  is_ai_optimized TINYINT(1) NOT NULL DEFAULT 0,
  is_tryon_ready TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_angle (product_id, angle),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_content_ai_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  requested_by INT UNSIGNED NULL,
  status ENUM('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
  input_json JSON NOT NULL,
  output_json JSON NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_ai_jobs_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  account_type ENUM('asset','liability','income','expense','equity') NOT NULL,
  parent_id INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES finance_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_journals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_type ENUM('order','refund','expense','stock_receipt','manual') NOT NULL,
  reference_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_finance_journals_reference (reference_type, reference_id),
  INDEX idx_finance_journals_posted (posted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  journal_id BIGINT UNSIGNED NOT NULL,
  account_id INT UNSIGNED NOT NULL,
  debit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  credit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  memo VARCHAR(255) NULL,
  FOREIGN KEY (journal_id) REFERENCES finance_journals(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  INDEX idx_finance_entries_journal (journal_id),
  INDEX idx_finance_entries_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO finance_accounts (code, title, account_type) VALUES
 ('1100','بانک و درگاه پرداخت','asset'),
 ('1200','موجودی کالا','asset'),
 ('2100','بستانکاران و بازپرداخت‌ها','liability'),
 ('4100','فروش پوشاک و اکسسوری','income'),
 ('5100','بهای تمام‌شده کالای فروش‌رفته','expense'),
 ('5200','هزینه ارسال و بسته‌بندی','expense'),
 ('5300','هزینه بازاریابی و پیامک','expense');
