import { NextResponse } from "next/server";
import { describePostexError, listPostexCities, postexConfigured } from "@/app/lib/postex";
import { IRAN_PROVINCES } from "@/app/lib/iran-provinces";

/**
 * فهرست شهرهای پستکس برای فرم تسویه.
 *
 * قبلاً در هر خطایی این مسیر ۵۰۳/۵۰۲ برمی‌گرداند و فرم آدرس بدون هیچ راهنمایی به
 * ورودی متنی می‌افتاد. حالا در حالت خطا هم پاسخ ۲۰۰ با فهرست استان‌های ثابت و یک
 * پیام روشن برگردانده می‌شود تا خرید متوقف نشود، ولی وضعیت واقعی سرویس هم مشخص باشد.
 */
function fallbackResponse(reason: string) {
  return NextResponse.json({
    success: true,
    source: "fallback" as const,
    provinces: [...IRAN_PROVINCES],
    cities: [],
    notice: `${reason} فهرست شهرها موقتاً از پستکس در دسترس نیست؛ نام شهر را دستی وارد کنید.`,
  });
}

export async function GET() {
  if (!postexConfigured()) return fallbackResponse("سرویس پستکس روی هاست تنظیم نشده است.");
  try {
    const cities = await listPostexCities();
    if (!cities.length) return fallbackResponse("پاسخ پستکس شهری نداشت.");
    const provinces = [...new Set(cities.map((city) => city.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa"));
    return NextResponse.json(
      { success: true, source: "postex" as const, provinces, cities },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (error) {
    console.error("Postex cities failed:", error);
    return fallbackResponse(describePostexError(error));
  }
}
