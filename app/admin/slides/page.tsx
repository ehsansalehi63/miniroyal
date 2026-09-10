"use client";

import { useEffect, useState } from "react";
import { DEFAULT_HOME_SLIDES, HomeSlide } from "../../lib/homeConfig";
import { Sliders, RefreshCw, Save, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<HomeSlide[]>(DEFAULT_HOME_SLIDES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadSlides = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/slides", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.slides)) {
        setSlides(data.slides);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSlides();
  }, []);

  const update = (id: number, key: keyof HomeSlide, value: string) =>
    setSlides((items) => items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ذخیره‌سازی اسلایدها");
      }
      setSuccessMsg("اسلایدر صفحه اصلی با موفقیت در سرور و دیتابیس ذخیره شد! 🎉");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("آیا از بازنشانی اسلایدها به تنظیمات پیش‌فرض اطمینان دارید؟")) return;
    setSlides(DEFAULT_HOME_SLIDES);
  };

  return (
    <div dir="rtl" className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مدیریت اسلایدر صفحه اصلی</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            تغییر تصاویر، تیترها، برچسب‌ها و دکمه‌های اکشن بنرهای اصلی ورودی فروشگاه با ذخیره‌سازی روی سرور.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
          >
            <RotateCcw className="size-3.5" />
            <span>بازنشانی</span>
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-black text-white hover:bg-stone-800 transition shadow-md disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{saving ? "در حال ذخیره..." : "ذخیره تغییرات اسلایدر"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[160px_1fr]"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-32 w-full rounded-2xl object-cover shadow-xs border border-stone-100"
              />
              <span className="text-[11px] font-bold text-stone-400">اسلاید شماره {idx + 1}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700">تیتر اصلی اسلاید</label>
                <input
                  value={slide.title}
                  onChange={(e) => update(slide.id, "title", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">زیرعنوان توضیحی</label>
                <input
                  value={slide.subtitle}
                  onChange={(e) => update(slide.id, "subtitle", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">بج بالای عنوان (Badge)</label>
                <input
                  value={slide.badge}
                  onChange={(e) => update(slide.id, "badge", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">آدرس اینترنتی تصویر (URL)</label>
                <input
                  value={slide.image}
                  onChange={(e) => update(slide.id, "image", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs font-mono outline-none focus:border-amber-500 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">متن دکمه اکشن (CTA)</label>
                <input
                  value={slide.ctaText}
                  onChange={(e) => update(slide.id, "ctaText", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700">لینک مقصد دکمه اکشن</label>
                <input
                  value={slide.ctaLink}
                  onChange={(e) => update(slide.id, "ctaLink", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs font-mono outline-none focus:border-amber-500 text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
