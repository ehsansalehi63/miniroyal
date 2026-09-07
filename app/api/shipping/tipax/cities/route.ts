import { NextResponse } from "next/server";
import { listTipaxCities, tipaxConfigured } from "@/app/lib/tipax";
import { tipaxProvinceName } from "@/app/lib/provinces";
import { IRAN_PROVINCES } from "@/app/lib/iranCities";

export const dynamic = "force-dynamic";

function getStandardFallbackCities() {
  let idCounter = 1;
  const cities: { id: number; name: string; province: string; provinceId: number }[] = [];
  const provinces: string[] = [];

  for (const prov of IRAN_PROVINCES) {
    provinces.push(prov.name);
    const pId = idCounter * 100;
    for (const cityName of prov.cities) {
      cities.push({
        id: idCounter++,
        name: cityName,
        province: prov.name,
        provinceId: pId,
      });
    }
  }

  return { provinces: provinces.sort((a, b) => a.localeCompare(b, "fa")), cities };
}

export async function GET() {
  if (tipaxConfigured()) {
    try {
      const raw = await listTipaxCities();
      const rows = Array.isArray(raw) ? raw : [];
      const cities = rows
        .map((row) => {
          const item = row as { title?: string; stateId?: number | string; id?: number };
          return {
            id: Number(item.id || 0),
            name: String(item.title || "").trim().replace(/ي/g, "ی").replace(/ك/g, "ک"),
            province: tipaxProvinceName(item.stateId),
            provinceId: item.stateId !== null && item.stateId !== undefined ? Number(item.stateId) : 0,
          };
        })
        .filter((item) => item.id > 0 && item.name && item.province);

      if (cities.length > 0) {
        const provinces = [...new Set(cities.map((item) => item.province))].sort((a, b) => a.localeCompare(b, "fa"));
        return NextResponse.json({ success: true, provinces, cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
      }
    } catch (error) {
      console.warn("Tipax cities API warning, using standard Iran cities list:", error instanceof Error ? error.message : "error");
    }
  }

  // اگر تیپاکس آنلاین وصل نبود یا خطا داد، فهرست جامع تمام شهرهای ایران ارسال می‌شود
  const fallback = getStandardFallbackCities();
  return NextResponse.json({ success: true, provinces: fallback.provinces, cities: fallback.cities }, { headers: { "Cache-Control": "public, max-age=3600" } });
}

