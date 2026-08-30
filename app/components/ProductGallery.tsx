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
      {/* تصویر اصلی بزرگ با قابلیت زوم */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-stone-100 bg-stone-50 shadow-sm"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={activeImage}
          alt={title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 ${
            isZoomed ? "scale-125 cursor-zoom-in" : "scale-100"
          }`}
        />
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          🔍 برای زوم نشانه را روی تصویر ببر
        </div>
      </div>

      {/* لیست بندانگشتی‌ها */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative aspect-square size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                activeImage === img
                  ? "border-violet-600 shadow-md ring-2 ring-violet-200"
                  : "border-transparent opacity-70 hover:opacity-100"
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
