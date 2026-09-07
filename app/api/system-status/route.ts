import { NextResponse } from "next/server";
import { describeSmsConfig } from "@/app/lib/sms";
import { isZarinpalSandbox } from "@/app/lib/payment";

export async function GET() {
  const smsConfig = describeSmsConfig();
  return NextResponse.json({
    version: "1.2.0",
    buildDate: "2026-08-29",
    buildTime: new Date().toISOString(),
    status: "online",
    // توجه: Next.js/Turbopack عبارت process.env.NODE_ENV را هنگام build به مقدار ثابت
    // جایگزین می‌کند (حتی با Reflect.get یا دسترسی براکتی)، پس این عدد محیطِ «بیلد» است،
    // نه متغیر محیطی واقعیِ پروسه. برای مقدار واقعیِ پروسه از /proc/<pid>/environ استفاده کنید.
    buildEnvironment: process.env.NODE_ENV,
    site: "miniroyal.shop",
    features: {
      // قبلاً همیشه true بود؛ حالا وضعیت واقعی پیکربندی پیامک گزارش می‌شود.
      smsGateway: smsConfig.configured,
      smsProvider: smsConfig.rawProvider || null,
      smsMode: smsConfig.mode,
      zarinpalSandbox: isZarinpalSandbox(),
      customAdminPassword: true,
      userAuthSession: true,
    },
  });
}
