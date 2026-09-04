import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "admins.manage")) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const [rows] = await pool.execute("SELECT id, username, full_name, phone, email, role, is_active, last_login, created_at FROM users ORDER BY id DESC") as unknown as [Array<Record<string, unknown>>];
  return NextResponse.json({ users: rows });
}

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || admin.role !== "super_admin") return NextResponse.json({ error: "فقط مالک اصلی می‌تواند دسترسی ادمین را تغییر دهد." }, { status: 403 });
  const body = await request.json();
  const id = Number(body.id);
  const role = typeof body.role === "string" ? body.role : "operator";
  const isActive = body.isActive === false ? 0 : 1;
  if (!Number.isSafeInteger(id) || !["super_admin", "admin", "operator", "editor"].includes(role)) return NextResponse.json({ error: "اطلاعات نقش معتبر نیست." }, { status: 400 });
  if (id === admin.id && role !== "super_admin") return NextResponse.json({ error: "نقش مالک اصلی قابل کاهش نیست." }, { status: 400 });
  await pool.execute("UPDATE users SET role = ?, is_active = ? WHERE id = ?", [role, isActive, id]);
  return NextResponse.json({ success: true });
}
