import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import {
  listCoupons,
  createCoupon,
  updateCouponStatus,
  deleteCoupon,
} from "@/app/lib/coupons";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const coupons = await listCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("Admin coupons fetch failed:", error);
    return NextResponse.json({ success: false, error: "خطا در دریافت کدهای تخفیف" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.code || typeof body.code !== "string" || !body.code.trim()) {
      return NextResponse.json({ success: false, error: "کد تخفیف الزامی است." }, { status: 400 });
    }
    if (!body.discountValue || Number(body.discountValue) <= 0) {
      return NextResponse.json({ success: false, error: "مقدار تخفیف باید بزرگتر از صفر باشد." }, { status: 400 });
    }

    const id = await createCoupon({
      code: body.code,
      discountType: body.discountType === "fixed" ? "fixed" : "percent",
      discountValue: Number(body.discountValue),
      minOrderAmount: Number(body.minOrderAmount || 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      expiresAt: body.expiresAt || null,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Admin coupon create failed:", error);
    const msg = error instanceof Error && error.message.includes("Duplicate entry")
      ? "این کد تخفیف قبلاً ثبت شده است."
      : "خطا در ثبت کد تخفیف جدید";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه کد تخفیف الزامی است." }, { status: 400 });
    }

    if (typeof body.isActive === "boolean") {
      await updateCouponStatus(id, body.isActive);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin coupon update failed:", error);
    return NextResponse.json({ success: false, error: "خطا در ویرایش کد تخفیف" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "orders.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه معتبر نیست." }, { status: 400 });
    }

    await deleteCoupon(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin coupon delete failed:", error);
    return NextResponse.json({ success: false, error: "خطا در حذف کد تخفیف" }, { status: 500 });
  }
}
