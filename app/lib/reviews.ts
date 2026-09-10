import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "./mysql";

export type Review = {
  id: number;
  productId: number;
  productTitle: string;
  customerId: number | null;
  authorName: string;
  rating: number;
  comment: string;
  sizeFit: "small" | "perfect" | "large";
  isVerifiedBuyer: boolean;
  isApproved: boolean;
  adminReply: string | null;
  createdAt: string;
};

type ReviewRow = RowDataPacket & {
  id: number;
  product_id: number;
  product_title?: string;
  customer_id: number | null;
  author_name: string;
  rating: number;
  comment: string;
  size_fit: "small" | "perfect" | "large";
  is_verified_buyer: number;
  is_approved: number;
  admin_reply: string | null;
  created_at: Date | string;
};

export async function ensureReviewsTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NULL,
    author_name VARCHAR(100) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
    comment TEXT NOT NULL,
    size_fit ENUM('small', 'perfect', 'large') NOT NULL DEFAULT 'perfect',
    is_verified_buyer TINYINT(1) NOT NULL DEFAULT 0,
    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    admin_reply TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_approved (is_approved)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // اگر دیدگاهی در دیتابیس نباشد، چند نظر پیش‌فرض برای تست اضافه می‌کنیم
  try {
    const [countRows] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as cnt FROM reviews");
    if (Number(countRows[0]?.cnt || 0) === 0) {
      await pool.execute(`INSERT IGNORE INTO reviews (product_id, author_name, rating, comment, size_fit, is_verified_buyer, is_approved) VALUES
        (1, 'زهرا محمدی', 5, 'کیفیت دوخت و لطافت پارچه عالیه، دقیقاً اندازه تن دخترم شد.', 'perfect', 1, 1),
        (2, 'مهدی کاظمی', 4, 'رنگش دقیقاً مثل عکس بود، فقط آستینش کمی بلند بود که مشکلی نیست.', 'large', 1, 1),
        (3, 'سارا رضایی', 5, 'خیلی شیک و راحته، بسته‌بندی تمیز و ارسال سریع بود.', 'perfect', 1, 0)`);
    }
  } catch {}
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title || `محصول کد #${row.product_id}`,
    customerId: row.customer_id,
    authorName: row.author_name,
    rating: Number(row.rating),
    comment: row.comment,
    sizeFit: row.size_fit || "perfect",
    isVerifiedBuyer: Boolean(row.is_verified_buyer),
    isApproved: Boolean(row.is_approved),
    adminReply: row.admin_reply || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function listAdminReviews(): Promise<Review[]> {
  try {
    await ensureReviewsTable();
    const [rows] = await pool.execute<ReviewRow[]>(`
      SELECT r.*, p.title as product_title
      FROM reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.id DESC
    `);
    return rows.map(mapReview);
  } catch (err) {
    console.warn("listAdminReviews offline fallback:", err);
    return [
      {
        id: 1,
        productId: 1,
        productTitle: "تیشرت نخ‌پنبه پسرانه طرح خرس رویال",
        customerId: null,
        authorName: "زهرا محمدی",
        rating: 5,
        comment: "جنس پارچه‌اش عالیه، دخترم هم عاشق طرحشه. سایز ۴-۵ سال دقیقاً اندازه بود.",
        sizeFit: "perfect",
        isVerifiedBuyer: true,
        isApproved: true,
        adminReply: "مبارکتون باشه همراه عزیز مینی‌رویال 🌸",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        productId: 2,
        productTitle: "پیراهن دخترانه گل‌دار بهاری مینی رز",
        customerId: null,
        authorName: "سارا حسینی",
        rating: 5,
        comment: "بسیار پیراهن نازیه! دخترم ۳ سالشه تنش عالی نشست.",
        sizeFit: "perfect",
        isVerifiedBuyer: true,
        isApproved: true,
        adminReply: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        productId: 3,
        productTitle: "شلوار کتان اسپرت پسرانه کمر کشی",
        customerId: null,
        authorName: "علی نوری",
        rating: 4,
        comment: "کیفیت کتان خوب بود و دوخت محکمی داشت.",
        sizeFit: "small",
        isVerifiedBuyer: true,
        isApproved: false,
        adminReply: null,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function updateReview(
  id: number,
  patch: { isApproved?: boolean; adminReply?: string | null }
) {
  await ensureReviewsTable();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (typeof patch.isApproved === "boolean") {
    fields.push("is_approved = ?");
    values.push(patch.isApproved ? 1 : 0);
  }
  if (patch.adminReply !== undefined) {
    fields.push("admin_reply = ?");
    values.push(patch.adminReply ? patch.adminReply.trim() : null);
  }

  if (!fields.length) return;
  values.push(id);
  await pool.execute(`UPDATE reviews SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteReview(id: number) {
  await ensureReviewsTable();
  await pool.execute("DELETE FROM reviews WHERE id = ?", [id]);
}

export async function getProductApprovedReviews(productId: number): Promise<Review[]> {
  try {
    await ensureReviewsTable();
    const [rows] = await pool.execute<ReviewRow[]>(
      `SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY id DESC`,
      [productId]
    );
    return rows.map(mapReview);
  } catch {
    return [];
  }
}

export async function submitCustomerReview(input: {
  productId: number;
  authorName: string;
  rating: number;
  comment: string;
  sizeFit?: "small" | "perfect" | "large";
  customerId?: number | null;
}) {
  await ensureReviewsTable();
  const rating = Math.max(1, Math.min(5, Math.round(input.rating || 5)));
  const sizeFit = input.sizeFit || "perfect";
  const author = input.authorName.trim() || "کاربر مینی‌رویال";
  const comment = input.comment.trim();

  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO reviews (product_id, customer_id, author_name, rating, comment, size_fit, is_approved)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [input.productId, input.customerId || null, author, rating, comment, sizeFit]
  );
  return res.insertId;
}
