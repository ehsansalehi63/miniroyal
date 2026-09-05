import type { Pool, PoolConnection } from "mysql2/promise";

export type ProductAttributeInput = {
  id?: number;
  definitionId?: number | null;
  fieldKey: string;
  label: string;
  value: string | number | boolean | string[];
  unit?: string | null;
  isCustom?: boolean;
  sortOrder?: number;
};

export function normalizeAttributeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export function sanitizeAttributes(input: unknown): ProductAttributeInput[] {
  if (!Array.isArray(input)) return [];
  return input.map((raw, index) => {
    const item = raw as Record<string, unknown>;
    const value = item.value;
    const normalizedValue = Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 50) : typeof value === "boolean" || typeof value === "number" ? value : String(value ?? "").trim();
    return {
      definitionId: item.definitionId ? Number(item.definitionId) : null,
      fieldKey: normalizeAttributeKey(String(item.fieldKey || item.label || `custom-${index + 1}`)),
      label: String(item.label || item.fieldKey || "مشخصهٔ سفارشی").trim().slice(0, 150),
      value: normalizedValue,
      unit: item.unit ? String(item.unit).trim().slice(0, 30) : null,
      isCustom: Boolean(item.isCustom),
      sortOrder: Number.isInteger(item.sortOrder) ? Number(item.sortOrder) : index,
    };
  }).filter((item) => item.fieldKey && (Array.isArray(item.value) ? item.value.length > 0 : String(item.value).trim() !== ""));
}

export async function replaceProductAttributes(connection: PoolConnection, productId: number, input: unknown) {
  const attributes = sanitizeAttributes(input);
  await connection.execute("DELETE FROM product_attributes WHERE product_id = ?", [productId]);
  for (const attribute of attributes) {
    const valueText = typeof attribute.value === "string" || typeof attribute.value === "number" || typeof attribute.value === "boolean" ? String(attribute.value) : null;
    await connection.execute(
      "INSERT INTO product_attributes (product_id, definition_id, field_key, label, value_text, value_json, unit, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [productId, attribute.definitionId || null, attribute.fieldKey, attribute.label, valueText, JSON.stringify(attribute.value), attribute.unit || null, attribute.isCustom ? 1 : 0, attribute.sortOrder ?? 0]
    );
    const values = Array.isArray(attribute.value) ? attribute.value : [String(attribute.value)];
    for (const value of values.filter(Boolean)) {
      const normalized = String(value).trim().toLowerCase();
      if (!normalized) continue;
      await connection.execute(
        "INSERT INTO attribute_value_suggestions (field_key, label, normalized_value, display_value, usage_count) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE display_value = VALUES(display_value), label = VALUES(label), usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP",
        [attribute.fieldKey, attribute.label, normalized.slice(0, 255), String(value).trim().slice(0, 255)]
      );
    }
  }
  return attributes;
}

export async function getProductAttributes(db: Pool | PoolConnection, productId: number) {
  const [rows] = await db.execute<any[]>("SELECT id, definition_id AS definitionId, field_key AS fieldKey, label, value_text AS valueText, value_json AS valueJson, unit, is_custom AS isCustom, sort_order AS sortOrder FROM product_attributes WHERE product_id = ? ORDER BY sort_order, id", [productId]);
  return rows.map((row) => {
    let value: unknown = row.valueText || "";
    try { if (row.valueJson !== null && row.valueJson !== undefined) value = typeof row.valueJson === "string" ? JSON.parse(row.valueJson) : row.valueJson; } catch { /* keep valueText */ }
    return { ...row, value };
  });
}
