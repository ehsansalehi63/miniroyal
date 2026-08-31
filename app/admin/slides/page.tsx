"use client";

import { useState } from "react";
import { DEFAULT_HOME_SLIDES, HomeSlide } from "../../lib/homeConfig";

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<HomeSlide[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HOME_SLIDES;
    try {
      const saved = localStorage.getItem("miniroyal_home_slides_v2");
      return saved ? JSON.parse(saved) as HomeSlide[] : DEFAULT_HOME_SLIDES;
    } catch { return DEFAULT_HOME_SLIDES; }
  });

  const update = (id: number, key: keyof HomeSlide, value: string) =>
    setSlides((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const save = () => localStorage.setItem("miniroyal_home_slides_v2", JSON.stringify(slides));
  const reset = () => {
    setSlides(DEFAULT_HOME_SLIDES);
    localStorage.removeItem("miniroyal_home_slides_v2");
  };

  return (
    <div dir="rtl" className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-stone-900">مدیریت اسلایدشو صفحهٔ اصلی</h1><p className="mt-1 text-xs text-stone-500">متن، لینک و تصویر هر اسلاید را ویرایش کنید.</p></div>
        <div className="flex gap-2"><button onClick={reset} className="rounded-xl bg-stone-200 px-4 py-3 text-xs font-bold text-stone-700">بازنشانی</button><button onClick={save} className="rounded-xl bg-violet-700 px-5 py-3 text-xs font-black text-white">ذخیره</button></div>
      </div>
      {slides.map((slide) => (
        <div key={slide.id} className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[150px_1fr]">
          <img src={slide.image} alt={slide.title} className="h-32 w-full rounded-2xl object-cover" />
          <div className="grid gap-3 sm:grid-cols-2">
            {(["title", "subtitle", "badge", "ctaText", "ctaLink", "image"] as const).map((key) => (
              <label key={key} className="text-[11px] font-bold text-stone-700">{key}
                <input value={slide[key]} onChange={(e) => update(slide.id, key, e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
