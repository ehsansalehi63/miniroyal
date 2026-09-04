import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { findOrder, updatePostexShipment } from "@/app/lib/orders";
import { extractPostexIdentifiers, postexConfigured, registerPostexOrder, trackPostexParcel } from "@/app/lib/postex";

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  if (!postexConfigured()) return NextResponse.json({ success: false, error: "Postex در محیط هاست تنظیم نشده است." }, { status: 503 });
  try {
    const body = await request.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const action = body.action === "track" ? "track" : "register";
    const order = await findOrder(orderNumber);
    if (!order) return NextResponse.json({ success: false, error: "سفارش پیدا نشد." }, { status: 404 });
    if (action === "track") {
      if (!order.postexParcelNo) return NextResponse.json({ success: false, error: "این سفارش هنوز شناسه مرسوله ندارد." }, { status: 400 });
      const tracking = await trackPostexParcel(String(order.postexParcelNo));
      return NextResponse.json({ success: true, tracking });
    }
    if (order.postexParcelNo) return NextResponse.json({ success: false, error: "این سفارش قبلاً در Postex ثبت شده است." }, { status: 409 });
    const result = await registerPostexOrder(order as Record<string, unknown>);
    const identifiers = extractPostexIdentifiers(result);
    await updatePostexShipment(orderNumber, identifiers);
    return NextResponse.json({ success: true, identifiers });
  } catch (error) {
    console.error("Admin Postex action failed:", error);
    return NextResponse.json({ success: false, error: "عملیات Postex انجام نشد." }, { status: 502 });
  }
}
