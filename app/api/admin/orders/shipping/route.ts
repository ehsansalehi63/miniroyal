import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { findOrder, updateTipaxShipment } from "@/app/lib/orders";
import { registerTipaxOrder, trackTipaxParcel } from "@/app/lib/tipax";

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const action = body.action === "track" ? "track" : "register";
    const order = await findOrder(orderNumber);

    if (!order) {
      return NextResponse.json({ success: false, error: "سفارش پیدا نشد." }, { status: 404 });
    }

    if (action === "track") {
      const trackingIdentifier = String(order.postexParcelNo || order.trackingCode || "");
      if (!trackingIdentifier) {
        return NextResponse.json({ success: false, error: "این سفارش هنوز بارکد تیپاکس ندارد." }, { status: 400 });
      }
      const tracking = await trackTipaxParcel(trackingIdentifier);
      return NextResponse.json({
        success: true,
        provider: "tipax",
        tracking,
        trackingUrl: `https://tipaxco.com/tracking?id=${encodeURIComponent(trackingIdentifier)}`,
      });
    }

    // صدور و ثبت سفارش در تیپاکس
    if (order.postexParcelNo) {
      return NextResponse.json({
        success: false,
        error: `این سفارش قبلاً با بارکد ${order.postexParcelNo} در سامانه تیپاکس ثبت شده است.`,
      }, { status: 409 });
    }

    const tipaxResult = await registerTipaxOrder(order as Record<string, unknown>);

    await updateTipaxShipment(orderNumber, {
      barcode: tipaxResult.barcode,
      orderNo: tipaxResult.orderNo,
      trackingCode: tipaxResult.trackingCode,
      trackingStatus: tipaxResult.status,
    });

    return NextResponse.json({
      success: true,
      provider: "tipax",
      identifiers: {
        barcode: tipaxResult.barcode,
        trackingCode: tipaxResult.trackingCode,
        orderNo: tipaxResult.orderNo,
        trackingUrl: tipaxResult.trackingUrl,
      },
    });
  } catch (error) {
    console.error("Admin Tipax shipping action failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "عملیات تیپاکس انجام نشد.",
    }, { status: 502 });
  }
}
