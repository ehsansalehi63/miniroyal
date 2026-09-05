import { NextResponse } from "next/server";
import { listTipaxCities, tipaxConfigured } from "@/app/lib/tipax";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!tipaxConfigured()) return NextResponse.json({ success: false, configured: false, error: "سرویس تیپاکس روی هاست تنظیم نشده است." }, { status: 503 });
  try {
    const cities = await listTipaxCities();
    return NextResponse.json({ success: true, cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("Tipax cities failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ success: false, error: "دریافت شهرهای تیپاکس انجام نشد." }, { status: 502 });
  }
}
