import { NextResponse } from "next/server";
import { checkTryonQuota } from "@/app/lib/tryon-usage";

export async function GET() {
  try {
    const quota = await checkTryonQuota();
    if (!quota.ok) {
      if (quota.status === 401) {
        return NextResponse.json({ success: true, loggedIn: false, remaining: null, limit: null });
      }
      return NextResponse.json({
        success: true,
        loggedIn: true,
        remaining: 0,
        limit: quota.limit,
        windowDays: quota.windowDays,
      });
    }
    return NextResponse.json({
      success: true,
      loggedIn: true,
      remaining: quota.remaining,
      limit: quota.limit,
      unlimited: quota.unlimited,
      windowDays: quota.windowDays,
    });
  } catch (error) {
    console.error("Tryon quota fetch error:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت سهمیه پرو آنلاین" }, { status: 500 });
  }
}
