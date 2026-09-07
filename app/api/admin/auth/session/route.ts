import { NextResponse } from "next/server";
import { currentAdmin } from "@/app/lib/admin-auth";

export async function GET() {
  const admin = await currentAdmin();
  return NextResponse.json({ authenticated: Boolean(admin), admin: admin ? { id: admin.id, fullName: admin.full_name, phone: admin.phone, role: admin.role } : null });
}
