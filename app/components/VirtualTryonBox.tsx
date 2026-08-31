"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { Camera, Download, Loader2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { Product } from "../lib/types/catalog";
import { recommendSize } from "../lib/smartFit";
import { toPersianDigits } from "../lib/utils";

interface Props {
  product: Product;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.readAsDataURL(file);
  });
}

async function sourceToDataUrl(source: string) {
  if (source.startsWith("data:")) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("تصویر لباس قابل دریافت نیست.");
  return fileToDataUrl(await response.blob());
}

export default function VirtualTryonBox({ product }: Props) {
  const [tab, setTab] = useState<"fit" | "photo">("fit");
  const [heightCm, setHeightCm] = useState(104);
  const [weightKg, setWeightKg] = useState(17);
  const [chestCm, setChestCm] = useState(56);
  const [waistCm, setWaistCm] = useState(52);
  const [ageMonths, setAgeMonths] = useState(72);
  const [gender, setGender] = useState<"boy" | "girl" | "unisex">(
    product.gender === "unisex" ? "unisex" : product.gender
  );
  const [buyForGrowth, setBuyForGrowth] = useState(false);
  const [personImage, setPersonImage] = useState<string>();
  const [resultImage, setResultImage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fit = useMemo(
    () => recommendSize(product, { heightCm, weightKg, ageMonths, gender, buyForGrowth, chestCm, waistCm }),
    [product, heightCm, weightKg, ageMonths, gender, buyForGrowth, chestCm, waistCm]
  );

  const acceptFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری قابل استفاده است.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("حجم تصویر باید کمتر از ۸ مگابایت باشد.");
      return;
    }
    setError("");
    setResultImage(undefined);
    setPersonImage(await fileToDataUrl(file));
  };

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    void acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  };

  const runTryOn = async () => {
    if (!personImage) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImage,
          garmentImage: await sourceToDataUrl(product.tryOnAsset?.url ?? product.images[0]),
          productId: product.id,
          requestedSize: fit.size,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "تولید تصویر پرو انجام نشد.");
      }
      setResultImage(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرویس پرو آنلاین برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  const resetPhoto = () => {
    setPersonImage(undefined);
    setResultImage(undefined);
    setError("");
  };

  return (
    <section dir="rtl" className="overflow-hidden rounded-[2rem] border border-violet-300/40 bg-gradient-to-br from-violet-950 via-stone-950 to-fuchsia-950 p-5 text-white shadow-2xl sm:p-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="size-5" />
            <span className="text-xs font-black">پرو آنلاین واقعی مینی رویال</span>
          </div>
          <h2 className="mt-2 text-xl font-black">اول سایز مناسب را پیدا کن، بعد لباس را روی عکس ببین</h2>
          <p className="mt-1 text-xs text-violet-200">تصویر شما فقط برای همین درخواست پردازش می‌شود و کلید AI در مرورگر قرار نمی‌گیرد.</p>
        </div>
        <div className="flex rounded-xl bg-white/10 p-1">
          <button onClick={() => setTab("fit")} className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === "fit" ? "bg-violet-600" : "text-violet-100"}`}>
            پیشنهاد سایز
          </button>
          <button onClick={() => setTab("photo")} className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === "photo" ? "bg-fuchsia-600" : "text-violet-100"}`}>
            پرو با عکس
          </button>
        </div>
      </div>

      {tab === "fit" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">قد کودک
              <span className="mt-2 block text-lg text-amber-300">{toPersianDigits(heightCm)} سانتی‌متر</span>
              <input className="mt-3 w-full accent-amber-400" type="range" min="55" max="170" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} />
            </label>
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">وزن کودک
              <span className="mt-2 block text-lg text-amber-300">{toPersianDigits(weightKg)} کیلوگرم</span>
              <input className="mt-3 w-full accent-amber-400" type="range" min="3" max="60" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
            </label>
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">سن کودک
              <span className="mt-2 block text-lg text-amber-300">{toPersianDigits(Math.floor(ageMonths / 12))} سال</span>
              <input className="mt-3 w-full accent-amber-400" type="range" min="0" max="204" value={ageMonths} onChange={(e) => setAgeMonths(Number(e.target.value))} />
            </label>
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">دور سینه
              <span className="mt-2 block text-lg text-amber-300">{toPersianDigits(chestCm)} سانتی‌متر</span>
              <input className="mt-3 w-full accent-amber-400" type="range" min="30" max="110" value={chestCm} onChange={(e) => setChestCm(Number(e.target.value))} />
            </label>
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">دور کمر
              <span className="mt-2 block text-lg text-amber-300">{toPersianDigits(waistCm)} سانتی‌متر</span>
              <input className="mt-3 w-full accent-amber-400" type="range" min="25" max="100" value={waistCm} onChange={(e) => setWaistCm(Number(e.target.value))} />
            </label>
            <label className="rounded-2xl bg-white/10 p-4 text-xs font-bold">جنسیت
              <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="mt-3 w-full rounded-lg bg-stone-900 p-2 text-white">
                <option value="girl">دخترانه</option><option value="boy">پسرانه</option><option value="unisex">یونیسکس</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-2xl bg-white/10 p-4 text-xs font-bold sm:col-span-2">
              <input type="checkbox" checked={buyForGrowth} onChange={(e) => setBuyForGrowth(e.target.checked)} className="size-4 accent-fuchsia-500" />
              برای رشد آینده کمی آزادتر انتخاب کن
            </label>
          </div>
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/40 p-6">
            <p className="text-xs font-bold text-emerald-300">پیشنهاد محصول «{product.title}»</p>
            <div className="mt-5 flex items-end gap-3">
              <strong className="text-4xl text-amber-300">{fit.size}</strong>
              <span className="mb-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-stone-950">{toPersianDigits(fit.confidence)}٪ اطمینان</span>
            </div>
            <ul className="mt-5 space-y-3 text-xs leading-6 text-emerald-100">{fit.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul>
            <button onClick={() => setTab("photo")} className="mt-6 w-full rounded-xl bg-fuchsia-600 py-3 text-xs font-black hover:bg-fuchsia-500">حالا پرو با عکس را امتحان کن</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-dashed border-violet-300/50 bg-white/5 p-6">
            <label onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-8 text-center transition ${isDragging ? "border-amber-300 bg-amber-300/20" : "border-white/10 hover:bg-white/10"}`}>
              <Camera className="size-10 text-violet-300" />
              <span className="mt-3 text-sm font-black">عکس تمام‌قد کودک را انتخاب کن</span>
              <span className="mt-2 text-xs text-violet-200">JPG یا PNG، حداکثر ۸ مگابایت</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={onUpload} />
            </label>
            {personImage && <img src={resultImage ?? personImage} alt="پیش‌نمایش پرو آنلاین" className="mt-5 max-h-[420px] w-full rounded-2xl object-contain" />}
            {error && <p className="mt-4 rounded-xl bg-rose-950/60 p-3 text-xs font-bold text-rose-200">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={runTryOn} disabled={!personImage || busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-xs font-black disabled:opacity-50">
                {busy ? <><Loader2 className="size-4 animate-spin" /> در حال ساخت تصویر واقعی...</> : <><UserRound className="size-4" /> اجرای پرو واقعی</>}
              </button>
              <button onClick={resetPhoto} className="rounded-xl bg-white/10 px-4" title="پاک کردن"><RotateCcw className="size-4" /></button>
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 text-sm leading-8 text-violet-100">
            <h3 className="font-black text-white">راهنمای عکس بهتر</h3>
            <p className="mt-3">کودک رو روبه‌روی دوربین، ایستاده و با نور یکنواخت عکاسی کن. لباس فعلی ساده باشد و دست‌ها جلوی بدن نباشند. مدل AI فقط لباس را جایگزین می‌کند و چهره و پس‌زمینه را حفظ می‌کند.</p>
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs text-amber-100">این تصویر برای نمایش تقریبی تن‌خور است؛ اندازهٔ نهایی خرید را بر اساس پیشنهاد سایز و جدول اندازه بررسی کن.</p>
            {resultImage && <a href={resultImage} download={`miniroyal-tryon-${product.slug}.png`} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white"><Download className="size-4" /> دانلود نتیجه</a>}
          </div>
        </div>
      )}
    </section>
  );
}
