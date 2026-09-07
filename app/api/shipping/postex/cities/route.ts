import { NextResponse } from "next/server";
import { listPostexCities, listPostexProvinces, postexConfigured } from "@/app/lib/postex";

export async function GET() {
  if (!postexConfigured()) return NextResponse.json({ success: false, configured: false, error: "سرویس پستکس روی هاست تنظیم نشده است." }, { status: 503 });
  try {
    const [cities, provinceRows] = await Promise.all([listPostexCities(), listPostexProvinces()]);
    const provinces = provinceRows.map((province) => province.name).sort((a, b) => a.localeCompare(b, "fa"));
    return NextResponse.json({ success: true, provinces, cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("Postex cities failed:", error);
    return NextResponse.json({ success: false, error: "دریافت فهرست شهرها از پستکس انجام نشد." }, { status: 502 });
  }
}
