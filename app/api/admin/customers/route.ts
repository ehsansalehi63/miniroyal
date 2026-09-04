import { NextResponse } from "next/server";
import { listCustomers } from "@/app/lib/orders";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "customers.read")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  try {
    return NextResponse.json({ success: true, customers: await listCustomers() });
  } catch (error) {
    console.error("Admin customers failed:", error);
    const code = error instanceof Error && "code" in error ? String(error.code) : "CUSTOMER_QUERY_ERROR";
    console.error("Admin customers error code:", code);
    return NextResponse.json({ success: false, error: "دریافت مشتری‌ها از دیتابیس ممکن نیست." }, { status: 503 });
  }
}
