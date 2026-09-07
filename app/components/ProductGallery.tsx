"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0] || "");
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* تصویر اصلی بزرگ با فریم لوکس ژورنالی */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-b from-[#f7f5f0] to-[#ece7de] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={activeImage}
          alt={title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ease-out ${
            isZoomed ? "scale-125 cursor-zoom-in" : "scale-100"
          }`}
        />
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-stone-950/60 px-3 py-1 text-[10px] font-semibold text-stone-200 backdrop-blur-md">
          🔍 برای بزرگ‌نمایی نشانگر را روی تصویر ببرید
        </div>
      </div>

      {/* لیست بندانگشتی‌ها با فریم تمیز */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative aspect-square size-18 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                activeImage === img
                  ? "border-stone-950 shadow-md ring-2 ring-amber-400/40"
                  : "border-stone-200 opacity-60 hover:opacity-100 hover:border-stone-400"
              }`}
            >
              <img src={img} alt={`${title} - ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
