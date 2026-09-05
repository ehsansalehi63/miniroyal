import { NextResponse } from "next/server";
import { getTipaxWallet, listTipaxAddresses, listTipaxCities, listTipaxPackaging, tipaxBaseUrl, tipaxConfigured } from "@/app/lib/tipax";

export const dynamic = "force-dynamic";

function count(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const item = value as { items?: unknown[]; entries?: unknown[]; data?: unknown[] };
    return item.items?.length ?? item.entries?.length ?? item.data?.length ?? null;
  }
  return null;
}

export async function GET() {
  if (!tipaxConfigured()) return NextResponse.json({ success: false, configured: false, error: "اطلاعات اتصال تیپاکس روی هاست کامل نیست." }, { status: 503 });
  try {
    const [cities, addresses, wallet, packaging] = await Promise.all([
      listTipaxCities(),
      listTipaxAddresses(),
      getTipaxWallet(),
      listTipaxPackaging(),
    ]);
    return NextResponse.json({
      success: true,
      configured: true,
      baseUrl: tipaxBaseUrl(),
      readOnly: true,
      resources: {
        cities: count(cities),
        addresses: count(addresses),
        packaging: count(packaging.packaging),
        contents: count(packaging.contents),
        walletAvailable: wallet !== null && wallet !== undefined,
      },
    });
  } catch (error) {
    console.error("Tipax health check failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ success: false, configured: true, error: "اتصال خواندنی تیپاکس انجام نشد. تنظیمات Base URL یا اعتبار حساب را بررسی کنید." }, { status: 502 });
  }
}
