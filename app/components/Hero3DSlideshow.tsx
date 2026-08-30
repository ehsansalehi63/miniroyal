"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    title: "مجموعه جدید پاییز و زمستان مینی رویال 👑",
    subtitle: "هودی‌های فوق‌العاده نرم، کاپشن‌های ضدآب و ست‌های گرم با تن‌خور فوق‌العاده",
    ctaText: "مشاهده کلکسیون جدید 🛍️",
    ctaLink: "/shop?season=autumn-winter",
    badge: "🔥 جدیدترین‌های فصل",
    image: "/images/products/hero-slide1.svg",
    color: "from-violet-900 via-indigo-950 to-slate-950",
  },
  {
    id: 2,
    title: "پیراهن‌ها و سارافون‌های مجلسی دخترانه 🎀",
    subtitle: "طراحی شیک با پارچه کرپ حریر و آستر ۱۰۰٪ پنبه ارگانیک ضد حساسیت",
    ctaText: "خرید لباس مجلسی 👗",
    ctaLink: "/category/dokhtaraneh",
    badge: "✨ پیشنهاد ویژه پرنسس‌ها",
    image: "/images/products/hero-slide2.svg",
    color: "from-rose-900 via-pink-950 to-stone-950",
  },
  {
    id: 3,
    title: "سرهمی و ست‌های ارگانیک نوزادی 🍼",
    subtitle: "نرم‌ترین الیاف طبیعی نخ‌پنبه بدون هیچ گونه مواد شیمیایی برای پوست لطیف نوزاد",
    ctaText: "مشاهده محصولات نوزاد 🧸",
    ctaLink: "/category/nozad",
    badge: "🌱 ۱۰۰٪ نخ‌پنبه ارگانیک",
    image: "/images/products/hero-slide3.svg",
    color: "from-amber-950 via-stone-900 to-emerald-950",
  },
];

export default function Hero3DSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 text-white shadow-2xl font-sans dir-rtl">
      {/* Background Gradient & Pattern */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} transition-all duration-1000 opacity-90`} />
      <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      <div className="relative z-10 grid min-h-[460px] items-center gap-8 p-8 sm:p-12 lg:grid-cols-12">
        {/* Content */}
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/15">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{slide.badge}</span>
          </div>

          <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl text-white">
            {slide.title}
          </h1>

          <p className="text-sm font-medium leading-7 text-stone-200 sm:text-base">
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-stone-950 shadow-lg hover:bg-stone-100 transition transform hover:-translate-y-0.5"
            >
              <span>{slide.ctaText}</span>
              <ArrowLeft className="size-4" />
            </Link>

            <Link
              href="/virtual-tryon"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition"
            >
              <span>👗 پرو آنلاین هوشمند با عکس</span>
            </Link>
          </div>
        </div>

        {/* Hero Graphic Image */}
        <div className="relative lg:col-span-5 flex justify-center">
          <div className="relative size-72 sm:size-96 overflow-hidden rounded-3xl border-2 border-white/20 bg-stone-950/40 backdrop-blur-md shadow-2xl">
            <img
              src={slide.image}
              alt={slide.title}
              className="size-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-8 z-20 flex items-center gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all ${
              current === idx ? "w-8 bg-amber-400" : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
