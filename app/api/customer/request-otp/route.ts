import { NextRequest, NextResponse } from "next/server";
import { requestCustomerOtp } from "@/app/lib/customer-auth";
import { describeSmsConfig } from "@/app/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const result = await requestCustomerOtp(phone);

    // اگر پیکربندی پیامک روی حالت console باشد، هیچ پیامکی ارسال نشده است؛
    // کاربر باید بداند که «ارسال شد» به معنای رسیدن پیامک نیست.
    if (result.channel === "console") {
      console.warn(`[MiniRoyal OTP] request-otp for ${phone} was NOT delivered by SMS (console mode).`);
      return NextResponse.json({
        success: true,
        channel: "console",
        message: "کد تایید تولید شد، ولی سرویس پیامک فعال نیست؛ کد فقط در لاگ سرور ثبت شده است.",
      });
    }

    console.info(`[MiniRoyal OTP] request-otp for ${phone} sent via ${result.channel} (${result.mode}).`);
    return NextResponse.json({ success: true, channel: result.channel, message: "کد تایید ارسال شد." });
  } catch (error) {
    // دلیل دقیق در لاگ سرور ثبت می‌شود؛ همین متن فارسی هم به کاربر برمی‌گردد.
    console.error("[MiniRoyal OTP] request-otp failed:", error);
    const config = describeSmsConfig();
    if (!config.configured) {
      console.error("[MiniRoyal OTP] پیکربندی پیامک ناقص است:", config.problems);
    }
    // بعضی خطاها (مثل AggregateError اتصال دیتابیس) message خالی دارند؛
    // در آن حالت پیام عمومی برمی‌گردانیم تا کاربر متن خالی نبیند.
    const detail = error instanceof Error ? error.message.trim() : "";
    return NextResponse.json(
      { success: false, error: detail || "ارسال کد تایید انجام نشد؛ لاگ سرور را بررسی کنید." },
      { status: 400 }
    );
  }
}
