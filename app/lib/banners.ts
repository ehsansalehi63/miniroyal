import type { RowDataPacket } from "mysql2";
import pool from "./mysql";

export type BannerPlacement = "home_hero" | "home_after_categories" | "home_before_footer" | "shop_top" | "category_top" | "product_top";
export type Banner = { id: number; title: string; subtitle: string; imageUrl: string; mobileImageUrl?: string; linkUrl: string; placement: BannerPlacement; isActive: boolean; sortOrder: number; startsAt?: string | null; endsAt?: string | null };

type BannerRow = RowDataPacket & { id: number; title: string; subtitle: string | null; image_url: string; mobile_image_url: string | null; link_url: string | null; placement: BannerPlacement; is_active: number; sort_order: number; starts_at: Date | string | null; ends_at: Date | string | null };

export async function ensureBannerTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS site_banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) NULL,
    image_url VARCHAR(500) NOT NULL,
    mobile_image_url VARCHAR(500) NULL,
    link_url VARCHAR(500) NULL,
    placement VARCHAR(40) NOT NULL DEFAULT 'home_after_categories',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    starts_at DATETIME NULL,
    ends_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_banners_placement (placement, is_active, sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

function mapBanner(row: BannerRow): Banner {
  return { id: row.id, title: row.title, subtitle: row.subtitle || "", imageUrl: row.image_url, mobileImageUrl: row.mobile_image_url || undefined, linkUrl: row.link_url || "", placement: row.placement, isActive: Boolean(row.is_active), sortOrder: row.sort_order, startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null, endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null };
}

export async function getBanners(onlyActive = false, placement?: BannerPlacement) {
  try {
    await ensureBannerTable();
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (onlyActive) { where.push("is_active = 1", "(starts_at IS NULL OR starts_at <= NOW())", "(ends_at IS NULL OR ends_at >= NOW())"); }
    if (placement) { where.push("placement = ?"); params.push(placement); }
    const [rows] = await pool.execute<BannerRow[]>(`SELECT * FROM site_banners ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY sort_order, id`, params);
    return rows.map(mapBanner);
  } catch { return [] as Banner[]; }
}

export async function getActiveBanners(placement?: BannerPlacement) { return getBanners(true, placement); }
