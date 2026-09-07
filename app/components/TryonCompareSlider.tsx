"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { MoveHorizontal, Sparkles } from "lucide-react";

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
  beforeLabel = "عکس ارسالی شما",
  afterLabel = "تن‌خور آتلیه سلطنتی",
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
    <div className="flex flex-col gap-3">
      {/* هدر متالیک نوار مقایسه */}
      <div className="flex items-center justify-between px-2 text-xs font-black">
        <div className="flex items-center gap-2 rounded-full border border-stone-600/40 bg-stone-900/80 px-3 py-1 text-stone-300 backdrop-blur shadow-sm">
          <span className="size-2 rounded-full bg-stone-400" />
          <span>{beforeLabel}</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80 px-3.5 py-1 text-amber-300 backdrop-blur shadow-[0_0_15px_rgba(251,191,36,0.15)]">
          <Sparkles className="size-3 text-amber-400 animate-pulse" />
          <span>{afterLabel}</span>
        </div>
      </div>

      {/* فریم عکاسی اختصاصی آتلیه */}
      <div
        ref={containerRef}
        dir="ltr"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="group relative mx-auto aspect-[3/4] max-h-[660px] w-full max-w-xl cursor-ew-resize select-none overflow-hidden rounded-[16px] border-2 border-stone-800 bg-[#0a0a09] ring-1 ring-amber-500/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
      >
        {/* تصویر بعد (نتیجه پرو آتلیه - پس‌زمینه کامل) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt={`${afterLabel} - ${productTitle}`}
          className="absolute inset-0 size-full object-contain pointer-events-none"
        />

        {/* تصویر قبل (عکس کودک با برش داینامیک) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={`${beforeLabel} - ${productTitle}`}
          className="absolute inset-0 size-full object-contain pointer-events-none"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        />

        {/* خط جداکننده با بازتاب نوری */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-200 to-transparent shadow-[0_0_14px_rgba(251,191,36,0.9)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* دستگیرهٔ الماسی با افکت بازتاب نور (Diamond Handle with Light Reflection) */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing">
            {/* هاله نور درخشان پشت الماس */}
            <div className="absolute -inset-2 rounded-full bg-amber-400/30 blur-md animate-pulse" />

            {/* بدنه الماسی چرخیده ۴۵ درجه */}
            <div className="relative size-10 rotate-45 rounded-lg border-2 border-amber-200 bg-gradient-to-tr from-amber-700 via-amber-200 to-amber-500 shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(251,191,36,0.6)] transition-transform duration-200 hover:scale-110">
              {/* خط بازتاب نور نقره‌ای-طلایی روی وجه الماس */}
              <div className="absolute inset-1 rounded bg-stone-950/90 flex items-center justify-center">
                <div className="-rotate-45 text-amber-300">
                  <MoveHorizontal className="size-4 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* برچسب‌های متالیک شیک شناور روی تصویر */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-stone-500/50 bg-stone-950/80 px-3 py-1.5 text-[10px] font-black text-stone-200 shadow-lg backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-stone-400" />
          <span>{beforeLabel}</span>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-950/90 to-stone-950/90 px-3 py-1.5 text-[10px] font-black text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] backdrop-blur-md">
          <Sparkles className="size-3 text-amber-400" />
          <span>{afterLabel}</span>
        </div>
      </div>

      <p className="text-center text-[11px] font-bold text-stone-400">
        الماس طلایی را به چپ و راست حرکت دهید تا جزییات برش و فیت لباس در آتلیه رویال را ببینید.
      </p>
    </div>
  );
}
