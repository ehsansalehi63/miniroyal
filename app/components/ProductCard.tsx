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
    <article className="group relative min-w-0 bg-white">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f2eee9]">
        <Link href={`/product/${product.slug}`} className="block size-full">
          <img src={currentImage} alt={`${product.title} - تصویر ${activeIndex + 1}`} onError={() => setFailedImages((current) => [...new Set([...current, gallery[activeIndex]])])} className="editorial-image size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        </Link>
        {gallery.length > 1 && <>
          <button type="button" aria-label="تصویر بعدی" onClick={(event) => { event.preventDefault(); moveImage(1); }} className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-sm transition hover:bg-stone-950 hover:text-white"><ChevronLeft className="size-4" /></button>
          <button type="button" aria-label="تصویر قبلی" onClick={(event) => { event.preventDefault(); moveImage(-1); }} className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-sm transition hover:bg-stone-950 hover:text-white"><ChevronRight className="size-4" /></button>
          <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-1.5 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm">
            {gallery.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`نمایش تصویر ${index + 1}`} onClick={(event) => { event.preventDefault(); setActiveIndex(index); }} className={`size-2 rounded-full transition ${index === activeIndex ? "bg-white ring-2 ring-white/40" : "bg-white/50 hover:bg-white/80"}`} />)}
            <span className="mr-1 text-[9px] font-bold text-white">{toPersianDigits(activeIndex + 1)} / {toPersianDigits(gallery.length)}</span>
          </div>
        </>}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between"><div className="flex gap-1">{discount > 0 && <span className="bg-white px-2.5 py-1 text-[10px] font-black text-stone-950">-{toPersianDigits(discount)}٪</span>}{product.isSpecialOffer && <span className="bg-amber-300 px-2.5 py-1 text-[10px] font-black text-stone-950">پیشنهاد</span>}</div><button type="button" aria-label="افزودن به علاقه‌مندی‌ها" className="grid size-9 place-items-center rounded-full bg-white/90 text-stone-800 transition hover:bg-stone-950 hover:text-white"><Heart className="size-4" /></button></div>
        <Link href={tryOnHref} className="absolute bottom-12 right-3 flex items-center gap-1.5 bg-stone-950/90 px-3 py-2 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100"><Sparkles className="size-3.5 text-amber-300" />پرو آنلاین</Link>
      </div>
      <div className="px-1 py-4" dir="rtl">
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{product.categoryName}</span><span className="text-[10px] font-bold text-amber-600">★ {toPersianDigits(product.ratingAvg.toFixed(1))}</span></div>
        <Link href={`/product/${product.slug}`}><h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-6 text-stone-900 transition group-hover:text-violet-700">{product.title}</h3></Link>
        <div className="mt-3 border-t border-stone-100 pt-3"><div className="flex items-end justify-between"><div>{product.salePrice && <span className="block text-[10px] text-stone-400 line-through">{formatToman(product.basePrice)}</span>}<span className="text-sm font-black text-stone-950">{formatToman(price)}</span></div><Link href={`/product/${product.slug}`} className="text-[11px] font-black text-violet-700">مشاهده ←</Link></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={!quickVariant || quickVariant.stock <= 0} onClick={handleQuickAdd} className="flex items-center justify-center gap-1 rounded-xl bg-stone-950 py-2.5 text-[10px] font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag className="size-3.5" />{added ? "اضافه شد" : "افزودن به سبد"}</button><Link href={tryOnHref} className="flex items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-[10px] font-black text-violet-800 transition hover:border-violet-700 hover:bg-violet-700 hover:text-white"><Sparkles className="size-3.5" />پرو آنلاین</Link></div>
        </div>
      </div>
    </article>
  );
}
