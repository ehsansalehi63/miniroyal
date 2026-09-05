"use client";

import { useEffect, useState } from "react";
import { PRODUCT_FALLBACKS } from "../lib/imageCatalog";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

/**
 * تصویر جایگزین وقتی محصول هیچ رسانه‌ای ندارد یا فایل رسانه پاک/خراب شده است.
 * پیش از این در این حالت یک کادر خاکستری خالی (یا آیکن تصویر شکسته) نمایش داده می‌شد.
 */
const FALLBACK_IMAGE = PRODUCT_FALLBACKS.boy;

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const gallery = images.filter((image) => typeof image === "string" && image.trim().length > 0);
  const [activeImage, setActiveImage] = useState(gallery[0] || FALLBACK_IMAGE);
  const [isZoomed, setIsZoomed] = useState(false);
  const [brokenImages, setBrokenImages] = useState<string[]>([]);

  // اگر محصول (مثلاً بعد از ویرایش در پنل) تصویر دیگری گرفت، تصویر فعال هم به‌روز شود.
  useEffect(() => {
    setActiveImage(gallery[0] || FALLBACK_IMAGE);
    setBrokenImages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.join("|")]);

  const safeSrc = (url: string) => (brokenImages.includes(url) ? FALLBACK_IMAGE : url);
  const markBroken = (url: string) => setBrokenImages((current) => (current.includes(url) ? current : [...current, url]));

  return (
    <div className="flex flex-col gap-4">
      {/* تصویر اصلی بزرگ با قابلیت زوم */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-stone-100 bg-stone-50 shadow-sm"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={safeSrc(activeImage)}
          alt={title}
          onError={() => markBroken(activeImage)}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ${
            isZoomed ? "scale-125 cursor-zoom-in" : "scale-100"
          }`}
        />
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          🔍 برای زوم نشانه را روی تصویر ببر
        </div>
      </div>

      {/* لیست بندانگشتی‌ها */}
      {gallery.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {gallery.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => setActiveImage(img)}
              className={`relative aspect-square size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                activeImage === img
                  ? "border-violet-600 shadow-md ring-2 ring-violet-200"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={safeSrc(img)}
                alt={`${title} - ${idx + 1}`}
                onError={() => markBroken(img)}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
