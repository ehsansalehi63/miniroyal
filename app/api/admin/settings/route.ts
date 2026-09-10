import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { getStoreSettings, saveStoreSettings } from "@/app/lib/settings";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "settings.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Fetch settings failed:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت تنظیمات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "settings.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await saveStoreSettings(body);
    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد." });
  } catch (error) {
    console.error("Save settings failed:", error);
    return NextResponse.json({ success: false, error: "خطا در ذخیره تنظیمات" }, { status: 500 });
  }
}
