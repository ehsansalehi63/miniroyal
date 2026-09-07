import { NextRequest, NextResponse } from "next/server";
import { calculateTipaxRate } from "@/app/lib/iranCities";
import { tipaxConfigured } from "@/app/lib/tipax";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const province = typeof body.province === "string" ? body.province.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const totalValue = Number(body.totalValue) || 0;
    const totalWeightKg = Number(body.totalWeight) || 0.5;

    if (!city) {
      return NextResponse.json({ success: false, error: "شهر مقصد برای محاسبه هزینه تیپاکس الزامی است." }, { status: 400 });
    }

    // محاسبه دقیق بر اساس تعرفه تیپاکس و مسافت استانی
    const tipaxResult = calculateTipaxRate({
      province: province || "اصفهان",
      city,
      weightGrams: Math.round(totalWeightKg * 1000),
      valueToman: totalValue,
    });

    return NextResponse.json({
      success: true,
      data: {
        cost: tipaxResult.costToman,
        currency: "تومان",
        estimatedDays: tipaxResult.estimatedDelivery,
        serviceTitle: "تیپاکس (تحویل سریع درب منزل)",
        breakdown: tipaxResult.breakdown,
        isLiveApi: tipaxConfigured(),
      },
    });
  } catch (error) {
    console.error("Tipax quote calculation error:", error);
    return NextResponse.json({ success: false, error: "خطا در محاسبه تعرفه تیپاکس" }, { status: 500 });
  }
}
