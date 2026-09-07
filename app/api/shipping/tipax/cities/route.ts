import { NextResponse } from "next/server";
import { listTipaxCities, tipaxConfigured } from "@/app/lib/tipax";
import { tipaxProvinceName } from "@/app/lib/provinces";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!tipaxConfigured()) return NextResponse.json({ success: false, configured: false, error: "سرویس تیپاکس روی هاست تنظیم نشده است." }, { status: 503 });
  try {
    const raw = await listTipaxCities();
    const rows = Array.isArray(raw) ? raw : [];
    const cities = rows
      .map((row) => {
        const item = row as { title?: string; stateId?: number | string; id?: number };
        return {
          id: Number(item.id || 0),
          name: String(item.title || "").trim().replace(/ي/g, "ی").replace(/ك/g, "ک"),
          province: tipaxProvinceName(item.stateId),
          provinceId: item.stateId !== null && item.stateId !== undefined ? Number(item.stateId) : 0,
        };
      })
      .filter((item) => item.id > 0 && item.name && item.province);
    const provinces = [...new Set(cities.map((item) => item.province))].sort((a, b) => a.localeCompare(b, "fa"));
    return NextResponse.json({ success: true, provinces, cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("Tipax cities failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ success: false, error: "دریافت شهرهای تیپاکس انجام نشد." }, { status: 502 });
  }
}
