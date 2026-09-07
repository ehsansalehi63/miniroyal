"use client";

import { Sparkles, Tag, Eye } from "lucide-react";
import { formatToman, toPersianDigits, calculateDiscountPercent } from "../lib/utils";

interface Props {
  title: string;
  categoryName: string;
  basePrice: number;
  salePrice?: number | null;
  image?: string;
  isFeatured?: boolean;
  isSpecialOffer?: boolean;
  status?: string;
  totalStock?: number;
}

export default function ProductLivePreviewCard({
  title,
  categoryName,
  basePrice,
  salePrice,
  image,
  isFeatured = false,
  isSpecialOffer = false,
  status = "active",
  totalStock = 1,
}: Props) {
  const displayImage = image && image.trim() ? image : "/images/products/boy-hoodie.svg";
  const discount = calculateDiscountPercent(basePrice, salePrice ?? basePrice);
  const finalPrice = salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
  const hasDiscount = discount > 0;
  const isOutOfStock = totalStock <= 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-sm" dir="rtl">
      <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
          <Eye className="size-4 text-amber-600" />
          <span>پیش‌نمایش زنده در فروشگاه</span>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          نمای واقعی مشتری
        </span>
      </div>

      <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
        {/* تصویر ۳:۴ */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f1eb]">
          <img
            src={displayImage}
            alt={title || "پیش‌نمایش محصول"}
            className="size-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/products/boy-hoodie.svg";
            }}
          />

          {/* برچسب‌های وضعیت */}
          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1 pointer-events-none">
            <div className="flex flex-col gap-1">
              {isFeatured && (
                <span className="flex items-center gap-0.5 rounded-md bg-stone-900/85 px-1.5 py-0.5 text-[9px] font-black text-amber-300 backdrop-blur-sm shadow-sm">
                  <Sparkles className="size-2.5" />
                  صفحه اصلی
                </span>
              )}
              {isSpecialOffer && (
                <span className="flex items-center gap-0.5 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-black text-white backdrop-blur-sm shadow-sm">
                  <Tag className="size-2.5" />
                  پیشنهاد ویژه
                </span>
              )}
            </div>

            {hasDiscount && (
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                {toPersianDigits(discount)}٪
              </span>
            )}
          </div>

          {/* وضعیت انتشار و موجودی */}
          {isOutOfStock ? (
            <div className="absolute inset-x-0 bottom-0 bg-stone-900/80 py-1 text-center text-[10px] font-bold text-stone-200">
              ناموجود در انبار
            </div>
          ) : status !== "active" ? (
            <div className="absolute inset-x-0 bottom-0 bg-amber-700/85 py-1 text-center text-[10px] font-bold text-white">
              {status === "draft" ? "پیش‌نویس (غیرقابل مشاهده)" : status}
            </div>
          ) : null}
        </div>

        {/* مشخصات و قیمت */}
        <div className="p-3">
          <span className="text-[10px] font-bold text-amber-800">
            {categoryName || "دسته‌بندی"}
          </span>
          <h4 className="mt-1 line-clamp-1 text-xs font-black text-stone-900">
            {title ? title : "عنوان کالا اینجا نمایش داده می‌شود..."}
          </h4>

          <div className="mt-2.5 flex items-end justify-between">
            <div>
              {hasDiscount && (
                <span className="block text-[10px] text-stone-400 line-through">
                  {formatToman(basePrice)}
                </span>
              )}
              <span className="text-xs font-black text-stone-900">
                {formatToman(finalPrice)}
              </span>
            </div>

            <span className="rounded-lg bg-stone-950 px-2.5 py-1 text-[10px] font-bold text-white">
              مشاهده
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
