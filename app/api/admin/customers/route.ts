import { NextResponse } from "next/server";
import { listCustomers } from "@/app/lib/orders";

export async function GET() {
  try {
    return NextResponse.json({ success: true, customers: await listCustomers() });
  } catch (error) {
    console.error("Admin customers failed:", error);
    const code = error instanceof Error && "code" in error ? String(error.code) : "CUSTOMER_QUERY_ERROR";
    console.error("Admin customers error code:", code);
    return NextResponse.json({ success: false, error: "دریافت مشتری‌ها از دیتابیس ممکن نیست." }, { status: 503 });
  }
}
