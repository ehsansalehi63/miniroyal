import { NextRequest, NextResponse } from "next/server";
import { listOrders, updateOrderStatus, findOrder } from "@/app/lib/orders";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");

  if (orderNumber) {
    try {
      const order = await findOrder(orderNumber);
      if (!order) {
        return NextResponse.json({ success: false, error: "سفارش پیدا نشد." }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    } catch (error) {
      console.error("Admin single order fetch failed:", error);
      return NextResponse.json({ success: false, error: "خطا در دریافت اطلاعات سفارش." }, { status: 500 });
    }
  }

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
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

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
