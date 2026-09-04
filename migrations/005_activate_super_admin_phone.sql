-- Mini Royal: activate the requested phone as the full admin-panel owner.
-- Run after migrations/003_admin_product_media_finance.sql so users.phone exists.
-- This migration is idempotent and does not alter any other user.

INSERT INTO users (username, email, phone, password_hash, full_name, role, is_active)
VALUES (
  '09133287984',
  '09133287984@miniroyal.local',
  '09133287984',
  'otp-only',
  'مدیر کل مینی رویال',
  'super_admin',
  1
)
ON DUPLICATE KEY UPDATE
  role = 'super_admin',
  is_active = 1,
  phone = '09133287984',
  full_name = IF(full_name IS NULL OR full_name = '', 'مدیر کل مینی رویال', full_name);
