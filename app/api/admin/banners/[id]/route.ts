import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { ensureBannerTable } from "@/app/lib/banners";
import pool from "@/app/lib/mysql";

const placements = ["home_hero", "home_after_categories", "home_before_footer", "shop_top", "category_top", "product_top"];
const idOf = async (context: { params: Promise<{ id: string }> }) => Number((await context.params).id);
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی مدیریت بنر ندارید." }, { status: 403 });
  const id = await idOf(context); const body = await request.json().catch(() => ({}));
  const fields: Array<[string, unknown]> = [];
  const mapping: Record<string, string> = { title: "title", subtitle: "subtitle", imageUrl: "image_url", mobileImageUrl: "mobile_image_url", linkUrl: "link_url", placement: "placement", isActive: "is_active", sortOrder: "sort_order", startsAt: "starts_at", endsAt: "ends_at" };
  for (const [key, column] of Object.entries(mapping)) if (body[key] !== undefined) fields.push([column, key === "isActive" ? (body[key] ? 1 : 0) : key === "sortOrder" ? Number(body[key]) : text(body[key]) || null]);
  if (body.placement !== undefined && !placements.includes(text(body.placement))) return NextResponse.json({ success: false, error: "محل نمایش بنر معتبر نیست." }, { status: 400 });
  if (!Number.isSafeInteger(id) || id < 1 || !fields.length) return NextResponse.json({ success: false, error: "اطلاعات ویرایش بنر معتبر نیست." }, { status: 400 });
  await ensureBannerTable();
  await pool.execute(`UPDATE site_banners SET ${fields.map(([column]) => `\`${column}\` = ?`).join(", ")} WHERE id = ?`, [...fields.map(([, value]) => value), id] as Array<string | number | null>);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی حذف بنر ندارید." }, { status: 403 });
  const id = await idOf(context); await ensureBannerTable(); await pool.execute("DELETE FROM site_banners WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
