import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import {
  listAdminReviews,
  updateReview,
  deleteReview,
} from "@/app/lib/reviews";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const reviews = await listAdminReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Admin reviews fetch failed:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت دیدگاه‌ها" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه دیدگاه الزامی است." }, { status: 400 });
    }

    await updateReview(id, {
      isApproved: typeof body.isApproved === "boolean" ? body.isApproved : undefined,
      adminReply: typeof body.adminReply === "string" ? body.adminReply : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin review update failed:", error);
    return NextResponse.json({ success: false, error: "خطا در ویرایش دیدگاه" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه معتبر نیست." }, { status: 400 });
    }

    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin review delete failed:", error);
    return NextResponse.json({ success: false, error: "خطا در حذف دیدگاه" }, { status: 500 });
  }
}
