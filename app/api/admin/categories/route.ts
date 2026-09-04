import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 140);
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  const [rows] = await pool.execute<RowDataPacket[]>("SELECT id, parent_id AS parentId, name, slug, description, icon, image_url AS imageUrl, sort_order AS sortOrder FROM categories WHERE is_active = 1 ORDER BY sort_order, id");
  return NextResponse.json({ success: true, categories: rows });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  const body = await request.json() as { name?: string; slug?: string; icon?: string; description?: string; parentId?: number | null; sortOrder?: number };
  const name = body.name?.trim();
  const slug = slugify(body.slug || name || "");
  if (!name || !slug) return NextResponse.json({ success: false, error: "نام و اسلاگ دسته‌بندی الزامی است." }, { status: 400 });
  try {
    const sortOrder = Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0;
    const [result] = await pool.execute<ResultSetHeader>("INSERT INTO categories (parent_id, name, slug, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [body.parentId || null, name, slug, body.description?.trim() || null, body.icon?.trim() || "👕", sortOrder]);
    return NextResponse.json({ success: true, category: { id: result.insertId, parentId: body.parentId || null, name, slug, description: body.description || "", icon: body.icon || "👕", sortOrder: body.sortOrder || 0 } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && /duplicate|unique/i.test(error.message) ? "این اسلاگ قبلاً ثبت شده است." : "ثبت دسته‌بندی انجام نشد.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
