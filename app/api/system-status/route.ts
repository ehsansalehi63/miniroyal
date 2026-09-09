import { NextResponse } from "next/server";
import { describeSmsConfig } from "@/app/lib/sms";
import { isZarinpalSandbox } from "@/app/lib/payment";
import { describeTryonWiring, getBuildInfo } from "@/app/lib/build-info";
import { getLastDeployStatus } from "@/app/lib/deploy";

export async function GET() {
  const smsConfig = describeSmsConfig();
  const [buildInfo, lastDeploy] = await Promise.all([getBuildInfo(), getLastDeployStatus()]);
  return NextResponse.json({
    version: "1.2.0",
    buildDate: "2026-08-29",
    buildTime: new Date().toISOString(),
    status: "online",
    // Which commit is REALLY serving traffic (written at build time) + the
    // last webhook-deploy record. Compare `deployment.commit` with GitHub
    // `main` HEAD to prove a deploy picked up the latest code.
    deployment: {
      commit: buildInfo.commit,
      branch: buildInfo.branch,
      builtAt: buildInfo.builtAt,
      lastWebhookDeploy: lastDeploy
        ? {
          commit: lastDeploy.commit?.slice(0, 7) || null,
          branch: lastDeploy.branch,
          status: lastDeploy.status,
          completedAt: lastDeploy.completedAt || null,
        }
        : null,
    },
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
      // AI try-on wiring: key PRESENCE booleans + model name only (no secrets).
      aiTryon: describeTryonWiring(),
    },
  });
}
