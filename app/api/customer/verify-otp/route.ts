import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerOtp } from "@/app/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    const verified = await verifyCustomerOtp(phone, code);
    return NextResponse.json(
      { success: verified, error: verified ? undefined : "کد تایید نادرست یا منقضی شده است." },
      { status: verified ? 200 : 400 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "تایید کد انجام نشد." }, { status: 400 });
  }
}
