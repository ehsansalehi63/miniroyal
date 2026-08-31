"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "../lib/types/catalog";
import { calculateDiscountPercent, formatToman, toPersianDigits } from "../lib/utils";
import { PRODUCT_FALLBACKS } from "../lib/imageCatalog";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const fallbackImg =
    product.gender === "girl"
      ? PRODUCT_FALLBACKS.girl
      : product.categorySlug === "nozad"
      ? PRODUCT_FALLBACKS.baby
      : product.fitProfile?.garmentType === "outerwear"
      ? PRODUCT_FALLBACKS.outerwear
      : PRODUCT_FALLBACKS.boy;

  const [imgSrc, setImgSrc] = useState(product.images[0] || fallbackImg);

  const discountPercent = calculateDiscountPercent(
    product.basePrice,
    product.salePrice
  );
  const currentPrice = product.salePrice ?? product.basePrice;

  // Extract unique available sizes
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl font-sans dir-rtl">
      {/* تصویر و نشان‌ها */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-100">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={imgSrc}
            alt={product.title}
            onError={() => setImgSrc(fallbackImg)}
            className="editorial-image h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* نشان تخفیف */}
        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 z-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-1 text-xs font-black text-white shadow-md">
            %{toPersianDigits(discountPercent)} تخفیف
          </span>
        )}

        {/* نشان ویژه */}
        {product.isSpecialOffer && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-amber-950 shadow-md">
            🔥 پیشنهاد ویژه
          </span>
        )}

        {/* دکمه سریع پرو آنلاین */}
        <Link
          href={`/product/${product.slug}?tryon=true`}
          className="absolute bottom-3 left-3 z-10 flex size-9 items-center justify-center rounded-2xl bg-white/90 text-violet-700 backdrop-blur-md shadow-md transition hover:bg-violet-700 hover:text-white"
          title="پرو آنلاین لباس کودک"
        >
          👗
        </Link>
      </div>

      {/* محتوا و قیمت */}
      <div className="flex flex-1 flex-col p-3">
        {/* دسته و امتیاز */}
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-extrabold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-lg">
            {product.categoryName}
          </span>
          <div className="flex items-center gap-1 font-bold text-amber-500">
            <span>★</span>
            <span>{toPersianDigits(product.ratingAvg.toFixed(1))}</span>
            <span className="text-stone-400 text-[10px]">
              ({toPersianDigits(product.ratingCount)})
            </span>
          </div>
        </div>

        {/* عنوان */}
        <Link href={`/product/${product.slug}`} className="group-hover:text-violet-700">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-6 text-stone-900">
            {product.title}
          </h3>
        </Link>

        {/* پیش‌نمایش سایزها */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {sizes.slice(0, 4).map((size) => (
            <span
              key={size}
              className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600"
            >
              {size}
            </span>
          ))}
          {sizes.length > 4 && (
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-400">
              +{toPersianDigits(sizes.length - 4)}
            </span>
          )}
        </div>

        {/* قیمت */}
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-baseline justify-between">
          <div>
            {product.salePrice && (
              <span className="block text-[11px] text-stone-400 line-through">
                {formatToman(product.basePrice)}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-stone-950">
              {formatToman(currentPrice)}
            </span>
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="rounded-xl bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-violet-800"
          >
            مشاهده
          </Link>
        </div>
      </div>
    </div>
  );
}
