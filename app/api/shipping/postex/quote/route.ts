import { NextRequest, NextResponse } from "next/server";
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

    // محاسبه دقیق و بلادرنگ کرایه تیپاکس بر اساس مسافت، وزن و بیمه مرسوله
    const rate = calculateTipaxRate({
      province,
      city,
      weightGrams: Math.round(totalWeight * 1000),
      valueToman: totalValue,
    });

    return NextResponse.json({
      success: true,
      provider: "tipax",
      providerName: "تیپاکس (Tipax Express)",
      data: {
        cost: rate.costToman,
        currency: "تومان",
        estimatedDays: rate.estimatedDelivery,
        breakdown: rate.breakdown,
      },
    });
  } catch (error) {
    console.error("Tipax shipping quote failed:", error);
    return NextResponse.json({ success: false, error: "استعلام هزینه ارسال تیپاکس انجام نشد." }, { status: 500 });
  }
}

