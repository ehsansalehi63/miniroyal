import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/app/lib/coupons";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;

    const result = await validateCoupon(code, subtotal);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بررسی کد تخفیف." },
      { status: 500 }
    );
  }
}
