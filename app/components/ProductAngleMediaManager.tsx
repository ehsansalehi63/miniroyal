"use client";

import { ChangeEvent, useState } from "react";
import { Check, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { ProductAngleMedia, ProductMediaAngle } from "../lib/types/catalog";

const angleLabels: Record<ProductMediaAngle, string> = { front: "نمای روبه‌رو", back: "نمای پشت", left: "نمای چپ", right: "نمای راست", detail: "نمای جزئیات پارچه", on_model: "تن‌خور روی مدل", size_label: "لیبل و جدول سایز", packaging: "بسته‌بندی" };
const angles: ProductMediaAngle[] = ["front", "back", "left", "right", "detail", "on_model", "size_label", "packaging"];

interface Props { value: Partial<Record<ProductMediaAngle, ProductAngleMedia>>; onChange: (value: Partial<Record<ProductMediaAngle, ProductAngleMedia>>) => void; }

export default function ProductAngleMediaManager({ value, onChange }: Props) {
  const [busy, setBusy] = useState<ProductMediaAngle | null>(null);
  const [message, setMessage] = useState("");

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data.url) throw new Error(data?.error || "آپلود تصویر انجام نشد.");
    return String(data.url);
  };

  const optimize = async (angle: ProductMediaAngle, sourceUrl: string, item: ProductAngleMedia) => {
    try {
      const response = await fetch("/api/ai-image-edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: sourceUrl, prompt: `تصویر کاتالوگ فشن کودک را برای نمای ${angleLabels[angle]} آماده کن؛ پس‌زمینه تمیز، نور استودیویی، رنگ واقعی پارچه، مناسب نمایش فروشگاهی و موتور پرو آنلاین.` }) });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success && data.imageUrl) {
        onChange({ ...value, [angle]: { ...item, url: String(data.imageUrl), isAiOptimized: true } });
        setMessage("تصویر آپلود و با AI برای کاتالوگ بهینه شد.");
      } else {
        setMessage(data?.error || "تصویر آپلود شد؛ بهینه‌سازی AI در دسترس نبود و اصل تصویر حفظ شد.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تصویر آپلود شد؛ اصل تصویر حفظ شد.");
    }
  };

  const upload = async (angle: ProductMediaAngle, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { setMessage("برای هر زاویه تصویر JPG، PNG یا WebP کمتر از ۸ مگابایت انتخاب کنید."); return; }
    setBusy(angle); setMessage("در حال آپلود تصویر...");
    try {
      const sourceUrl = await uploadFile(file);
      const item: ProductAngleMedia = { angle, url: sourceUrl, alt: angleLabels[angle], isAiOptimized: false, isTryOnReady: angle === "front" || angle === "on_model" };
      onChange({ ...value, [angle]: item });
      setMessage("تصویر آپلود شد؛ در حال تلاش برای بهینه‌سازی AI...");
      await optimize(angle, sourceUrl, item);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "آپلود تصویر انجام نشد.");
    } finally { setBusy(null); }
  };

  return <div dir="rtl" className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-4">
    <div className="flex items-start gap-2"><Sparkles className="mt-0.5 size-5 text-fuchsia-700" /><div><h4 className="text-xs font-black text-fuchsia-950">رسانهٔ حرفه‌ای محصول و پرو آنلاین</h4><p className="mt-1 text-[10px] leading-5 text-fuchsia-900">تصویر ابتدا سریع ذخیره می‌شود؛ بهینه‌سازی AI در پس‌زمینه انجام می‌شود و در صورت خطا، تصویر اصلی باقی می‌ماند.</p></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{angles.map((angle) => { const item = value[angle]; return <label key={angle} className="relative cursor-pointer overflow-hidden rounded-xl border border-fuchsia-200 bg-white p-2 text-center hover:border-fuchsia-500">{item?.url ? <img src={item.url} alt={item.alt || angleLabels[angle]} className="aspect-square w-full rounded-lg object-cover" /> : <span className="flex aspect-square flex-col items-center justify-center text-fuchsia-500"><UploadCloud className="size-6" /><span className="mt-1 text-[10px] font-bold">انتخاب عکس</span></span>}<span className="mt-2 block text-[10px] font-black text-stone-800">{angleLabels[angle]}</span>{item?.isAiOptimized && <span className="absolute left-1 top-1 rounded-full bg-emerald-600 p-1 text-white"><Check className="size-3" /></span>}{busy === angle && <span className="absolute inset-0 grid place-items-center bg-white/75"><Loader2 className="size-6 animate-spin text-fuchsia-700" /></span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void upload(angle, event)} /></label>; })}</div>
    {message && <p className="mt-3 text-[11px] font-bold text-fuchsia-900">{message}</p>}
  </div>;
}
