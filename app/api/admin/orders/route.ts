import { NextRequest, NextResponse } from "next/server";
import { listOrders, updateOrderStatus } from "@/app/lib/orders";

export async function GET() {
  try {
    return NextResponse.json({ success: true, orders: await listOrders() });
  } catch (error) {
    console.error("Admin orders failed:", error);
    const code = error instanceof Error && "code" in error ? String(error.code) : "ORDER_QUERY_ERROR";
    console.error("Admin orders error code:", code);
    return NextResponse.json({ success: false, error: "دریافت سفارش‌ها از دیتابیس ممکن نیست." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.orderNumber !== "string" || typeof body.status !== "string") {
      return NextResponse.json({ success: false, error: "اطلاعات وضعیت سفارش معتبر نیست." }, { status: 400 });
    }
    await updateOrderStatus(body.orderNumber, body.status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin order update failed:", error);
    return NextResponse.json({ success: false, error: "تغییر وضعیت سفارش انجام نشد." }, { status: 503 });
  }
}
