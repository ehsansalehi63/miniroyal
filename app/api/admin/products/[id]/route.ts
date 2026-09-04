import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";

type Context = { params: Promise<{ id: string }> };
const allowedStatuses = ["draft", "review", "active", "archived"];
const allowedGenders = ["boy", "girl", "unisex"];
const allowedFitTypes = ["tight", "normal", "loose"];

function jsonOrNull(value: unknown) { return value === undefined || value === null ? null : JSON.stringify(value); }
function parseId(value: string) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }

async function getId(context: Context) { return parseId((await context.params).id); }

export async function GET(_request: NextRequest, context: Context) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.read")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  const id = await getId(context); if (!id) return NextResponse.json({ success: false, error: "شناسهٔ محصول معتبر نیست." }, { status: 400 });
  const [products] = await pool.execute<RowDataPacket[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
  if (!products[0]) return NextResponse.json({ success: false, error: "محصول پیدا نشد." }, { status: 404 });
  const [variants] = await pool.execute<RowDataPacket[]>("SELECT id, product_id AS productId, sku, size, color, color_code AS colorCode, stock, price_adjustment AS priceAdjustment FROM product_variants WHERE product_id = ? ORDER BY id", [id]);
  const [images] = await pool.execute<RowDataPacket[]>("SELECT id, url, alt, sort_order AS sortOrder, is_primary AS isPrimary, media_type AS mediaType FROM product_media WHERE product_id = ? ORDER BY sort_order, id", [id]);
  const [angles] = await pool.execute<RowDataPacket[]>("SELECT id, angle, url, alt, is_ai_optimized AS isAiOptimized, is_tryon_ready AS isTryOnReady, sort_order AS sortOrder FROM product_media_angles WHERE product_id = ? ORDER BY sort_order, id", [id]);
  return NextResponse.json({ success: true, product: { ...products[0], variants, images, mediaAngles: angles } });
}

export async function PATCH(request: NextRequest, context: Context) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی ویرایش محصول ندارید." }, { status: 403 });
  const id = await getId(context); if (!id) return NextResponse.json({ success: false, error: "شناسهٔ محصول معتبر نیست." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ success: false, error: "بدنهٔ درخواست JSON معتبر نیست." }, { status: 400 }); }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const fields: Array<[string, unknown]> = [];
    const map: Record<string, string> = { title: "title", slug: "slug", sku: "sku", shortDesc: "short_desc", description: "description", categoryId: "category_id", brandId: "brand_id", supplierId: "supplier_id", gender: "gender", ageMinMonth: "age_min_month", ageMaxMonth: "age_max_month", basePrice: "base_price", salePrice: "sale_price", costPrice: "cost_price", isFeatured: "is_featured", isSpecialOffer: "is_special_offer", status: "status", fitType: "fit_type", seoTitle: "seo_title", seoDesc: "seo_desc", fabricMaterial: "fabric_material", washCare: "wash_care" };
    for (const [key, column] of Object.entries(map)) if (body[key] !== undefined) fields.push([column, typeof body[key] === "boolean" ? (body[key] ? 1 : 0) : body[key]]);
    for (const [key, column] of [["faqJson", "faq_json"], ["sizeChartJson", "size_chart_json"], ["features", "features_json"], ["fitProfile", "fit_profile_json"], ["tryOnAsset", "tryon_asset_json"]] as const) if (body[key] !== undefined) fields.push([column, jsonOrNull(body[key])]);
    if (body.status && !allowedStatuses.includes(String(body.status))) return NextResponse.json({ success: false, error: "وضعیت محصول معتبر نیست." }, { status: 400 });
    if (body.gender && !allowedGenders.includes(String(body.gender))) return NextResponse.json({ success: false, error: "جنسیت محصول معتبر نیست." }, { status: 400 });
    if (body.fitType && !allowedFitTypes.includes(String(body.fitType))) return NextResponse.json({ success: false, error: "نوع فیت معتبر نیست." }, { status: 400 });
    fields.push(["updated_by", admin.id]);
    if (fields.length) await connection.execute<ResultSetHeader>(`UPDATE products SET ${fields.map(([column]) => `\`${column}\` = ?`).join(", ")} WHERE id = ?`, [...fields.map(([, value]) => value), id] as Array<string | number | null>);
    if (Array.isArray(body.variants)) {
      await connection.execute("DELETE FROM product_variants WHERE product_id = ?", [id]);
      for (const variant of body.variants as Array<Record<string, unknown>>) await connection.execute("INSERT INTO product_variants (product_id, sku, size, color, color_code, stock, price_adjustment) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, String(variant.sku || "").trim(), String(variant.size || "").trim(), String(variant.color || "").trim(), variant.colorCode ? String(variant.colorCode) : null, Number(variant.stock || 0), Number(variant.priceAdjustment || 0)] as Array<string | number | null>);
    }
    if (Array.isArray(body.images)) {
      await connection.execute("DELETE FROM product_media WHERE product_id = ?", [id]);
      for (const [index, media] of (body.images as Array<Record<string, unknown>>).entries()) await connection.execute("INSERT INTO product_media (product_id, url, alt, sort_order, is_primary, media_type) VALUES (?, ?, ?, ?, ?, ?)", [id, String(media.url), media.alt ? String(media.alt) : null, Number(media.sortOrder ?? index), media.isPrimary ? 1 : index === 0 ? 1 : 0, media.mediaType === "video" ? "video" : "image"] as Array<string | number | null>);
    }
    if (Array.isArray(body.mediaAngles)) {
      await connection.execute("DELETE FROM product_media_angles WHERE product_id = ?", [id]);
      for (const [index, media] of (body.mediaAngles as Array<Record<string, unknown>>).entries()) await connection.execute("INSERT INTO product_media_angles (product_id, angle, url, alt, is_ai_optimized, is_tryon_ready, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, String(media.angle), String(media.url), media.alt ? String(media.alt) : null, media.isAiOptimized ? 1 : 0, media.isTryOnReady ? 1 : 0, Number(media.sortOrder ?? index)] as Array<string | number | null>);
    }
    await connection.commit();
    return NextResponse.json({ success: true, id });
  } catch (error) { await connection.rollback(); const message = error instanceof Error && /duplicate|unique/i.test(error.message) ? "SKU یا slug تکراری است." : "ویرایش محصول انجام نشد."; return NextResponse.json({ success: false, error: message }, { status: 400 }); } finally { connection.release(); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی حذف محصول ندارید." }, { status: 403 });
  const id = await getId(context); if (!id) return NextResponse.json({ success: false, error: "شناسهٔ محصول معتبر نیست." }, { status: 400 });
  const [result] = await pool.execute<ResultSetHeader>("UPDATE products SET status = 'archived', updated_by = ? WHERE id = ?", [admin.id, id]);
  if (!result.affectedRows) return NextResponse.json({ success: false, error: "محصول پیدا نشد." }, { status: 404 });
  return NextResponse.json({ success: true });
}
