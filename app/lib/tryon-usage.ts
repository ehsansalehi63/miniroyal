import pool from "./mysql";
import { currentCustomer } from "./customer-auth";

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_DAYS = 30;

async function ensureTryonUsageSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tryon_usage (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tryon_usage_customer_date (customer_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function isAdmin(customer: { role?: string; phone?: string }) {
  if (customer.role === "admin" || customer.role === "super_admin") return true;
  const phones = (process.env.TRYON_ADMIN_PHONES || "").split(",").map((phone) => phone.replace(/\D/g, "")).filter(Boolean);
  return Boolean(customer.phone && phones.includes(customer.phone.replace(/\D/g, "")));
}

export async function authorizeTryon(productId?: number) {
  const customer = await currentCustomer();
  if (!customer) return { ok: false as const, status: 401, error: "برای استفاده از پرو آنلاین ابتدا وارد حساب مشتری شوید." };
  if (isAdmin(customer)) return { ok: true as const, customer, unlimited: true, remaining: null };

  await ensureTryonUsageSchema();
  const limit = Math.max(1, Number(process.env.TRYON_FREE_LIMIT) || DEFAULT_LIMIT);
  const windowDays = Math.max(1, Number(process.env.TRYON_LIMIT_WINDOW_DAYS) || DEFAULT_WINDOW_DAYS);
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS used FROM tryon_usage WHERE customer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
    [customer.id, windowDays]
  ) as unknown as [Array<{ used: number }>];
  const used = Number(rows[0]?.used || 0);
  if (used >= limit) {
    return {
      ok: false as const,
      status: 429,
      error: `سهمیه پرو آنلاین شما تکمیل شده است. سهمیه هر ${windowDays} روز ${limit} بار است.`,
      remaining: 0,
    };
  }
  await pool.execute("INSERT INTO tryon_usage (customer_id, product_id) VALUES (?, ?)", [customer.id, productId || null]);
  return { ok: true as const, customer, unlimited: false, remaining: limit - used - 1 };
}
