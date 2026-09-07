"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "../lib/types/catalog";
import { calculateDiscountPercent, formatToman, toPersianDigits } from "../lib/utils";
import { PRODUCT_FALLBACKS } from "../lib/imageCatalog";
import { useCart } from "../lib/cart";

const ANGLE_LABELS = ["روبرو", "پشت", "تن‌خور", "جزییات", "زاویه دیگر"];

export default function ProductCard({ product }: { product: Product }) {
  const fallback =
    product.gender === "girl"
      ? PRODUCT_FALLBACKS.girl
      : product.categorySlug === "nozad"
      ? PRODUCT_FALLBACKS.baby
      : product.fitProfile?.garmentType === "outerwear"
      ? PRODUCT_FALLBACKS.outerwear
      : PRODUCT_FALLBACKS.boy;

  const images = [...new Set(product.images.filter(Boolean))];
  const gallery = images.length ? images : [fallback];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const quickVariant = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const isInStock = totalStock > 0;
  const discount = calculateDiscountPercent(product.basePrice, product.salePrice);
  const price = product.salePrice ?? product.basePrice;
  const tryOnHref = `/virtual-tryon?product=${encodeURIComponent(product.slug)}`;
  
  const currentImage = failedImages.includes(gallery[activeIndex]) ? fallback : gallery[activeIndex];
  const secondaryImage = gallery.length > 1 ? (failedImages.includes(gallery[1]) ? fallback : gallery[1]) : null;

  const handleQuickAdd = () => {
    if (!quickVariant || quickVariant.stock <= 0) return;
    addItem(product, quickVariant, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex flex-col min-w-0 rounded-[12px] bg-white transition duration-300">
      {/* فریمینگ سینمایی ادیتوریال ۳:۴ با گوشه ۱۲ پیکسل */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[12px] bg-[#f5f1eb] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
        <Link href={`/product/${product.slug}`} className="relative block size-full">
          {/* زاویه اصلی */}
          <img
            src={currentImage}
            alt={`${product.title} - تصویر ${activeIndex + 1}`}
            onError={() => setFailedImages((current) => [...new Set([...current, gallery[activeIndex]])])}
            className="editorial-image size-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* هاور روی زاویه دوم لباس (Hover Reveal) به صورت نرم و سینمایی */}
          {secondaryImage && activeIndex === 0 && (
            <img
              src={secondaryImage}
              alt={`${product.title} - زاویه دوم`}
              onError={() => setFailedImages((current) => [...new Set([...current, gallery[1]])])}
              className="absolute inset-0 size-full object-cover object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              loading="lazy"
            />
          )}
        </Link>

        {/* برچسب‌های ظریف و پرستیژ بالا */}
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            {discount > 0 && (
              <span className="rounded-md bg-stone-950/90 px-2 py-0.5 text-[10px] font-black text-amber-300 backdrop-blur-sm shadow-sm">
                -{toPersianDigits(discount)}٪
              </span>
            )}
            {product.isSpecialOffer && (
              <span className="rounded-md bg-amber-400/95 px-2 py-0.5 text-[10px] font-black text-stone-950 backdrop-blur-sm shadow-sm">
                پیشنهاد مزون
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="افزودن به علاقه‌مندی‌ها"
            className="pointer-events-auto grid size-8 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur-sm transition hover:bg-stone-950 hover:text-white"
          >
            <Heart className="size-3.5" />
          </button>
        </div>

        {/* دکمه شناور پروی آنلاین مینیاتوری در هاور */}
        <Link
          href={tryOnHref}
          className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-stone-950/90 px-3 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur-md opacity-0 transition duration-300 group-hover:opacity-100 hover:bg-amber-500 hover:text-stone-950"
        >
          <Sparkles className="size-3 text-amber-400" />
          <span>پرو آنلاین</span>
        </Link>
      </div>

      {/* عکاسی چند زاویه‌ای (Editorial Angle Strip) */}
      {gallery.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1 px-1">
          {gallery.map((img, idx) => {
            const isCurrent = activeIndex === idx;
            const label = ANGLE_LABELS[idx] || `زاویه ${idx + 1}`;
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIndex(idx);
                }}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition ${
                  isCurrent
                    ? "bg-stone-950 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
                title={`نمایش ${label}`}
              >
                <span className={`size-1 rounded-full ${isCurrent ? "bg-amber-400" : "bg-stone-400"}`} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* اطلاعات مینیمال با تگ‌های متمرکز و شیک */}
      <div className="flex flex-1 flex-col justify-between px-1 pt-3 pb-1" dir="rtl">
        <div>
          {/* تگ‌های ظریف وضعیت و ارسال */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            {isInStock ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800 border border-emerald-200/60">
                موجود در انبار
              </span>
            ) : (
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-500">
                سفارشی / تعداد محدود
              </span>
            )}
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
              ارسال با تیپاکس
            </span>
            <span className="mr-auto text-[10px] font-bold text-amber-800">
              ★ {toPersianDigits(product.ratingAvg.toFixed(1))}
            </span>
          </div>

          {/* نام محصول */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="mt-2 line-clamp-2 min-h-10 text-xs font-black leading-5 text-stone-900 transition group-hover:text-amber-800">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* بخش قیمت و اکشن‌ها */}
        <div className="mt-2 border-t border-stone-100 pt-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              {product.salePrice && (
                <span className="text-[10px] text-stone-400 line-through">
                  {formatToman(product.basePrice)}
                </span>
              )}
              <span className="text-sm font-black text-stone-950">
                {formatToman(price)}
              </span>
            </div>
            <Link
              href={`/product/${product.slug}`}
              className="text-[11px] font-black text-amber-800 hover:text-amber-900 transition"
            >
              جزئیات ←
            </Link>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!quickVariant || quickVariant.stock <= 0}
              onClick={handleQuickAdd}
              className="flex items-center justify-center gap-1 rounded-xl bg-stone-950 py-2 text-[10px] font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="size-3 text-amber-400" />
              {added ? "افزوده شد" : "افزودن سریع"}
            </button>
            <Link
              href={tryOnHref}
              className="flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-stone-50 py-2 text-[10px] font-black text-stone-800 transition hover:border-amber-500 hover:bg-amber-50"
            >
              <Sparkles className="size-3 text-amber-600" />
              پرو آتلیه
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
