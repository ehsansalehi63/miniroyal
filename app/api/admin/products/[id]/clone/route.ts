import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";
import { ensureProductAttributeTables } from "@/app/lib/product-attribute-schema";

type Context = { params: Promise<{ id: string }> };

function jsonValue(value: unknown) { return value === undefined || value === null ? null : typeof value === "string" ? value : JSON.stringify(value); }

export async function POST(_request: NextRequest, context: Context) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی کپی محصول ندارید." }, { status: 403 });
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ success: false, error: "شناسهٔ محصول معتبر نیست." }, { status: 400 });
  await ensureProductAttributeTables(pool);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.execute<RowDataPacket[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    const source = products[0];
    if (!source) return NextResponse.json({ success: false, error: "محصول پیدا نشد." }, { status: 404 });
    const suffix = `-copy-${Date.now().toString().slice(-6)}`;
    const title = `${source.title} (کپی)`;
    const slug = `${String(source.slug).slice(0, 230)}${suffix}`;
    const sku = `${String(source.sku).slice(0, 88)}${suffix}`;
    const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO products (title, slug, sku, short_desc, description, category_id, brand_id, supplier_id, gender, age_min_month, age_max_month, base_price, sale_price, cost_price, is_featured, is_special_offer, status, fit_type, seo_title, seo_desc, faq_json, size_chart_json, features_json, fabric_material, wash_care, fit_profile_json, tryon_asset_json, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, slug, sku, source.short_desc, source.description, source.category_id, source.brand_id, source.supplier_id, source.gender, source.age_min_month, source.age_max_month, source.base_price, source.sale_price, source.cost_price, source.is_featured, source.is_special_offer, source.fit_type, source.seo_title, source.seo_desc, jsonValue(source.faq_json), jsonValue(source.size_chart_json), jsonValue(source.features_json), source.fabric_material, source.wash_care, jsonValue(source.fit_profile_json), jsonValue(source.tryon_asset_json), admin.id]);
    const productId = result.insertId;
    const [variants] = await connection.execute<RowDataPacket[]>("SELECT sku, size, color, color_code, stock, price_adjustment FROM product_variants WHERE product_id = ? ORDER BY id", [id]);
    for (const variant of variants) await connection.execute("INSERT INTO product_variants (product_id, sku, size, color, color_code, stock, price_adjustment) VALUES (?, ?, ?, ?, ?, ?, ?)", [productId, `${String(variant.sku).slice(0, 86)}${suffix}`, variant.size, variant.color, variant.color_code, variant.stock, variant.price_adjustment]);
    const [images] = await connection.execute<RowDataPacket[]>("SELECT url, alt, sort_order, is_primary, media_type FROM product_media WHERE product_id = ? ORDER BY sort_order, id", [id]);
    for (const image of images) await connection.execute("INSERT INTO product_media (product_id, url, alt, sort_order, is_primary, media_type) VALUES (?, ?, ?, ?, ?, ?)", [productId, image.url, image.alt, image.sort_order, image.is_primary, image.media_type]);
    const [angles] = await connection.execute<RowDataPacket[]>("SELECT angle, url, alt, is_ai_optimized, is_tryon_ready, sort_order FROM product_media_angles WHERE product_id = ? ORDER BY sort_order, id", [id]);
    for (const angle of angles) await connection.execute("INSERT INTO product_media_angles (product_id, angle, url, alt, is_ai_optimized, is_tryon_ready, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [productId, angle.angle, angle.url, angle.alt, angle.is_ai_optimized, angle.is_tryon_ready, angle.sort_order]);
    const [attributes] = await connection.execute<RowDataPacket[]>("SELECT definition_id, field_key, label, value_text, value_json, unit, is_custom, sort_order FROM product_attributes WHERE product_id = ? ORDER BY sort_order, id", [id]);
    for (const attribute of attributes) await connection.execute("INSERT INTO product_attributes (product_id, definition_id, field_key, label, value_text, value_json, unit, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [productId, attribute.definition_id, attribute.field_key, attribute.label, attribute.value_text, attribute.value_json, attribute.unit, attribute.is_custom, attribute.sort_order]);
    await connection.commit();
    return NextResponse.json({ success: true, id: productId, title, sku, slug }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error("Product clone error:", error);
    return NextResponse.json({ success: false, error: "کپی محصول انجام نشد." }, { status: 400 });
  } finally { connection.release(); }
}
