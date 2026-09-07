"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { MoveHorizontal } from "lucide-react";

interface TryonCompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  productTitle: string;
}

export default function TryonCompareSlider({
  beforeImage,
  afterImage,
  beforeLabel = "عکس اصلی",
  afterLabel = "نتیجه پرو آنلاین",
  productTitle,
}: TryonCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-violet-200 px-1">
        <span className="flex items-center gap-1.5 text-stone-300">
          <span className="inline-block size-2 rounded-full bg-stone-400" />
          {beforeLabel}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="inline-block size-2 rounded-full bg-emerald-400" />
          {afterLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        dir="ltr"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative mx-auto aspect-[3/4] max-h-[640px] w-full max-w-xl cursor-ew-resize select-none overflow-hidden rounded-2xl border border-violet-400/30 bg-stone-900 shadow-2xl"
      >
        {/* تصویر بعد (نتیجه پرو - پس‌زمینه کامل) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt={`${afterLabel} - ${productTitle}`}
          className="absolute inset-0 size-full object-contain pointer-events-none"
        />

        {/* تصویر قبل (عکس کودک - با استفاده از clip-path بدون نیاز به خواندن ref در زمان رندر) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={`${beforeLabel} - ${productTitle}`}
          className="absolute inset-0 size-full object-contain pointer-events-none"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        />

        {/* خط جداکننده و دستگیره */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white shadow-lg pointer-events-auto cursor-grab active:cursor-grabbing">
            <MoveHorizontal className="size-4" />
          </div>
        </div>

        {/* برچسب‌های شناور روی تصویر */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-stone-950/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {beforeLabel}
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-emerald-950/80 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur">
          {afterLabel}
        </div>
      </div>

      <p className="text-center text-[11px] text-stone-400">
        دستگیره را به چپ و راست بکشید تا تفاوت تن‌خور را قبل و بعد از پرو مقایسه کنید.
      </p>
    </div>
  );
}
