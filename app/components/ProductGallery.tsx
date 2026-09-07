"use client";

import { useState } from "react";
import { Camera, Eye, Layers } from "lucide-react";
import { toPersianDigits } from "../lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

const DEFAULT_ANGLE_NAMES = [
  "نمای روبرو",
  "نمای پشت",
  "تن‌خور اختصاصی",
  "جزییات بافت پارچه",
  "نمای زاویه‌دار",
  "نمای نزدیک",
];

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const activeImage = images[activeIndex] || images[0] || "";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {/* فریمینگ سینمایی ادیتوریال ۳:۴ با گوشه ۱۲ پیکسل */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[12px] border border-stone-200/80 bg-[#f7f4ef] shadow-sm cursor-crosshair select-none"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={activeImage}
          alt={`${title} - ${DEFAULT_ANGLE_NAMES[activeIndex] || "زاویه تصویر"}`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={600}
          height={800}
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
          className={`size-full object-cover object-center transition-transform duration-300 ease-out ${
            isZoomed ? "scale-[1.8]" : "scale-100"
          }`}
        />

        {/* برچسب زاویه فعال به سبک مجله‌ای */}
        <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-stone-950/80 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur-md shadow-sm">
          <Camera className="size-3 text-amber-400" />
          <span>{DEFAULT_ANGLE_NAMES[activeIndex] || `زاویه ${toPersianDigits(activeIndex + 1)}`}</span>
        </div>

        {/* راهنمای زوم لمسی / دسکتاپ */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md">
          <Eye className="size-3 text-white" />
          <span>حرکت ماوس برای زوم میکروسکوپی بافت</span>
        </div>
      </div>

      {/* عکاسی چند زاویه‌ای: نوار افقی و لمسی زیر تصویر (Editorial Angle Strip) */}
      {images.length > 1 && (
        <div className="space-y-2">
          {/* نوار قرص‌های دسترسی سریع بدون پرش */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {images.map((img, idx) => {
              const isCurrent = activeIndex === idx;
              const angleName = DEFAULT_ANGLE_NAMES[idx] || `زاویه ${idx + 1}`;
              return (
                <button
                  key={`tag-${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    isCurrent
                      ? "bg-stone-950 text-white shadow-sm ring-1 ring-amber-400/40"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <Layers className={`size-3 ${isCurrent ? "text-amber-400" : "text-stone-500"}`} />
                  <span>{angleName}</span>
                </button>
              );
            })}
          </div>

          {/* تصاویر بندانگشتی لمسی دقیق */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={`thumb-${img}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative aspect-[3/4] h-20 shrink-0 overflow-hidden rounded-[10px] border-2 transition ${
                  activeIndex === idx
                    ? "border-amber-600 shadow-md ring-2 ring-amber-200"
                    : "border-stone-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${title} - بندانگشتی ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  width={60}
                  height={80}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
