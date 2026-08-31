import { Product, SizeChartRow } from "./types/catalog";

export interface SmartFitInput {
  heightCm: number;
  weightKg: number;
  ageMonths: number;
  gender: "boy" | "girl" | "unisex";
  buyForGrowth: boolean;
}

export interface SmartFitResult {
  size: string;
  confidence: number;
  reasons: string[];
  chartRow?: SizeChartRow;
}

function numberFrom(value: string | undefined) {
  if (!value) return undefined;
  const match = value.replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function ageInRange(ageMonths: number, ageRange: string) {
  const values = ageRange.match(/\d+/g)?.map(Number) ?? [];
  if (values.length < 2) return true;
  return ageMonths >= values[0] * 12 && ageMonths <= values[1] * 12;
}

export function recommendSize(product: Product, input: SmartFitInput): SmartFitResult {
  const rows = product.sizeChartJson ?? [];
  const variants = product.variants.filter((variant) => variant.stock > 0);
  const availableSizes = new Set(variants.map((variant) => variant.size));

  const scored = rows
    .filter((row) => availableSizes.size === 0 || availableSizes.has(row.size))
    .map((row) => {
      const height = numberFrom(row.heightCm);
      const ageBonus = ageInRange(input.ageMonths, row.ageRange) ? 18 : 0;
      const heightDistance = height === undefined ? 40 : Math.abs(height - input.heightCm);
      let score = Math.max(0, 100 - heightDistance * 3) + ageBonus;

      if (input.buyForGrowth) {
        score -= height !== undefined && height < input.heightCm + 5 ? 8 : 0;
      }
      if (product.fitType === "tight") score -= 4;
      if (product.fitType === "loose") score += 3;

      return { row, score, heightDistance };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!scored) {
    const fallback = variants[0]?.size ?? "سایز نامشخص";
    return {
      size: fallback,
      confidence: 55,
      reasons: ["برای این محصول جدول اندازهٔ قابل استفاده ثبت نشده است."],
    };
  }

  const confidence = Math.max(62, Math.min(96, Math.round(scored.score)));
  const reasons = [
    `قد ${input.heightCm} سانتی‌متر با بازهٔ این سایز مقایسه شد.`,
    `سن ${Math.floor(input.ageMonths / 12)} سال و وزن ${input.weightKg} کیلوگرم در پیشنهاد لحاظ شد.`,
    product.fitType === "tight"
      ? "این مدل تن‌خور جذب دارد؛ در صورت تردید یک سایز بزرگ‌تر را بررسی کنید."
      : product.fitType === "loose"
        ? "این مدل تن‌خور آزاد دارد."
        : "نوع تن‌خور این مدل نرمال در نظر گرفته شده است.",
  ];
  if (input.buyForGrowth) reasons.push("گزینهٔ خرید برای رشد فعال است؛ فضای رشد در پیشنهاد لحاظ شد.");

  return { size: scored.row.size, confidence, reasons, chartRow: scored.row };
}
