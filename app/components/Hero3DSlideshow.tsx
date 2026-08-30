"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ChevronRight, ChevronLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { formatToman } from "../lib/utils";

const slides = [
  {
    id: 1,
    badge: "👑 کالکشن ویژه پاییزی و زمستانه مینی رویال",
    title: "شیک‌ترین لباس‌های فصل برای فرشته‌های کوچک شما",
    subtitle: "پارچه‌های ۱۰۰٪ پنبه ارگانیک ضد حساسیت با پرو آنلاین ۲ بعدی و تضمین سایز دقیق",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&auto=format&fit=crop",
    price: 680000,
    ctaText: "مشاهده و پرو آنلاین",
    ctaLink: "/virtual-tryon",
    secondaryLink: "/category/set",
    accentColor: "from-violet-600 via-fuchsia-600 to-indigo-600",
  },
  {
    id: 2,
    badge: "🎀 ست‌های مجلسی و جشن تولد دخترانه",
    title: "پیراهن‌های پف‌دار و مجلسی با طراحی سلبریتی کوچک",
    subtitle: "دوخت سفارشی با تورهای فرانسوی ابریشمی و نرم‌ترین آستر پنبه‌ای",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=1000&auto=format&fit=crop",
    price: 890000,
    ctaText: "دیدن ست‌های دخترانه",
    ctaLink: "/category/dokhtaraneh",
    secondaryLink: "/category/majlesi",
    accentColor: "from-fuchsia-600 via-pink-600 to-rose-600",
  },
  {
    id: 3,
    badge: "🧢 ست‌های اسپرت و کاپشن‌های گرم پسرانه",
    title: "استایل شیک خیابانی و پاییزی برای گل‌پسرها",
    subtitle: "ضد آب، ضد باد با آستر پشم‌شیشه گرمایشی ماندگار جهت بازی و مدرسه",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000&auto=format&fit=crop",
    price: 740000,
    ctaText: "دیدن ست‌های پسرانه",
    ctaLink: "/category/pesaraneh",
    secondaryLink: "/category/madreseh",
    accentColor: "from-amber-500 via-orange-600 to-red-600",
  },
];

export default function Hero3DSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* اسلاید شو ۳ بعدی */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/80 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 p-6 sm:p-12 text-white shadow-2xl transition-all duration-700">
          {/* جلوه نور محیطی background glow */}
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-violet-600/30 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-fuchsia-600/30 blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
            {/* متون اسلاید */}
            <div className="space-y-5 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black backdrop-blur-md border border-white/20 text-violet-200 shadow-inner">
                <Sparkles className="size-3.5 text-amber-400" />
                {slide.badge}
              </span>

              <h1 className="text-3xl font-black leading-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-stone-100 to-stone-300">
                {slide.title}
              </h1>

              <p className="text-xs sm:text-sm leading-relaxed text-stone-300 max-w-xl">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-xs sm:text-sm font-black text-white shadow-xl shadow-violet-900/50 transition-all hover:scale-105 hover:brightness-110"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowLeft className="size-4" />
                </Link>

                <Link
                  href={slide.secondaryLink}
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-700 bg-stone-800/80 px-6 py-4 text-xs sm:text-sm font-bold text-stone-200 hover:bg-stone-700 hover:text-white backdrop-blur-md"
                >
                  <span>دیدن کاتالوگ</span>
                </Link>
              </div>

              {/* بنرهای ارزش افزوده */}
              <div className="grid grid-cols-3 gap-2 pt-6 border-t border-stone-800 text-[11px] text-stone-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <Truck className="size-4 text-violet-400 shrink-0" />
                  <span>ارسال رایگان ۵۰۰k+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                  <span>تضمین ۱۰۰٪ سایز</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="size-4 text-fuchsia-400 shrink-0" />
                  <span>۷ روز ضمانت تعویض</span>
                </div>
              </div>
            </div>

            {/* تصویر ۳ بعدی با کارت آفست دکوری */}
            <div className="relative lg:col-span-5 flex justify-center">
              <div className="relative size-72 sm:size-96 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 group transform transition-all duration-500 hover:rotate-1 hover:scale-105">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                
                {/* کارت شناور ۳ بعدی قیمت */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 backdrop-blur-md p-3.5 shadow-2xl border border-white/40 flex items-center justify-between text-stone-900">
                  <div>
                    <span className="block text-[10px] font-bold text-stone-500">قیمت از:</span>
                    <span className="text-sm font-black text-violet-900">{formatToman(slide.price)}</span>
                  </div>
                  <span className="rounded-xl bg-violet-700 px-3 py-1 text-xs font-black text-white">
                    تخفیف ویژه 👑
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* کلیدهای ناوبری اسلایدشو */}
          <div className="mt-8 flex items-center justify-between border-t border-stone-800/80 pt-4">
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-8 bg-violet-500" : "w-2.5 bg-stone-700"
                  }`}
                  aria-label={`اسلاید ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="grid size-9 place-items-center rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                aria-label="اسلاید قبلی"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="grid size-9 place-items-center rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                aria-label="اسلاید بعدی"
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
