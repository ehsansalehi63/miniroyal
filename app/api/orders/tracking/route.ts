import { NextRequest, NextResponse } from "next/server";
import { findOrder } from "@/app/lib/orders";
import { trackPostexParcel, postexConfigured } from "@/app/lib/postex";

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();
  if (!identifier) return NextResponse.json({ success: false, error: "شماره سفارش الزامی است." }, { status: 400 });
  if (!postexConfigured()) return NextResponse.json({ success: false, error: "رهگیری پستکس هنوز فعال نشده است." }, { status: 503 });
  try {
    const order = await findOrder(identifier);
    if (!order) return NextResponse.json({ success: false, error: "سفارش پیدا نشد." }, { status: 404 });
    if (!order.postexParcelNo) return NextResponse.json({ success: true, tracking: null, message: "مرسوله هنوز در پستکس ثبت نشده است." });
    const tracking = await trackPostexParcel(String(order.postexParcelNo));
    return NextResponse.json({ success: true, orderNumber: order.orderNumber, trackingCode: order.trackingCode, tracking });
  } catch (error) {
    console.error("Postex tracking failed:", error);
    return NextResponse.json({ success: false, error: "دریافت وضعیت مرسوله انجام نشد." }, { status: 502 });
  }
}
