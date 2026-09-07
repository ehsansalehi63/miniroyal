import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";
import { normalizeAttributeKey } from "@/app/lib/product-attributes";
import { ensureProductAttributeTables } from "@/app/lib/product-attribute-schema";

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.read")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  await ensureProductAttributeTables(pool);
  const categoryId = Number(request.nextUrl.searchParams.get("categoryId") || 0);
  const fieldKey = request.nextUrl.searchParams.get("fieldKey")?.trim() || "";
  if (!categoryId) return NextResponse.json({ success: true, definitions: [], suggestions: [] });
  const [definitions] = await pool.execute<RowDataPacket[]>("SELECT d.id, d.category_id AS categoryId, d.field_key AS fieldKey, d.label, d.help_text AS helpText, d.input_type AS inputType, d.unit, d.options_json AS optionsJson, d.is_required AS isRequired, d.sort_order AS sortOrder FROM category_attribute_definitions d WHERE d.category_id IN (SELECT ? UNION SELECT parent_id FROM categories WHERE id = ? AND parent_id IS NOT NULL) AND d.is_active = 1 ORDER BY d.sort_order, d.id", [categoryId, categoryId]);
  const [suggestions] = await pool.execute<RowDataPacket[]>("SELECT field_key AS fieldKey, display_value AS displayValue, usage_count AS usageCount FROM attribute_value_suggestions WHERE (? = '' OR field_key = ?) AND (? = '' OR display_value LIKE ?) ORDER BY usage_count DESC, display_value LIMIT 40", [fieldKey, fieldKey, fieldKey, `${fieldKey}%`]);
  return NextResponse.json({ success: true, definitions: definitions.map((definition) => ({ ...definition, options: typeof definition.optionsJson === "string" ? JSON.parse(definition.optionsJson || "[]") : definition.optionsJson || [] })), suggestions });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "categories.write")) return NextResponse.json({ success: false, error: "دسترسی تعریف مشخصات را ندارید." }, { status: 403 });
  await ensureProductAttributeTables(pool);
  const body = await request.json() as Record<string, unknown>;
  const categoryId = Number(body.categoryId || 0);
  const label = String(body.label || "").trim();
  const fieldKey = normalizeAttributeKey(String(body.fieldKey || label));
  if (!categoryId || !label || !fieldKey) return NextResponse.json({ success: false, error: "دسته‌بندی، نام و کلید مشخصه الزامی است." }, { status: 400 });
  const options = Array.isArray(body.options) ? body.options.map(String).filter(Boolean).slice(0, 100) : [];
  try {
    const [result] = await pool.execute<ResultSetHeader>("INSERT INTO category_attribute_definitions (category_id, field_key, label, help_text, input_type, unit, options_json, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [categoryId, fieldKey, label.slice(0, 150), body.helpText ? String(body.helpText).slice(0, 2000) : null, String(body.inputType || "text"), body.unit ? String(body.unit).slice(0, 30) : null, JSON.stringify(options), body.isRequired ? 1 : 0, Number(body.sortOrder || 0)]);
    return NextResponse.json({ success: true, id: result.insertId, fieldKey }, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Error && /duplicate|unique/i.test(error.message);
    return NextResponse.json({ success: false, error: duplicate ? "این مشخصه برای این دسته‌بندی قبلاً تعریف شده است." : "ثبت مشخصه انجام نشد." }, { status: 400 });
  }
}
