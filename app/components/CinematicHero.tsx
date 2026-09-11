"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import type { HomeSlide } from "../lib/homeConfig";

interface CinematicHeroProps {
  slides: HomeSlide[];
  /** اگر فایل ویدیوی لوکال موجود باشد */
  videoSrc?: string | null;
}

/**
 * هیروی سینمایی مینی رویال
 *
 * به‌جای مدل سه‌بعدی سنگین (GLB ده‌مگابایتی + model-viewer + three) یک صحنهٔ
 * استودیویی سینمایی ساخته شده از همان عکس‌های لوکال کاتالوگ:
 *   • پس‌زمینهٔ استودیو با نور متمرکز، کف بازتابنده و اشعهٔ نور
 *   • نام و لوگوی سایت به‌صورت سه‌بعدی پشت سوژه
 *   • عکس کودک با حرکت آرام Ken Burns داخل قاب فیلم، همراه بازتاب کف
 *   • گرین فیلم، وینیت و نوارهای سینمایی
 *
 * اگر public/video/hero.mp4 (یا hero.webm) وجود داشته باشد، همان ویدیو پخش
 * می‌شود و این صحنه فقط به‌عنوان poster/جایگزین باقی می‌ماند.
 */
export default function CinematicHero({ slides, videoSrc }: CinematicHeroProps) {
  void videoSrc;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const total = slides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || total < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % total), 7000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, total]);

  const go = useCallback(
    (offset: number) => setIndex((value) => (value + offset + total) % total),
    [total]
  );

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  const toPersianDigits = (num: number | string) =>
    String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        go(-1);
      } else {
        go(1);
      }
    }
    setTouchStartX(null);
  };

  return (
    <section
      dir="rtl"
      aria-roledescription="carousel"
      aria-label="کالکشن‌های مینی رویال"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="hero-stage relative mx-auto site-container overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border border-stone-800/80 bg-[#080706] text-white shadow-xl p-0"
    >
      {/* ── ۱. عکس‌های اسلایدر با انیمیشن ملایم Ken Burns (پوشش کامل ۱۰۰٪ کادر بدون فضای سیاه) ── */}
      {slides.map((item, itemIndex) => (
        <img
          key={item.id}
          src={item.image}
          alt={`${item.title} — ${item.subtitle}`}
          width={1280}
          height={720}
          decoding="async"
          loading={itemIndex === 0 ? "eager" : "lazy"}
          fetchPriority={itemIndex === 0 ? "high" : "auto"}
          className={`hero-media hero-kenburns ${itemIndex === index ? "is-active" : ""}`}
        />
      ))}

      {/* ── ۲. گرادینت تاریک جهت کنتراست و خوانایی بی‌نقص متن‌ها روی عکس ── */}
      {/* در موبایل: گرادینت از پایین به بالا */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-55% to-black/20 lg:hidden pointer-events-none z-10" />

      {/* در دسکتاپ: گرادینت از سمت راست (RTL) جهت خوانایی متن و نمایش عالی مدل در سمت چپ */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-l from-black/95 via-black/60 via-45% to-transparent pointer-events-none z-10" />

      {/* وینیت محیطی ملایم */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]" />

      {/* ── ۳. دکمه‌های ناوبری دستی اسلاید (قبلی / بعدی) ── */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        aria-label="اسلاید قبلی"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 grid size-8 sm:size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 hover:border-amber-400/80 shadow-md active:scale-90 transition"
      >
        <ChevronRight className="size-4 sm:size-5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(1); }}
        aria-label="اسلاید بعدی"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 grid size-8 sm:size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 hover:border-amber-400/80 shadow-md active:scale-90 transition"
      >
        <ChevronLeft className="size-4 sm:size-5" />
      </button>

      {/* ── ۴. لایه رابط کاربری موبایل و تبلت (lg:hidden) ── */}
      <div className="lg:hidden absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-5 pointer-events-none">
        {/* بالای اسلاید: نشان کالکشن و شمارنده */}
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-black/60 px-2.5 py-1 text-[11px] font-black text-amber-300 backdrop-blur-md shadow-md">
            <span>✨</span>
            <span>{slide.badge}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-stone-300 backdrop-blur-md">
            <span>{toPersianDigits(index + 1)} از {toPersianDigits(total)}</span>
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? "پخش خودکار اسلایدها" : "توقف اسلایدها"}
              className="hover:text-amber-300 transition"
            >
              {paused ? <Play className="size-2.5" /> : <Pause className="size-2.5" />}
            </button>
          </div>
        </div>

        {/* پایین اسلاید: عناوین و دکمه‌های فراخوان چسبیده به عکس */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto">
          <h2 className="text-base sm:text-xl font-black text-white leading-tight drop-shadow-md">
            {slide.title}
          </h2>
          <p className="text-[11px] sm:text-xs text-stone-200 line-clamp-1 max-w-sm drop-shadow font-medium">
            {slide.subtitle}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Link
                href="/virtual-tryon"
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-3 py-2 text-[11px] sm:text-xs font-black text-stone-950 shadow-md shadow-amber-500/25 active:scale-95 border border-amber-300"
              >
                <Sparkles className="size-3 text-stone-950 shrink-0" />
                <span className="whitespace-nowrap">پرو آنلاین هوشمند</span>
              </Link>
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs active:scale-95 backdrop-blur-xs"
              >
                <span className="whitespace-nowrap">{slide.ctaText}</span>
                <ArrowLeft className="size-3 text-stone-300 shrink-0" />
              </Link>
            </div>

            {/* نشانگر نقاط اسلاید */}
            <div className="flex items-center gap-1.5 shrink-0">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`اسلاید ${itemIndex + 1}: ${item.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    itemIndex === index
                      ? "w-5 bg-amber-400 shadow-xs shadow-amber-400/80"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ۵. لایه رابط کاربری دسکتاپ (hidden lg:flex) ── */}
      <div className="hidden lg:flex absolute inset-0 z-20 flex-col justify-between p-8 xl:p-12 pointer-events-none">
        {/* بالای دسکتاپ: نشان کالکشن و شمارنده */}
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-black/60 px-3.5 py-1 text-xs font-black tracking-wider text-amber-300 backdrop-blur-md shadow-md">
            <span>✨</span>
            <span>{slide.badge}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? "پخش خودکار اسلایدها" : "توقف اسلایدها"}
              className="grid size-8 place-items-center rounded-lg border border-white/20 bg-black/50 text-white backdrop-blur-md hover:border-amber-400 hover:bg-black/70 transition"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
            <span className="text-xs font-bold text-stone-300 px-1">
              {toPersianDigits(index + 1)} از {toPersianDigits(total)}
            </span>
          </div>
        </div>

        {/* میانه دسکتاپ: عناوین لوکس و دکمه‌های فراخوان */}
        <div
          className="max-w-xl pointer-events-auto transition-transform duration-300"
          style={{ transform: `translate3d(${tilt.x * 6}px, ${tilt.y * 4}px, 0)` }}
        >
          <h1 className="text-2xl xl:text-4xl 2xl:text-5xl font-black leading-tight text-white drop-shadow-md">
            {slide.title}
          </h1>
          <p className="mt-3 text-sm xl:text-base leading-relaxed text-stone-200 font-medium line-clamp-2 max-w-lg drop-shadow">
            {slide.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/virtual-tryon"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 px-6 py-3 text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300"
            >
              <Sparkles className="size-4 text-stone-950 shrink-0" />
              <span className="truncate">پرو آنلاین هوشمند</span>
            </Link>
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black/50 border border-white/25 hover:border-amber-400 hover:bg-black/70 px-6 py-3 text-sm font-bold text-white shadow-md backdrop-blur-md transition-all active:scale-[0.98]"
            >
              <span className="truncate">{slide.ctaText}</span>
              <ArrowLeft className="size-4 text-stone-300 shrink-0" />
            </Link>
          </div>
        </div>

        {/* پایین دسکتاپ: نقاط نشانگر اسلایدها */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`اسلاید ${itemIndex + 1}: ${item.title}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                itemIndex === index
                  ? "w-8 bg-amber-400 shadow-sm shadow-amber-400/60"
                  : "w-2.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
