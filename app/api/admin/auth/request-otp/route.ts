import { NextRequest, NextResponse } from "next/server";
import { requestAdminOtp } from "@/app/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await requestAdminOtp(typeof body.phone === "string" ? body.phone : "");
    return NextResponse.json({ success: true, channel: result.channel, message: result.channel === "console" ? "کد فقط در لاگ سرور ثبت شد." : "کد ورود مدیر ارسال شد." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "ارسال کد ورود مدیر انجام نشد." }, { status: 400 });
  }
}
