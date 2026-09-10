import { NextRequest, NextResponse } from "next/server";
import { listCustomers, updateCustomer } from "@/app/lib/orders";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "customers.read")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    return NextResponse.json({ success: true, customers: await listCustomers() });
  } catch (error) {
    console.error("Admin customers failed:", error);
    return NextResponse.json({ success: false, error: "دریافت مشتری‌ها از دیتابیس ممکن نیست." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "customers.write")) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ success: false, error: "شناسه مشتری نامعتبر است." }, { status: 400 });
    }

    await updateCustomer(id, {
      role: typeof body.role === "string" ? body.role : undefined,
      clubTier: typeof body.clubTier === "string" ? body.clubTier : undefined,
      points: typeof body.points === "number" ? body.points : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });

    return NextResponse.json({ success: true, message: "اطلاعات مشتری بروز شد." });
  } catch (error) {
    console.error("Admin customer update failed:", error);
    return NextResponse.json({ success: false, error: "بروزرسانی مشخصات مشتری انجام نشد." }, { status: 500 });
  }
}
