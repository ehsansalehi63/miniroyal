import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { ensureBannerTable, getBanners, BannerPlacement } from "@/app/lib/banners";
import pool from "@/app/lib/mysql";

const placements: BannerPlacement[] = ["home_hero", "home_after_categories", "home_before_footer", "shop_top", "category_top", "product_top"];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.read")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  return NextResponse.json({ success: true, banners: await getBanners() });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی مدیریت بنر ندارید." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const title = text(body.title), imageUrl = text(body.imageUrl), placement = text(body.placement) as BannerPlacement;
  if (!title || !imageUrl || !placements.includes(placement)) return NextResponse.json({ success: false, error: "عنوان، تصویر و محل نمایش بنر الزامی است." }, { status: 400 });
  await ensureBannerTable();
  const [result] = await pool.execute("INSERT INTO site_banners (title, subtitle, image_url, mobile_image_url, link_url, placement, is_active, sort_order, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [title, text(body.subtitle) || null, imageUrl, text(body.mobileImageUrl) || null, text(body.linkUrl) || null, placement, body.isActive === false ? 0 : 1, Number(body.sortOrder || 0), text(body.startsAt) || null, text(body.endsAt) || null]);
  return NextResponse.json({ success: true, id: (result as { insertId: number }).insertId }, { status: 201 });
}
