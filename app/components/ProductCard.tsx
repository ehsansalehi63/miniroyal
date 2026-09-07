"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "../lib/types/catalog";
import { calculateDiscountPercent, formatToman, toPersianDigits } from "../lib/utils";
import { PRODUCT_FALLBACKS } from "../lib/imageCatalog";
import { useCart } from "../lib/cart";

export default function ProductCard({ product }: { product: Product }) {
  const fallback = product.gender === "girl" ? PRODUCT_FALLBACKS.girl : product.categorySlug === "nozad" ? PRODUCT_FALLBACKS.baby : product.fitProfile?.garmentType === "outerwear" ? PRODUCT_FALLBACKS.outerwear : PRODUCT_FALLBACKS.boy;
  const images = [...new Set(product.images.filter(Boolean))];
  const gallery = images.length ? images : [fallback];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const quickVariant = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const discount = calculateDiscountPercent(product.basePrice, product.salePrice);
  const price = product.salePrice ?? product.basePrice;
  const tryOnHref = `/virtual-tryon?product=${encodeURIComponent(product.slug)}`;
  const currentImage = failedImages.includes(gallery[activeIndex]) ? fallback : gallery[activeIndex];

  const moveImage = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + gallery.length) % gallery.length);
  };

  const handleQuickAdd = () => {
    if (!quickVariant || quickVariant.stock <= 0) return;
    addItem(product, quickVariant, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-[0_4px_20px_-4px_rgba(40,24,12,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-700/30 hover:shadow-[0_16px_32px_-8px_rgba(40,24,12,0.12)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#f7f5f0] to-[#ece7de]">
        <Link href={`/product/${product.slug}`} className="block size-full">
          <img
            src={currentImage}
            alt={`${product.title} - تصویر ${activeIndex + 1}`}
            onError={() => setFailedImages((current) => [...new Set([...current, gallery[activeIndex]])])}
            className="editorial-image size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              aria-label="تصویر بعدی"
              onClick={(event) => { event.preventDefault(); moveImage(1); }}
              className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-sm opacity-0 transition-all duration-200 hover:bg-stone-950 hover:text-white group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="تصویر قبلی"
              onClick={(event) => { event.preventDefault(); moveImage(-1); }}
              className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-sm opacity-0 transition-all duration-200 hover:bg-stone-950 hover:text-white group-hover:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-1.5 rounded-full bg-stone-950/40 px-2.5 py-1 backdrop-blur-md">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  aria-label={`نمایش تصویر ${index + 1}`}
                  onClick={(event) => { event.preventDefault(); setActiveIndex(index); }}
                  className={`size-1.5 rounded-full transition-all duration-200 ${index === activeIndex ? "w-4 bg-amber-300" : "bg-white/60 hover:bg-white"}`}
                />
              ))}
              <span className="mr-1 text-[9px] font-bold text-stone-200">
                {toPersianDigits(activeIndex + 1)} / {toPersianDigits(gallery.length)}
              </span>
            </div>
          </>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1 pointer-events-auto">
            {discount > 0 && (
              <span className="rounded-md bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                -{toPersianDigits(discount)}٪
              </span>
            )}
            {product.isSpecialOffer && (
              <span className="rounded-md border border-amber-400/40 bg-amber-400/90 px-2 py-0.5 text-[10px] font-black text-stone-950 shadow-sm backdrop-blur-sm">
                پیشنهاد ویژه
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            className="pointer-events-auto grid size-8 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm transition hover:bg-stone-950 hover:text-white"
          >
            <Heart className="size-4" />
          </button>
        </div>
        <Link
          href={tryOnHref}
          className="absolute bottom-12 right-3 flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-stone-950/90 px-3 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-stone-900"
        >
          <Sparkles className="size-3.5 text-amber-300" />
          پرو هوشمند
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4" dir="rtl">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-stone-600">
            <span className="tracking-wide text-stone-600 font-semibold">{product.categoryName}</span>
            <span className="flex items-center gap-0.5 text-amber-800 font-bold">
              ★ {toPersianDigits(product.ratingAvg.toFixed(1))}
            </span>
          </div>
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="mt-1.5 line-clamp-2 min-h-10 text-xs font-black leading-5 text-stone-950 transition hover:text-amber-800 sm:text-sm sm:leading-6">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="mt-3 border-t border-stone-100 pt-3">
          <div className="flex items-baseline justify-between">
            <div>
              {product.salePrice && (
                <span className="block text-[11px] font-medium text-stone-500 line-through">
                  {formatToman(product.basePrice)}
                </span>
              )}
              <span className="text-sm font-black text-stone-950 sm:text-base">
                {formatToman(price)}
              </span>
            </div>
            <Link
              href={`/product/${product.slug}`}
              className="text-[11px] font-black text-stone-900 hover:text-amber-800 transition"
            >
              مشاهده ←
            </Link>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!quickVariant || quickVariant.stock <= 0}
              onClick={handleQuickAdd}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-950 py-2.5 text-[11px] font-bold text-white transition hover:bg-violet-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="size-3.5" />
              {added ? "افزوده شد" : "افزودن سریع"}
            </button>
            <Link
              href={tryOnHref}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 py-2.5 text-[11px] font-bold text-stone-800 transition hover:border-amber-600/40 hover:bg-amber-50/50 hover:text-amber-900 active:scale-95"
            >
              <Sparkles className="size-3.5 text-amber-600" />
              پرو سایز
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
