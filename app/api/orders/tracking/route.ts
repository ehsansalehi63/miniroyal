import { NextRequest, NextResponse } from "next/server";
import { findOrder } from "@/app/lib/orders";
import { trackTipaxParcel } from "@/app/lib/tipax";

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();
  if (!identifier) {
    return NextResponse.json({ success: false, error: "شماره سفارش یا کد رهگیری الزامی است." }, { status: 400 });
  }

  try {
    const order = await findOrder(identifier);
    if (!order) {
      return NextResponse.json({ success: false, error: "سفارشی با این شناسه یافت نشد." }, { status: 404 });
    }

    const trackingBarcode = String(order.postexParcelNo || order.trackingCode || "");
    if (!trackingBarcode) {
      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        tracking: null,
        message: "مرسوله هنوز در سامانه تیپاکس ثبت نشده یا بارکد صادر نشده است.",
      });
    }

    const tracking = await trackTipaxParcel(trackingBarcode);
    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      carrier: "تیپاکس (Tipax)",
      trackingBarcode,
      trackingUrl: `https://tipaxco.com/tracking?id=${encodeURIComponent(trackingBarcode)}`,
      tracking,
    });
  } catch (error) {
    console.error("Tipax tracking fetch failed:", error);
    return NextResponse.json({ success: false, error: "دریافت وضعیت مرسوله از تیپاکس انجام نشد." }, { status: 502 });
  }
}
