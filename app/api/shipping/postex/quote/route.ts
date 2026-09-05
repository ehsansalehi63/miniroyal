import { NextRequest, NextResponse } from "next/server";
import { describePostexError, extractQuotePriceToman, getPostexQuote, postexConfigured } from "@/app/lib/postex";

export async function POST(request: NextRequest) {
  if (!postexConfigured()) {
    return NextResponse.json(
      { success: false, configured: false, error: "سرویس ارسال هنوز در هاست تنظیم نشده است." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const totalValue = Number(body.totalValue);
    const totalWeight = Number(body.totalWeight);
    if (!city || !Number.isFinite(totalValue) || totalValue < 0 || !Number.isFinite(totalWeight) || totalWeight <= 0) {
      return NextResponse.json({ success: false, error: "شهر مقصد، ارزش و وزن مرسوله معتبر نیست." }, { status: 400 });
    }
    const data = await getPostexQuote({
      destinationCity: city,
      totalValue,
      totalWeight,
      paymentType: body.paymentType === "COD" ? "COD" : "SENDER",
    });
    // مبلغ در سرور استخراج می‌شود تا صفحهٔ تسویه مجبور نباشد ساختار پاسخ پستکس را حدس بزند.
    const price = extractQuotePriceToman(data);
    if (price === null) {
      return NextResponse.json(
        { success: false, error: "هزینهٔ ارسال در پاسخ پستکس پیدا نشد؛ نرخ پایه اعمال شد." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, price, currency: "IRT", data });
  } catch (error) {
    console.error("Postex quote failed:", error);
    return NextResponse.json({ success: false, error: describePostexError(error) }, { status: 502 });
  }
}
