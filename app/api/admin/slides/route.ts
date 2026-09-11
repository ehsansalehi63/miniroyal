import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { getHomeSlides, saveHomeSlides } from "@/app/lib/settings";
import { refreshProductCatalog } from "@/app/lib/revalidate";

export async function GET() {
  try {
    const slides = await getHomeSlides();
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    return NextResponse.json({ success: false, error: "خطا در دریافت اسلایدها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.slides)) {
      return NextResponse.json({ success: false, error: "قالب اسلایدها نامعتبر است." }, { status: 400 });
    }

    await saveHomeSlides(body.slides);
    refreshProductCatalog();
    return NextResponse.json({ success: true, message: "اسلایدر با موفقیت در دیتابیس بروز شد." });
  } catch (error) {
    console.error("Save slides failed:", error);
    return NextResponse.json({ success: false, error: "خطا در ذخیره اسلایدها" }, { status: 500 });
  }
}
