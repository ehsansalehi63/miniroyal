-- Migration 002: Advanced inventory for MiniRoyal
-- MySQL 8.0+ / MariaDB 10.6+, all monetary values are Toman.

CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `province` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `warehouse_bins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(150) NULL,
  `zone` VARCHAR(80) NULL,
  `capacity_units` INT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_bin_warehouse_code` (`warehouse_id`, `code`),
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_balances` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `bin_id` INT UNSIGNED NULL,
  `variant_id` INT UNSIGNED NOT NULL,
  `on_hand` INT NOT NULL DEFAULT 0,
  `reserved` INT UNSIGNED NOT NULL DEFAULT 0,
  `damaged` INT UNSIGNED NOT NULL DEFAULT 0,
  `available` INT AS (GREATEST(`on_hand` - `reserved` - `damaged`, 0)) STORED,
  `reorder_point` INT UNSIGNED NOT NULL DEFAULT 0,
  `reorder_quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_inventory_balance` (`warehouse_id`, `bin_id`, `variant_id`),
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bin_id`) REFERENCES `warehouse_bins` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  INDEX `idx_inventory_available` (`variant_id`, `available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_lots` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT UNSIGNED NOT NULL,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `bin_id` INT UNSIGNED NULL,
  `lot_number` VARCHAR(100) NOT NULL,
  `supplier_id` INT UNSIGNED NULL,
  `unit_cost` INT UNSIGNED NULL,
  `quantity_received` INT UNSIGNED NOT NULL DEFAULT 0,
  `quantity_remaining` INT UNSIGNED NOT NULL DEFAULT 0,
  `manufactured_at` DATE NULL,
  `received_at` DATE NULL,
  `expires_at` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_inventory_lot` (`warehouse_id`, `lot_number`, `variant_id`),
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bin_id`) REFERENCES `warehouse_bins` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT UNSIGNED NOT NULL,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `bin_id` INT UNSIGNED NULL,
  `lot_id` BIGINT UNSIGNED NULL,
  `movement_type` ENUM('receive','sale','reserve','release','transfer_in','transfer_out','adjustment','damage','return') NOT NULL,
  `quantity` INT NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` VARCHAR(100) NULL,
  `unit_cost` INT UNSIGNED NULL,
  `note` VARCHAR(500) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`bin_id`) REFERENCES `warehouse_bins` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`lot_id`) REFERENCES `inventory_lots` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_inventory_movements_variant_time` (`variant_id`, `created_at`),
  INDEX `idx_inventory_movements_reference` (`reference_type`, `reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_reservations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT UNSIGNED NOT NULL,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `order_id` INT UNSIGNED NULL,
  `session_key` VARCHAR(120) NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `status` ENUM('active','converted','released','expired') NOT NULL DEFAULT 'active',
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `released_at` TIMESTAMP NULL,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  INDEX `idx_reservation_expiry` (`status`, `expires_at`),
  INDEX `idx_reservation_variant` (`variant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_counts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `status` ENUM('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  `counted_by` INT UNSIGNED NULL,
  `notes` TEXT NULL,
  `started_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`counted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_count_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `stock_count_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` INT UNSIGNED NOT NULL,
  `expected_quantity` INT NOT NULL DEFAULT 0,
  `counted_quantity` INT NULL,
  `difference_quantity` INT AS (COALESCE(`counted_quantity`, 0) - `expected_quantity`) STORED,
  `note` VARCHAR(500) NULL,
  FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_stock_count_variant` (`stock_count_id`, `variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_alerts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT UNSIGNED NOT NULL,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `alert_type` ENUM('low_stock','out_of_stock','overstock','expiring_lot') NOT NULL,
  `status` ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
  `current_quantity` INT NOT NULL DEFAULT 0,
  `threshold_quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  INDEX `idx_inventory_alert_status` (`status`, `alert_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `warehouses` (`name`, `code`, `is_default`)
SELECT 'انبار مرکزی مینی رویال', 'MAIN', 1
WHERE NOT EXISTS (SELECT 1 FROM `warehouses` WHERE `code` = 'MAIN');

-- Product variants.stock remains as a backward-compatible aggregate cache.
-- New inventory flows must write movements/reservations and update balances transactionally.
UPDATE `product_variants` pv
JOIN (SELECT variant_id, SUM(on_hand) AS total_on_hand FROM inventory_balances GROUP BY variant_id) b
  ON b.variant_id = pv.id
SET pv.stock = GREATEST(b.total_on_hand, 0);
