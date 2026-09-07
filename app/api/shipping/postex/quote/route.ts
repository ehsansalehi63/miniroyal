import { NextRequest, NextResponse } from "next/server";
import { getPostexQuote, postexConfigured } from "@/app/lib/postex";

export async function POST(request: NextRequest) {
  if (!postexConfigured()) return NextResponse.json({ success: false, configured: false, error: "سرویس ارسال هنوز در هاست تنظیم نشده است." }, { status: 503 });
  try {
    const body = await request.json();
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const totalValue = Number(body.totalValue);
    const totalWeight = Number(body.totalWeight);
    if (!city || !Number.isFinite(totalValue) || totalValue < 0 || !Number.isFinite(totalWeight) || totalWeight <= 0) {
      return NextResponse.json({ success: false, error: "شهر مقصد، ارزش و وزن مرسوله معتبر نیست." }, { status: 400 });
    }
    const data = await getPostexQuote({ destinationCity: city, totalValue, totalWeight, paymentType: body.paymentType === "COD" ? "COD" : "SENDER" });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Postex quote failed:", error);
    return NextResponse.json({ success: false, error: "استعلام هزینه ارسال از پستکس انجام نشد." }, { status: 502 });
  }
}
