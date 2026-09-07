"use client";

import { ProductReview } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";

interface SizeFitIndicatorProps {
  reviews?: ProductReview[];
}

export default function SizeFitIndicator({ reviews = [] }: SizeFitIndicatorProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-xs text-stone-500">
        💡 بر اساس جدول سایز، سایز دقیق را انتخاب کنید. اولین خریدار باشید و بازخورد سایز بدهید!
      </div>
    );
  }

  const smallCount = reviews.filter((r) => r.sizeFit === "small").length;
  const perfectCount = reviews.filter((r) => r.sizeFit === "perfect").length;
  const largeCount = reviews.filter((r) => r.sizeFit === "large").length;
  const total = reviews.length;

  const perfectPercent = Math.round((perfectCount / total) * 100);
  const smallPercent = Math.round((smallCount / total) * 100);
  const largePercent = Math.round((largeCount / total) * 100);

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <div className="flex items-center justify-between text-xs font-bold text-stone-800">
        <span>بازخورد سایز خریداران ({toPersianDigits(total)} نظر)</span>
        <span className="text-violet-700">{toPersianDigits(perfectPercent)}٪ گفته‌اند سایز دقیق است</span>
      </div>

      {/* نوار فیت */}
      <div className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-stone-200">
        <div
          style={{ width: `${smallPercent}%` }}
          className="bg-amber-400"
          title={`کوچک: ${smallPercent}%`}
        />
        <div
          style={{ width: `${perfectPercent}%` }}
          className="bg-emerald-500"
          title={`مناسب: ${perfectPercent}%`}
        />
        <div
          style={{ width: `${largePercent}%` }}
          className="bg-sky-500"
          title={`گشاد: ${largePercent}%`}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] font-semibold text-stone-600">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-400" /> کوچک ({toPersianDigits(smallPercent)}٪)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> کاملاً مناسب ({toPersianDigits(perfectPercent)}٪)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-sky-500" /> گشاد/بزرگ ({toPersianDigits(largePercent)}٪)
        </span>
      </div>
    </div>
  );
}
