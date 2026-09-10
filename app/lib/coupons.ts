import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "./mysql";

export type Coupon = {
  id: number;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  timesUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  times_used: number;
  expires_at: Date | string | null;
  is_active: number;
  created_at: Date | string;
};

export async function ensureCouponsTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS coupons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
    discount_value INT UNSIGNED NOT NULL,
    min_order_amount INT UNSIGNED NOT NULL DEFAULT 0,
    max_discount INT UNSIGNED NULL,
    usage_limit INT UNSIGNED NULL,
    times_used INT UNSIGNED NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // اگر جدول تازه ایجاد شده باشد، کدهای پیش‌فرض را تزریق می‌کنیم
  try {
    const [countRows] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as cnt FROM coupons");
    if (Number(countRows[0]?.cnt || 0) === 0) {
      await pool.execute(`INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, is_active) VALUES
        ('MINI10', 'percent', 10, 200000, 1),
        ('ROYAL50', 'fixed', 50000, 400000, 1),
        ('WELCOME', 'percent', 15, 0, 1)`);
    }
  } catch {}
}

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderAmount: Number(row.min_order_amount),
    maxDiscount: row.max_discount ? Number(row.max_discount) : null,
    usageLimit: row.usage_limit ? Number(row.usage_limit) : null,
    timesUsed: Number(row.times_used || 0),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  try {
    await ensureCouponsTable();
    const [rows] = await pool.execute<CouponRow[]>("SELECT * FROM coupons ORDER BY id DESC");
    return rows.map(mapCoupon);
  } catch (err) {
    console.warn("listCoupons offline fallback:", err);
    return [
      { id: 1, code: "MINI10", discountType: "percent", discountValue: 10, minOrderAmount: 200000, maxDiscount: null, usageLimit: null, timesUsed: 14, expiresAt: null, isActive: true, createdAt: new Date().toISOString() },
      { id: 2, code: "ROYAL50", discountType: "fixed", discountValue: 50000, minOrderAmount: 400000, maxDiscount: null, usageLimit: null, timesUsed: 8, expiresAt: null, isActive: true, createdAt: new Date().toISOString() },
      { id: 3, code: "WELCOME", discountType: "percent", discountValue: 15, minOrderAmount: 0, maxDiscount: null, usageLimit: null, timesUsed: 32, expiresAt: null, isActive: true, createdAt: new Date().toISOString() },
    ];
  }
}

export async function createCoupon(input: {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
}): Promise<number> {
  await ensureCouponsTable();
  const code = input.code.trim().toUpperCase();
  const type = input.discountType === "fixed" ? "fixed" : "percent";
  const val = Math.max(1, Math.round(Number(input.discountValue)));
  const minOrder = Math.max(0, Math.round(Number(input.minOrderAmount || 0)));
  const maxDisc = input.maxDiscount ? Math.max(0, Math.round(Number(input.maxDiscount))) : null;
  const limit = input.usageLimit ? Math.max(1, Math.round(Number(input.usageLimit))) : null;
  const expiry = input.expiresAt ? new Date(input.expiresAt) : null;

  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [code, type, val, minOrder, maxDisc, limit, expiry]
  );
  return res.insertId;
}

export async function updateCouponStatus(id: number, isActive: boolean) {
  await ensureCouponsTable();
  await pool.execute("UPDATE coupons SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, id]);
}

export async function deleteCoupon(id: number) {
  await ensureCouponsTable();
  await pool.execute("DELETE FROM coupons WHERE id = ?", [id]);
}

export async function validateCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  message: string;
  coupon?: {
    id: number;
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    discountAmount: number;
    minOrderAmount: number;
  };
}> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: "لطفاً کد تخفیف را وارد کنید." };
  }

  let found: Coupon | null = null;
  try {
    await ensureCouponsTable();
    const [rows] = await pool.execute<CouponRow[]>(
      "SELECT * FROM coupons WHERE code = ? LIMIT 1",
      [cleanCode]
    );
    if (rows.length > 0) {
      found = mapCoupon(rows[0]);
    }
  } catch {
    // fallback to default mock list if DB query fails
    const fallbackList = await listCoupons();
    found = fallbackList.find((c) => c.code === cleanCode) || null;
  }

  if (!found) {
    return { valid: false, message: "کد تخفیف وارد شده نامعتبر است." };
  }

  if (!found.isActive) {
    return { valid: false, message: "این کد تخفیف در حال حاضر غیرفعال شده است." };
  }

  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." };
  }

  if (found.usageLimit && found.timesUsed >= found.usageLimit) {
    return { valid: false, message: "ظرفیت استفاده از این کد تخفیف تکمیل شده است." };
  }

  if (subtotal < found.minOrderAmount) {
    return {
      valid: false,
      message: `حداقل مبلغ خرید برای اعمال این کد ${new Intl.NumberFormat("fa-IR").format(found.minOrderAmount)} تومان است.`,
    };
  }

  let discountAmount = 0;
  if (found.discountType === "percent") {
    discountAmount = Math.round((subtotal * found.discountValue) / 100);
    if (found.maxDiscount && discountAmount > found.maxDiscount) {
      discountAmount = found.maxDiscount;
    }
  } else {
    discountAmount = Math.min(subtotal, found.discountValue);
  }

  return {
    valid: true,
    message: "کد تخفیف با موفقیت اعمال شد! 🎉",
    coupon: {
      id: found.id,
      code: found.code,
      discountType: found.discountType,
      discountValue: found.discountValue,
      discountAmount,
      minOrderAmount: found.minOrderAmount,
    },
  };
}

export async function incrementCouponUsage(code: string) {
  try {
    await pool.execute("UPDATE coupons SET times_used = times_used + 1 WHERE code = ?", [code.trim().toUpperCase()]);
  } catch {}
}
