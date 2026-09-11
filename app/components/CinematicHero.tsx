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
export default function CinematicHero({ slides, videoSrc: _videoSrc }: CinematicHeroProps) {
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
      className="hero-stage relative mx-auto site-container overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border border-stone-800/80 bg-[#080706] text-white shadow-xl p-3 sm:p-5 lg:p-0"
    >
      {/* ── ۱. نور استودیو و کف صحنه ─────────────────────────────── */}
      <div className="hero-spotlight" aria-hidden="true" />
      <div className="hero-floor" aria-hidden="true" />
      <div className="hero-rays" aria-hidden="true" />

      {/* ── ۲. نام و لوگوی سایت، سه‌بعدی پشت سوژه ────────────────── */}
      <div
        className="hero-logo3d-wrap"
        aria-hidden="true"
        style={{ transform: `translate3d(${tilt.x * -14}px, ${tilt.y * -10}px, 0)` }}
      >
        <img src="/images/brand/miniroyal-logo.webp" alt="" width={192} height={288} className="hero-logo3d-mark" />
        <span className="hero-logo3d-text">MINI ROYAL</span>
        <span className="hero-logo3d-sub">KIDS COUTURE STUDIO</span>
      </div>

      {/* ── ۳. سوژه: ویدیو یا قاب فیلم با حرکت Ken Burns ─────────── */}
      <div
        className="hero-subject"
        style={{ transform: `translate3d(${tilt.x * 10}px, ${tilt.y * 8}px, 0)` }}
      >
        <div className="hero-frame">
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

          {/* دکمه‌های ناوبری لمسی مستقیم روی تصویر برای راحتی دست در موبایل */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="اسلاید قبلی"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20 hover:bg-black/80 lg:hidden shadow-md active:scale-90 transition"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="اسلاید بعدی"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20 hover:bg-black/80 lg:hidden shadow-md active:scale-90 transition"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="hero-caption hidden sm:block">
            <span className="text-amber-400 font-bold ml-1.5">{slide.badge}</span>
            <span>{slide.title}</span>
          </span>
        </div>
        {/* بازتاب کف استودیو */}
        <img
          src={slide.thumb}
          alt=""
          aria-hidden="true"
          width={560}
          height={315}
          className="hero-reflection hidden lg:block"
          decoding="async"
          loading="lazy"
        />
      </div>

      {/* ── ۴. بافت فیلم و وینیت ─────────────────────────────────── */}
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-bar hero-bar-top" aria-hidden="true" />
      <div className="hero-bar hero-bar-bottom" aria-hidden="true" />

      {/* ── ۵. متن و فراخوان‌ها ──────────────────────────────────── */}
      <div className="relative z-20 grid items-center gap-2 sm:gap-6 pt-2.5 pb-0 sm:pt-4 sm:pb-0 lg:min-h-[580px] lg:grid-cols-[1.1fr_.9fr] lg:px-14 lg:py-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-[11px] font-black tracking-wider text-amber-300 backdrop-blur-md">
            <span>✨</span>
            <span>{slide.badge}</span>
          </div>
          <h1 className="mt-2 text-base sm:text-2xl lg:text-5xl font-black leading-snug sm:leading-[1.3] text-white">
            {slide.title}
          </h1>
          <p aria-live="polite" className="mt-1 sm:mt-3 text-[11px] sm:text-sm lg:text-base leading-5 sm:leading-7 text-stone-200 font-medium line-clamp-2 max-w-lg">
            {slide.subtitle}
          </p>

          <div className="mt-3 sm:mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3.5">
            <Link
              href="/virtual-tryon"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300"
            >
              <Sparkles className="size-3.5 sm:size-4 text-stone-950 shrink-0" />
              <span className="truncate">پرو آنلاین هوشمند</span>
            </Link>
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-stone-900/90 border border-stone-700 hover:border-amber-400 px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-stone-100 shadow-md transition-all hover:bg-stone-800 active:scale-[0.98]"
            >
              <span className="truncate">{slide.ctaText}</span>
              <ArrowLeft className="size-3 sm:size-3.5 text-stone-400 shrink-0" />
            </Link>
          </div>

          {/* نوار کنترل اختصاصی موبایل و تبلت: پیوسته و بدون فضای خالی اضافه */}
          <div className="mt-3 sm:mt-5 flex lg:hidden items-center justify-between border-t border-white/10 pt-2.5 text-xs text-stone-300">
            <div className="flex items-center gap-1.5">
              {slides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`اسلاید ${itemIndex + 1}: ${item.title}`}
                  aria-current={itemIndex === index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    itemIndex === index
                      ? "w-6 bg-amber-400 shadow-xs shadow-amber-400/60"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-bold text-amber-300/90">
              {toPersianDigits(index + 1)} از {toPersianDigits(total)}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "پخش خودکار اسلایدها" : "توقف اسلایدها"}
                aria-pressed={paused}
                className="grid size-7 place-items-center rounded-lg border border-white/20 bg-stone-950/70 text-white backdrop-blur-xs transition hover:border-amber-400 active:scale-95"
              >
                {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
              </button>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="اسلاید قبلی"
                className="grid size-7 place-items-center rounded-lg border border-white/20 bg-stone-950/70 text-white backdrop-blur-xs transition hover:border-amber-400 active:scale-95"
              >
                <ChevronRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="اسلاید بعدی"
                className="grid size-7 place-items-center rounded-lg border border-white/20 bg-stone-950/70 text-white backdrop-blur-xs transition hover:border-amber-400 active:scale-95"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ستون دوم فضای صحنه در دسکتاپ را نگه می‌دارد تا متن روی سوژه نیفتد */}
        <div className="hidden lg:block" aria-hidden="true" />
      </div>

      {/* ── ۶. کنترل‌های اسلاید دسکتاپ ─────────────────────────────── */}
      <div className="hidden lg:flex absolute bottom-6 left-12 z-30 items-center gap-2">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "پخش خودکار اسلایدها" : "توقف اسلایدها"}
          aria-pressed={paused}
          className="grid size-9 place-items-center rounded-xl border border-white/20 bg-stone-950/70 text-white backdrop-blur-md transition hover:border-amber-400"
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="اسلاید قبلی"
          className="grid size-9 place-items-center rounded-xl border border-white/20 bg-stone-950/70 text-white backdrop-blur-md transition hover:border-amber-400"
        >
          <ChevronRight className="size-4" />
        </button>
        {slides.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-label={`اسلاید ${itemIndex + 1}: ${item.title}`}
            aria-current={itemIndex === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              itemIndex === index
                ? "w-8 bg-amber-400 shadow-sm shadow-amber-400/50"
                : "w-3 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="اسلاید بعدی"
          className="grid size-9 place-items-center rounded-xl border border-white/20 bg-stone-950/70 text-white backdrop-blur-md transition hover:border-amber-400"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </section>
  );
}
