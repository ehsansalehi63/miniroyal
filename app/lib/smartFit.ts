import { Product, SizeChartRow } from "./types/catalog";

export interface SmartFitInput {
  heightCm: number;
  weightKg: number;
  ageMonths: number;
  gender: "boy" | "girl" | "unisex";
  buyForGrowth: boolean;
  chestCm?: number;
  waistCm?: number;
}

export interface SmartFitResult {
  size: string;
  confidence: number;
  reasons: string[];
  chartRow?: SizeChartRow;
}

function numbersFrom(value: string | undefined) {
  if (!value) return undefined;
  const values = value.replace(",", ".").match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (!values?.length) return undefined;
  return values.length > 1 ? (values[0] + values[1]) / 2 : values[0];
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

  const scoredRows = rows
    .filter((row) => availableSizes.size === 0 || availableSizes.has(row.size))
    .map((row) => {
      const height = numbersFrom(row.heightCm);
      const chest = numbersFrom(row.chestCm);
      const waist = numbersFrom(row.waistCm);
      const ageBonus = ageInRange(input.ageMonths, row.ageRange) ? 18 : 0;
      const heightDistance = height === undefined ? 40 : Math.abs(height - input.heightCm);
      const chestTarget = input.chestCm ?? input.weightKg * 1.9 + 22;
      const chestDistance = chest === undefined ? 0 : Math.abs(chest - chestTarget);
      const waistDistance = input.waistCm === undefined || waist === undefined ? 0 : Math.abs(waist - input.waistCm);

      // Height is the strongest signal for children's sizing; chest and waist
      // then refine the choice against the actual product chart. This avoids
      // treating weight as a direct clothing measurement.
      let score = Math.max(
        0,
        100 - heightDistance * 3.2 - chestDistance * 2.4 - waistDistance * 1.4
      ) + ageBonus;

      if (input.buyForGrowth) {
        score -= height !== undefined && height < input.heightCm + 5 ? 8 : 0;
      }
      if (product.fitType === "tight") score -= 4;
      if (product.fitType === "loose") score += 3;
      if (product.fitProfile) {
        score += Math.max(0, 8 - Math.abs(product.fitProfile.easeCm - (product.fitType === "tight" ? 4 : product.fitType === "loose" ? 10 : 7)));
      }

      return { row, score, heightDistance, chestDistance, waistDistance };
    })
    .sort((a, b) => b.score - a.score);

  const scored = scoredRows[0];

  if (!scored) {
    const fallback = variants[0]?.size ?? "سایز نامشخص";
    return {
      size: fallback,
      confidence: 55,
      reasons: ["برای این محصول جدول اندازهٔ قابل استفاده ثبت نشده است."],
    };
  }

  const runnerUp = scoredRows[1];
  const separation = runnerUp ? Math.max(0, scored.score - runnerUp.score) : 12;
  const confidence = Math.max(
    62,
    Math.min(97, Math.round(Math.max(0, Math.min(100, scored.score)) + Math.min(8, separation)))
  );
  const reasons = [
    `قد ${input.heightCm} سانتی‌متر با بازهٔ این سایز مقایسه شد.`,
    `سن ${Math.floor(input.ageMonths / 12)} سال، وزن ${input.weightKg} کیلوگرم${input.chestCm ? `، دور سینه ${input.chestCm} سانتی‌متر` : ""}${input.waistCm ? ` و دور کمر ${input.waistCm} سانتی‌متر` : ""} در پیشنهاد لحاظ شد.`,
    product.fitType === "tight"
      ? "این مدل تن‌خور جذب دارد؛ در صورت تردید یک سایز بزرگ‌تر را بررسی کنید."
      : product.fitType === "loose"
        ? "این مدل تن‌خور آزاد دارد."
        : "نوع تن‌خور این مدل نرمال در نظر گرفته شده است.",
  ];
  if (input.buyForGrowth) reasons.push("گزینهٔ خرید برای رشد فعال است؛ فضای رشد در پیشنهاد لحاظ شد.");

  return { size: scored.row.size, confidence, reasons, chartRow: scored.row };
}
