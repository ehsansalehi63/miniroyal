import { NextResponse } from "next/server";
import { listPostexCities, postexConfigured } from "@/app/lib/postex";

export async function GET() {
  if (!postexConfigured()) return NextResponse.json({ success: false, configured: false, error: "سرویس پستکس روی هاست تنظیم نشده است." }, { status: 503 });
  try {
    const cities = await listPostexCities();
    const provinces = [...new Set(cities.map((city) => city.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa"));
    return NextResponse.json({ success: true, provinces, cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("Postex cities failed:", error);
    return NextResponse.json({ success: false, error: "دریافت فهرست شهرها از پستکس انجام نشد." }, { status: 502 });
  }
}
