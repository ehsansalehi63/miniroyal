import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";
import { validateMediaUrl } from "@/app/lib/media-validation";
import { replaceProductAttributes } from "@/app/lib/product-attributes";
import { ensureProductAttributeTables } from "@/app/lib/product-attribute-schema";

const allowedStatuses = ["draft", "review", "active", "archived"] as const;
const allowedGenders = ["boy", "girl", "unisex"] as const;
const allowedFitTypes = ["tight", "normal", "loose"] as const;

type ProductInput = {
  title: string; slug?: string; sku: string; shortDesc?: string; description?: string; categoryId: number; brandId?: number | null; supplierId?: number | null;
  gender?: (typeof allowedGenders)[number]; ageMinMonth?: number; ageMaxMonth?: number; basePrice: number; salePrice?: number | null; costPrice?: number | null;
  isFeatured?: boolean; isSpecialOffer?: boolean; status?: (typeof allowedStatuses)[number]; fitType?: (typeof allowedFitTypes)[number]; seoTitle?: string; seoDesc?: string;
  faqJson?: unknown; sizeChartJson?: unknown; features?: unknown; fabricMaterial?: string; washCare?: string; fitProfile?: unknown; tryOnAsset?: unknown;
  images?: Array<{ url: string; alt?: string; sortOrder?: number; isPrimary?: boolean; mediaType?: "image" | "video" }>;
  mediaAngles?: Array<{ angle: string; url: string; alt?: string; isAiOptimized?: boolean; isTryOnReady?: boolean; sortOrder?: number }>;
  attributes?: unknown;
  variants?: Array<{ sku: string; size: string; color: string; colorCode?: string; stock?: number; priceAdjustment?: number }>;
};

function jsonOrNull(value: unknown) { return value === undefined || value === null ? null : JSON.stringify(value); }
function parseJsonArray(value: unknown) { if (Array.isArray(value)) return value; if (typeof value !== "string") return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function slugify(value: string) { return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 240); }
function bad(message: string) { return NextResponse.json({ success: false, error: message }, { status: 400 }); }

function validate(input: ProductInput) {
  if (!input.title?.trim() || input.title.length > 255) return "عنوان محصول الزامی و حداکثر ۲۵۵ کاراکتر است.";
  if (!input.sku?.trim() || input.sku.length > 100) return "SKU محصول الزامی و حداکثر ۱۰۰ کاراکتر است.";
  if (!Number.isSafeInteger(input.categoryId) || input.categoryId < 1) return "دسته‌بندی محصول معتبر نیست.";
  if (!Number.isSafeInteger(input.basePrice) || input.basePrice < 0) return "قیمت پایه باید عدد صحیح تومان باشد.";
  if (input.salePrice !== undefined && input.salePrice !== null && (!Number.isSafeInteger(input.salePrice) || input.salePrice < 0)) return "قیمت فروش معتبر نیست.";
  if (input.ageMinMonth !== undefined && (!Number.isSafeInteger(input.ageMinMonth) || input.ageMinMonth < 0)) return "حداقل سن معتبر نیست.";
  if (input.ageMaxMonth !== undefined && (!Number.isSafeInteger(input.ageMaxMonth) || input.ageMaxMonth < 0)) return "حداکثر سن معتبر نیست.";
  if (input.status && !allowedStatuses.includes(input.status)) return "وضعیت محصول معتبر نیست.";
  if (input.gender && !allowedGenders.includes(input.gender)) return "جنسیت محصول معتبر نیست.";
  if (input.fitType && !allowedFitTypes.includes(input.fitType)) return "نوع فیت معتبر نیست.";
  for (const variant of (input.variants || []).filter((item) => item.sku?.trim() || item.size?.trim() || item.color?.trim())) {
    if (!variant.sku?.trim() || !variant.size?.trim() || !variant.color?.trim()) return "SKU، سایز و رنگ همهٔ variantها الزامی است.";
    if (!Number.isSafeInteger(variant.stock ?? 0) || (variant.stock ?? 0) < 0) return "موجودی variant معتبر نیست.";
  }
  for (const media of input.images || []) {
    const mediaError = validateMediaUrl(media.url);
    if (mediaError) return mediaError;
  }
  for (const media of input.mediaAngles || []) {
    const mediaError = validateMediaUrl(media.url);
    if (mediaError) return mediaError;
  }
  if (input.attributes !== undefined && !Array.isArray(input.attributes)) return "مشخصات محصول باید به‌صورت فهرست ارسال شوند.";
  return null;
}

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.read")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  await ensureProductAttributeTables(pool);
  const search = request.nextUrl.searchParams.get("search")?.trim() || "";
  const status = request.nextUrl.searchParams.get("status");
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 50), 1), 100);
  const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") || 0), 0);
  const params: (string | number)[] = [];
  const where: string[] = [];
  if (search) { where.push("(p.title LIKE ? OR p.sku LIKE ? OR p.slug LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status && allowedStatuses.includes(status as (typeof allowedStatuses)[number])) { where.push("p.status = ?"); params.push(status); }
  else if (request.nextUrl.searchParams.get("includeArchived") !== "1") where.push("p.status <> 'archived'");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT p.*, c.name AS categoryName,
      COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', v.id, 'sku', v.sku, 'size', v.size, 'color', v.color, 'colorCode', v.color_code, 'stock', v.stock, 'priceAdjustment', v.price_adjustment)) FROM product_variants v WHERE v.product_id = p.id), JSON_ARRAY()) AS variants,
      COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', m.id, 'url', m.url, 'alt', m.alt, 'sortOrder', m.sort_order, 'isPrimary', m.is_primary, 'mediaType', m.media_type)) FROM product_media m WHERE m.product_id = p.id), JSON_ARRAY()) AS images,
      COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'definitionId', a.definition_id, 'fieldKey', a.field_key, 'label', a.label, 'value', COALESCE(a.value_json, JSON_QUOTE(a.value_text)), 'unit', a.unit, 'isCustom', a.is_custom, 'sortOrder', a.sort_order)) FROM product_attributes a WHERE a.product_id = p.id), JSON_ARRAY()) AS attributes
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return NextResponse.json({ success: true, products: rows.map((row) => ({ ...row, variants: parseJsonArray(row.variants), images: parseJsonArray(row.images), attributes: parseJsonArray(row.attributes) })) });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی ایجاد محصول ندارید." }, { status: 403 });
  await ensureProductAttributeTables(pool);
  let input: ProductInput;
  try { input = await request.json() as ProductInput; } catch { return bad("بدنهٔ درخواست JSON معتبر نیست."); }
  const validationError = validate(input);
  if (validationError) return bad(validationError);
  const connection = await pool.getConnection();
  try {
    await connection.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    await connection.beginTransaction();
    const baseSlug = slugify(input.slug || input.title);
    let slug = baseSlug;
    const [sameSlug] = await connection.execute<RowDataPacket[]>("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
    if (sameSlug.length) {
      const skuSuffix = slugify(input.sku).slice(0, 50);
      slug = `${baseSlug}-${skuSuffix}`.slice(0, 255);
      let suffix = 2;
      while (true) {
        const [collision] = await connection.execute<RowDataPacket[]>("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
        if (!collision.length) break;
        slug = `${baseSlug}-${skuSuffix}-${suffix++}`.slice(0, 255);
      }
    }
    const [productResult] = await connection.execute<ResultSetHeader>(`INSERT INTO products
      (title, slug, sku, short_desc, description, category_id, brand_id, supplier_id, gender, age_min_month, age_max_month, base_price, sale_price, cost_price, is_featured, is_special_offer, status, fit_type, seo_title, seo_desc, faq_json, size_chart_json, features_json, fabric_material, wash_care, fit_profile_json, tryon_asset_json, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.title.trim(), slug, input.sku.trim(), input.shortDesc || null, input.description || null, input.categoryId, input.brandId ?? null, input.supplierId ?? null, input.gender || "unisex", input.ageMinMonth ?? 0, input.ageMaxMonth ?? 144, input.basePrice, input.salePrice ?? null, input.costPrice ?? null, input.isFeatured ? 1 : 0, input.isSpecialOffer ? 1 : 0, input.status || "draft", input.fitType || "normal", input.seoTitle || null, input.seoDesc || null, jsonOrNull(input.faqJson), jsonOrNull(input.sizeChartJson), jsonOrNull(input.features), input.fabricMaterial || null, input.washCare || null, jsonOrNull(input.fitProfile), jsonOrNull(input.tryOnAsset), admin.id,
    ]);
    const productId = productResult.insertId;
    for (const [index, variant] of (input.variants || []).filter((item) => item.sku?.trim() || item.size?.trim() || item.color?.trim()).entries()) await connection.execute("INSERT INTO product_variants (product_id, sku, size, color, color_code, stock, price_adjustment) VALUES (?, ?, ?, ?, ?, ?, ?)", [productId, variant.sku.trim(), variant.size.trim(), variant.color.trim(), variant.colorCode || null, variant.stock ?? 0, variant.priceAdjustment ?? 0]);
    for (const [index, media] of (input.images || []).entries()) await connection.execute("INSERT INTO product_media (product_id, url, alt, sort_order, is_primary, media_type) VALUES (?, ?, ?, ?, ?, ?)", [productId, media.url, media.alt || input.title, media.sortOrder ?? index, media.isPrimary ?? index === 0 ? 1 : 0, media.mediaType || "image"]);
    for (const [index, media] of (input.mediaAngles || []).entries()) await connection.execute("INSERT INTO product_media_angles (product_id, angle, url, alt, is_ai_optimized, is_tryon_ready, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [productId, media.angle, media.url, media.alt || input.title, media.isAiOptimized ? 1 : 0, media.isTryOnReady ? 1 : 0, media.sortOrder ?? index]);
    await replaceProductAttributes(connection, productId, input.attributes);
    await connection.commit();
    return NextResponse.json({ success: true, id: productId, slug }, { status: 201 });
  } catch (error) { await connection.rollback(); console.error("Admin product create failed:", error); if (error instanceof Error && /duplicate|unique/i.test(error.message) && /sku/i.test(error.message)) { const [existing] = await connection.execute<RowDataPacket[]>("SELECT id, title, slug, sku, status, category_id AS categoryId, base_price AS basePrice, sale_price AS salePrice FROM products WHERE sku = ? LIMIT 1", [input.sku.trim()]); return NextResponse.json({ success: false, error: "این کد محصول قبلاً ثبت شده است.", duplicate: existing[0] || null }, { status: 409 }); } const message = error instanceof Error && /duplicate|unique/i.test(error.message) ? "یکی از اطلاعات یکتا قبلاً ثبت شده است." : error instanceof Error && /collation|charset/i.test(error.message) ? "خطای هماهنگی زبان دیتابیس رخ داد؛ لطفاً دوباره تلاش کنید." : "ذخیرهٔ محصول انجام نشد."; return NextResponse.json({ success: false, error: message }, { status: 400 }); } finally { connection.release(); }
}
