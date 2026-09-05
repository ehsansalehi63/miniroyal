import { NextResponse } from "next/server";
import { checkPostexConnection } from "@/app/lib/postex";

/**
 * تست سلامت اتصال پستکس برای صفحهٔ /admin/health.
 * پاسخ همیشه ۲۰۰ است تا کارت سلامت بتواند دلیل دقیق خطا را نمایش دهد.
 */
export async function GET() {
  const result = await checkPostexConnection();
  return NextResponse.json(
    {
      success: result.ok,
      configured: result.configured,
      code: "code" in result ? result.code : undefined,
      status: "status" in result ? result.status : undefined,
      message: result.ok ? "اتصال به پستکس برقرار است." : ("message" in result ? result.message : "اتصال برقرار نشد."),
      durationMs: result.durationMs,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
