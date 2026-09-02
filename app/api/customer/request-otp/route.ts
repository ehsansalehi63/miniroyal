import { NextRequest, NextResponse } from "next/server";
import { requestCustomerOtp } from "@/app/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    await requestCustomerOtp(phone);
    return NextResponse.json({ success: true, message: "کد تایید ارسال شد." });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "ارسال کد تایید انجام نشد." },
      { status: 400 }
    );
  }
}
