import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { mediaLimits, storeImageBuffer } from "@/app/lib/media-storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) {
    return NextResponse.json({ success: false, error: "دسترسی آپلود تصویر ندارید." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "فایل تصویر ارسال نشده است." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ success: false, error: "فقط تصویر JPG، PNG یا WebP قابل استفاده است." }, { status: 400 });
    if (file.size > mediaLimits.maxSourceBytes) return NextResponse.json({ success: false, error: "حجم تصویر باید کمتر از ۸ مگابایت باشد." }, { status: 400 });

    const url = await storeImageBuffer(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ success: true, url, originalName: file.name, size: file.size, mediaType: "image" }, { status: 201 });
  } catch (error) {
    console.error("Product media upload error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "آپلود تصویر انجام نشد." }, { status: 500 });
  }
}
