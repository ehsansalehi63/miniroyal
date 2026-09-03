"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HomeSlide } from "../lib/homeConfig";

interface CinematicHeroProps {
  slides: HomeSlide[];
  /** اگر فایل ویدیوی لوکال موجود باشد، به‌جای صحنهٔ انیمیشنی پخش می‌شود. */
  videoSrc: string | null;
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
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
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

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <section
      dir="rtl"
      aria-roledescription="carousel"
      aria-label="کالکشن‌های مینی رویال"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="hero-stage relative mx-auto max-w-7xl overflow-hidden bg-[#0b0711] text-white"
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
          {videoSrc ? (
            <video
              className="hero-media is-active"
              src={videoSrc}
              poster="/images/hero-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="ویدیوی معرفی کالکشن مینی رویال"
            />
          ) : (
            slides.map((item, itemIndex) => (
              <img
                key={item.id}
                src={item.image}
                alt={`${item.title} — ${item.subtitle}`}
                width={1280}
                height={714}
                decoding="async"
                loading={itemIndex === 0 ? "eager" : "lazy"}
                fetchPriority={itemIndex === 0 ? "high" : "auto"}
                className={`hero-media hero-kenburns ${itemIndex === index ? "is-active" : ""}`}
              />
            ))
          )}
          <span className="hero-caption">{slide.title}</span>
        </div>
        {/* بازتاب کف استودیو — از نسخهٔ سبک تصویر تا پهنای باند هدر نرود */}
        <img
          src={slide.thumb}
          alt=""
          aria-hidden="true"
          width={560}
          height={313}
          className="hero-reflection"
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
      <div className="relative z-20 grid min-h-[520px] items-center gap-10 px-6 py-20 sm:min-h-[600px] sm:px-12 lg:grid-cols-[1.05fr_.95fr] lg:px-16">
        <div className="max-w-xl">
          <p className="hero-kicker">MINI ROYAL · NEW EDIT</p>
          <h1 className="mt-5 text-3xl font-black leading-[1.25] sm:text-5xl">
            پوشاک کودک و نوجوان
            <span className="mt-2 block bg-gradient-to-l from-amber-200 via-white to-violet-200 bg-clip-text text-lg font-extrabold text-transparent sm:text-2xl">
              با پرو آنلاین سایز و جدول سانتی‌متری
            </span>
          </h1>
          <p aria-live="polite" className="mt-6 max-w-lg text-sm leading-8 text-stone-300 sm:text-base">
            {slide.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-xs font-black text-stone-950 shadow-[0_18px_45px_rgba(0,0,0,.45)] transition hover:bg-amber-300"
            >
              {slide.ctaText}
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              href="/virtual-tryon"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-4 text-xs font-black text-white/90 transition hover:border-amber-300 hover:text-amber-200"
            >
              پرو آنلاین سایز
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6 text-xs font-bold text-stone-400">
            <div>
              <dt className="sr-only">کیفیت</dt>
              <dd className="text-xl font-black text-white">۱۰۰٪</dd>
              <dd>انتخاب باکیفیت</dd>
            </div>
            <div>
              <dt className="sr-only">ضمانت</dt>
              <dd className="text-xl font-black text-white">۷ روز</dd>
              <dd>بازگشت و تعویض</dd>
            </div>
            <div>
              <dt className="sr-only">پرو آنلاین</dt>
              <dd className="text-xl font-black text-white">۲۸</dd>
              <dd>جدول سایز سانتی‌متری</dd>
            </div>
          </dl>
        </div>

        {/* ستون دوم فضای صحنه را نگه می‌دارد تا متن روی سوژه نیفتد */}
        <div className="hidden lg:block" aria-hidden="true" />
      </div>

      {/* ── ۶. کنترل‌های اسلاید ──────────────────────────────────── */}
      <div className="absolute bottom-7 left-6 z-30 flex items-center gap-2 sm:left-12">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "پخش خودکار اسلایدها" : "توقف اسلایدها"}
          aria-pressed={paused}
          className="grid size-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition hover:border-amber-300"
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="اسلاید قبلی"
          className="grid size-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition hover:border-amber-300"
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
            className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-10 bg-amber-300" : "w-5 bg-white/35 hover:bg-white/60"}`}
          />
        ))}
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="اسلاید بعدی"
          className="grid size-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white transition hover:border-amber-300"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </section>
  );
}
