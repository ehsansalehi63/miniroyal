import { NextRequest, NextResponse } from "next/server";
import { getPostexQuote, postexConfigured } from "@/app/lib/postex";
import { calculateTipaxRate } from "@/app/lib/iranCities";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const province = typeof body.province === "string" ? body.province.trim() : "";
    const totalValue = Number(body.totalValue) || 0;
    const totalWeight = Number(body.totalWeight) || 0.5;

    if (!city) {
      return NextResponse.json({ success: false, error: "شهر مقصد برای استعلام الزامی است." }, { status: 400 });
    }

    if (postexConfigured()) {
      try {
        const data = await getPostexQuote({ destinationCity: city, totalValue, totalWeight, paymentType: body.paymentType === "COD" ? "COD" : "SENDER" });
        return NextResponse.json({ success: true, data });
      } catch (error) {
        console.warn("Postex quote failed, using standard calculation fallback:", error);
      }
    }

    // فال‌بک دقیق و هوشمند در صورت عدم تنظیم یا خطای سرویس خارجی
    const rate = calculateTipaxRate({ province, city, weightGrams: Math.round(totalWeight * 1000), valueToman: totalValue });
    return NextResponse.json({
      success: true,
      data: {
        cost: rate.costToman,
        currency: "تومان",
        estimatedDays: rate.estimatedDelivery,
        breakdown: rate.breakdown,
      },
    });
  } catch (error) {
    console.error("Shipping quote failed:", error);
    return NextResponse.json({ success: false, error: "استعلام هزینه ارسال انجام نشد." }, { status: 500 });
  }
}

