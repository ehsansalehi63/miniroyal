import { NextRequest, NextResponse } from "next/server";
import { findCity, findProvince, normalizePersian, calculateTipaxRate } from "@/app/lib/iranCities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  if (!latStr || !lngStr) {
    return NextResponse.json({ success: false, error: "مختصات جغرافیایی ارسال نشده است." }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ success: false, error: "مختصات جغرافیایی نامعتبر است." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fa&zoom=18&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MiniRoyal-Shop/1.0 (Customer-Checkout-Geocoding)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // ۱. استخراج و استانداردسازی استان
      const rawState = addr.state || addr.province || addr.region || "";
      const province = findProvince(rawState) || (lat >= 35.5 && lat <= 36.0 && lng >= 51.1 && lng <= 51.6 ? "تهران" : lat >= 32.4 && lat <= 33.0 && lng >= 51.4 && lng <= 52.0 ? "اصفهان" : "");

      // ۲. استخراج شهر
      const rawCity = addr.city || addr.town || addr.county || addr.municipality || addr.village || "";
      const city = findCity(rawCity, province) || normalizePersian(rawCity);

      // ۳. ساخت آدرس خوش‌خوان پستی فارسی
      const addressParts: string[] = [];
      if (addr.road) addressParts.push(`خیابان ${addr.road}`);
      if (addr.neighbourhood || addr.suburb || addr.quarter) {
        addressParts.push(`محله ${addr.neighbourhood || addr.suburb || addr.quarter}`);
      }
      if (addr.residential) addressParts.push(addr.residential);
      if (addr.house_number) addressParts.push(`پلاک ${addr.house_number}`);

      const formattedAddress = addressParts.length > 0 
        ? addressParts.join("، ")
        : (data.display_name ? String(data.display_name).split("،").slice(0, 3).join("، ") : `موقعیت جغرافیایی (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

      // ۴. کدپستی (در صورت وجود ارقام معتبر)
      let postalCode = "";
      if (addr.postcode) {
        const digits = String(addr.postcode).replace(/\D/g, "");
        if (digits.length === 10) {
          postalCode = digits;
        }
      }

      // ۵. محاسبه هزینه تیپاکس بر اساس مقصد استخراج شده
      const tipaxResult = calculateTipaxRate({
        province: province || "اصفهان",
        city: city || "اصفهان",
        weightGrams: 500,
        valueToman: 500000,
      });

      return NextResponse.json({
        success: true,
        province,
        city,
        address: formattedAddress,
        postalCode,
        tipaxRate: tipaxResult,
        displayName: data.display_name,
      });
    }
  } catch (error) {
    console.warn("Nominatim reverse geocode error or timeout:", error);
  }

  // فال‌بک هوشمند بر اساس مختصات تقریبی شهرهای بزرگ ایران در صورت قطع موقت سرویس
  let fallbackProvince = "اصفهان";
  let fallbackCity = "اصفهان";

  if (lat >= 35.4 && lat <= 36.1 && lng >= 51.1 && lng <= 51.7) {
    fallbackProvince = "تهران";
    fallbackCity = "تهران";
  } else if (lat >= 35.6 && lat <= 36.1 && lng >= 50.7 && lng <= 51.2) {
    fallbackProvince = "البرز";
    fallbackCity = "کرج";
  } else if (lat >= 36.1 && lat <= 36.5 && lng >= 59.4 && lng <= 59.8) {
    fallbackProvince = "خراسان رضوی";
    fallbackCity = "مشهد";
  } else if (lat >= 29.4 && lat <= 29.8 && lng >= 52.3 && lng <= 52.7) {
    fallbackProvince = "فارس";
    fallbackCity = "شیراز";
  } else if (lat >= 37.9 && lat <= 38.3 && lng >= 46.1 && lng <= 46.5) {
    fallbackProvince = "آذربایجان شرقی";
    fallbackCity = "تبریز";
  } else if (lat >= 31.2 && lat <= 31.5 && lng >= 48.5 && lng <= 48.9) {
    fallbackProvince = "خوزستان";
    fallbackCity = "اهواز";
  }

  const tipaxResult = calculateTipaxRate({
    province: fallbackProvince,
    city: fallbackCity,
    weightGrams: 500,
  });

  return NextResponse.json({
    success: true,
    province: fallbackProvince,
    city: fallbackCity,
    address: `موقعیت ثبت شده روی نقشه (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    postalCode: "",
    tipaxRate: tipaxResult,
  });
}
