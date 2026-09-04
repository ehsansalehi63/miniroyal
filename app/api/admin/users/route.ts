import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import pool from "@/app/lib/mysql";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "admins.manage")) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const [rows] = await pool.execute("SELECT id, username, full_name, phone, email, role, is_active, last_login, created_at FROM users ORDER BY id DESC") as unknown as [Array<Record<string, unknown>>];
  const [permissionRows] = await pool.execute("SELECT up.user_id AS userId, p.permission_key AS permissionKey FROM admin_user_permissions up JOIN admin_permissions p ON p.id = up.permission_id") as unknown as [Array<{ userId: number; permissionKey: string }>];
  const users = rows.map((user) => ({ ...user, permissions: permissionRows.filter((row) => row.userId === Number(user.id)).map((row) => row.permissionKey) }));
  const [permissions] = await pool.execute("SELECT permission_key AS permissionKey, title FROM admin_permissions ORDER BY id") as unknown as [Array<{ permissionKey: string; title: string }>];
  return NextResponse.json({ users, permissions });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || admin.role !== "super_admin") return NextResponse.json({ error: "فقط مالک اصلی می‌تواند مدیر جدید اضافه کند." }, { status: 403 });
  const body = await request.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : `${phone}@miniroyal.local`;
  const role = typeof body.role === "string" && ["admin", "operator", "editor"].includes(body.role) ? body.role : "operator";
  if (!fullName || !/^\d{10,15}$/.test(phone)) return NextResponse.json({ error: "نام و شماره موبایل معتبر لازم است." }, { status: 400 });
  try {
    const [result] = await pool.execute("INSERT INTO users (username, email, phone, password_hash, full_name, role) VALUES (?, ?, ?, 'otp-only', ?, ?)", [phone, email, phone, fullName, role]) as unknown as [{ insertId: number }];
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "USER_CREATE_FAILED";
    return NextResponse.json({ error: code === "ER_DUP_ENTRY" ? "این شماره یا ایمیل قبلاً ثبت شده است." : "افزودن مدیر انجام نشد." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || admin.role !== "super_admin") return NextResponse.json({ error: "فقط مالک اصلی می‌تواند دسترسی ادمین را تغییر دهد." }, { status: 403 });
  const body = await request.json();
  const id = Number(body.id);
  const role = typeof body.role === "string" ? body.role : "operator";
  const isActive = body.isActive === false ? 0 : 1;
  const permissions = Array.isArray(body.permissions) ? body.permissions.filter((item: unknown): item is string => typeof item === "string") : [];
  if (!Number.isSafeInteger(id) || !["super_admin", "admin", "operator", "editor"].includes(role)) return NextResponse.json({ error: "اطلاعات نقش معتبر نیست." }, { status: 400 });
  if (id === admin.id && role !== "super_admin") return NextResponse.json({ error: "نقش مالک اصلی قابل کاهش نیست." }, { status: 400 });
  await pool.execute("UPDATE users SET role = ?, is_active = ? WHERE id = ?", [role, isActive, id]);
  await pool.execute("DELETE FROM admin_user_permissions WHERE user_id = ?", [id]);
  if (permissions.length) {
    const [permissionRows] = await pool.query("SELECT id, permission_key FROM admin_permissions WHERE permission_key IN (?)", [permissions]) as unknown as [Array<{ id: number; permission_key: string }>];
    for (const permission of permissionRows) await pool.execute("INSERT INTO admin_user_permissions (user_id, permission_id) VALUES (?, ?)", [id, permission.id]);
  }
  return NextResponse.json({ success: true });
}
