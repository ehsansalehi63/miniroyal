"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DEFAULT_HOME_SLIDES, HomeSlide } from "../lib/homeConfig";

export default function Hero3DSlideshow() {
  const [current, setCurrent] = useState(0);
  const [slides] = useState<HomeSlide[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HOME_SLIDES;
    try {
      // Version the browser cache so an older admin preview cannot keep
      // showing retired SVG slides after a storefront deployment.
      const saved = localStorage.getItem("miniroyal_home_slides_v2");
      const parsed = saved ? JSON.parse(saved) as HomeSlide[] : [];
      return parsed.length > 0 ? parsed : DEFAULT_HOME_SLIDES;
    } catch {
      return DEFAULT_HOME_SLIDES;
    }
  });

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setCurrent((value) => (value + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;

  return (
    <div dir="rtl" className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 font-sans text-white shadow-2xl">
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-90 transition-all duration-1000`} />
      <div className="relative z-10 grid min-h-[460px] items-center gap-8 p-8 sm:p-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{slide.badge}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{slide.title}</h1>
          <p className="text-sm leading-7 text-stone-200 sm:text-base">{slide.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link href={slide.ctaLink} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-stone-950 shadow-lg">
              {slide.ctaText}<ArrowLeft className="size-4" />
            </Link>
            <Link href="/virtual-tryon" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold backdrop-blur-md">
              👗 پرو آنلاین با عکس
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center lg:col-span-5">
          <div className="relative size-72 overflow-hidden rounded-3xl border-2 border-white/20 bg-stone-950/40 shadow-2xl backdrop-blur-md sm:size-96">
            <img src={slide.image} alt={slide.title} className="editorial-image size-full object-cover transition-transform duration-700 hover:scale-105" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-8 z-20 flex items-center gap-2">
        {slides.map((item, index) => (
          <button key={item.id} onClick={() => setCurrent(index)} aria-label={`اسلاید ${index + 1}`} className={`h-2.5 rounded-full transition-all ${current === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}
