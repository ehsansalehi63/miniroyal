"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  Download,
  Loader2,
  LogIn,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Product, Variant } from "../lib/types/catalog";
import { CustomerSession } from "../lib/customer-auth";
import { recommendSize } from "../lib/smartFit";
import { toPersianDigits } from "../lib/utils";
import { useCart } from "../lib/cart";
import TryonCompareSlider from "./TryonCompareSlider";

interface Props {
  product: Product;
  customer?: CustomerSession | null;
}

interface QuotaInfo {
  remaining: number | null;
  limit: number | null;
  unlimited: boolean;
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.readAsDataURL(file);
  });
}

function compressImage(source: string, maxSide = 1024, quality = 0.72) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Image preparation failed."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let encoded = canvas.toDataURL("image/jpeg", quality);
      for (const nextQuality of [0.62, 0.52, 0.42]) {
        if (encoded.length <= 2_800_000) break;
        encoded = canvas.toDataURL("image/jpeg", nextQuality);
      }
      resolve(encoded);
    };
    image.onerror = () => reject(new Error("Could not read the image."));
    image.src = source;
  });
}

async function sourceToDataUrl(source: string) {
  if (source.startsWith("data:")) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error("تصویر لباس قابل دریافت نیست.");
  return fileToDataUrl(await response.blob());
}

export default function VirtualTryonBox({ product, customer }: Props) {
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
  const [showCompareSlider, setShowCompareSlider] = useState(true);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo>({
    remaining: null,
    limit: 5,
    unlimited: false,
  });

  const { addItem } = useCart();
  const garmentSource = product.tryOnAsset?.url ?? product.images[0];

  const fit = useMemo(
    () => recommendSize(product, { heightCm, weightKg, ageMonths, gender, buyForGrowth, chestCm, waistCm }),
    [product, heightCm, weightKg, ageMonths, gender, buyForGrowth, chestCm, waistCm]
  );

  // پیدا کردن واریانت منطبق با سایز پیشنهادی
  const matchingVariant: Variant | undefined = useMemo(() => {
    return (
      product.variants.find((v) => v.size === fit.size && v.stock > 0) ||
      product.variants.find((v) => v.size === fit.size) ||
      product.variants.find((v) => v.stock > 0) ||
      product.variants[0]
    );
  }, [product.variants, fit.size]);

  // دریافت سهمیه لحظه‌ای پرو آنلاین از سرور
  useEffect(() => {
    let active = true;
    async function fetchQuota() {
      try {
        const res = await fetch("/api/ai-tryon/quota");
        const data = await res.json();
        if (active && data.success) {
          setQuota({
            remaining: data.remaining,
            limit: data.limit || 5,
            unlimited: Boolean(data.unlimited),
          });
        }
      } catch {
        // Silent catch
      }
    }
    fetchQuota();
    return () => {
      active = false;
    };
  }, [customer]);

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
    const uploadedImage = await fileToDataUrl(file);
    setPersonImage(await compressImage(uploadedImage));
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
          garmentImage: await compressImage(await sourceToDataUrl(product.tryOnAsset?.url ?? product.images[0])),
          productId: product.id,
          requestedSize: fit.size,
        }),
      });
      const responseText = await response.text();
      let data: { success?: boolean; imageUrl?: string; error?: string; remaining?: number | null; unlimited?: boolean } = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        if (responseText.trimStart().startsWith("<")) {
          throw new Error(`سرور پاسخ HTML برگرداند (HTTP ${response.status})؛ لطفاً دوباره تلاش کنید.`);
        }
        throw new Error("پاسخ نامعتبر از سرویس پرو آنلاین دریافت شد.");
      }
      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "تولید تصویر پرو انجام نشد.");
      }
      setResultImage(data.imageUrl);
      if (typeof data.remaining === "number" || data.remaining === null) {
        setQuota((prev) => ({
          ...prev,
          remaining: data.remaining ?? prev.remaining,
          unlimited: Boolean(data.unlimited),
        }));
      }
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

  const handleAddFittedToCart = () => {
    if (!matchingVariant || matchingVariant.stock <= 0) return;
    addItem(product, matchingVariant, 1);
    setAddedToCartSuccess(true);
    setTimeout(() => setAddedToCartSuccess(false), 3000);
  };

  return (
    <section dir="rtl" className="overflow-hidden rounded-[2rem] border border-violet-300/40 bg-gradient-to-br from-violet-950 via-stone-950 to-fuchsia-950 p-5 text-white shadow-2xl sm:p-8">
      {/* هدر بخش پرو آنلاین همراه با بج سهمیه */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="size-5" />
            <span className="text-xs font-black">پرو آنلاین واقعی و هوشمند مینی رویال</span>
          </div>
          <h2 className="mt-2 text-xl font-black">اول سایز مناسب را پیدا کن، بعد لباس را روی عکس ببین</h2>
          <p className="mt-1 text-xs text-violet-200">تصویر شما فقط برای همین درخواست پردازش می‌شود و کلید AI در مرورگر قرار نمی‌گیرد.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* بج سهمیه کاربر */}
          {quota.unlimited ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-200">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>پرو نامحدود مدیر</span>
            </div>
          ) : quota.remaining !== null ? (
            <div className="flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/20 px-3.5 py-1.5 text-xs font-bold text-violet-200">
              <span>سهمیه رایگان شما:</span>
              <strong className="text-amber-300">
                {toPersianDigits(quota.remaining)} از {toPersianDigits(quota.limit || 5)}
              </strong>
            </div>
          ) : null}

          {/* تب‌ها */}
          <div className="flex rounded-xl bg-white/10 p-1">
            <button
              onClick={() => setTab("fit")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${tab === "fit" ? "bg-violet-600 shadow" : "text-violet-100 hover:text-white"}`}
            >
              پیشنهاد سایز
            </button>
            <button
              onClick={() => setTab("photo")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${tab === "photo" ? "bg-fuchsia-600 shadow" : "text-violet-100 hover:text-white"}`}
            >
              پرو با عکس
            </button>
          </div>
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

          <div className="flex flex-col justify-between rounded-3xl border border-emerald-400/30 bg-emerald-950/40 p-6">
            <div>
              <p className="text-xs font-bold text-emerald-300">پیشنهاد سایز هوشمند «{product.title}»</p>
              <div className="mt-5 flex items-end gap-3">
                <strong className="text-4xl text-amber-300">{fit.size}</strong>
                <span className="mb-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-stone-950">{toPersianDigits(fit.confidence)}٪ اطمینان</span>
              </div>
              <ul className="mt-5 space-y-3 text-xs leading-6 text-emerald-100">
                {fit.reasons.map((reason) => (
                  <li key={reason}>✓ {reason}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {/* دکمه افزودن مستقیم به سبد خرید با سایز پیشنهادی */}
              {matchingVariant && matchingVariant.stock > 0 ? (
                <button
                  type="button"
                  onClick={handleAddFittedToCart}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-stone-950 shadow-lg hover:bg-emerald-400 transition"
                >
                  {addedToCartSuccess ? (
                    <>
                      <Check className="size-4 text-stone-950" />
                      به سبد خرید اضافه شد!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-4" />
                      افزودن سایز {fit.size} به سبد خرید
                    </>
                  )}
                </button>
              ) : (
                <p className="text-center text-xs font-bold text-rose-300 bg-rose-950/40 p-2 rounded-xl">
                  سایز پیشنهادی {fit.size} در حال حاضر ناموجود است.
                </p>
              )}

              <button
                type="button"
                onClick={() => setTab("photo")}
                className="w-full rounded-xl bg-fuchsia-600 py-3 text-xs font-black hover:bg-fuchsia-500 transition"
              >
                حالا پرو با عکس را امتحان کن
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-dashed border-violet-300/50 bg-white/5 p-6">
            <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-black text-amber-300">لباس انتخاب‌شده برای پرو</p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={garmentSource} alt={`لباس ${product.title}`} className="size-24 rounded-xl bg-stone-100 object-contain p-1" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{product.title}</p>
                  <p className="mt-1 text-[11px] text-violet-200">سایز پیشنهادی: <strong className="text-amber-300">{fit.size}</strong></p>
                </div>
              </div>
            </div>

            <label
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-8 text-center transition ${isDragging ? "border-amber-300 bg-amber-300/20" : "border-white/10 hover:bg-white/10"}`}
            >
              <Camera className="size-10 text-violet-300" />
              <span className="mt-3 text-sm font-black">عکس تمام‌قد کودک را انتخاب کن</span>
              <span className="mt-2 text-xs text-violet-200">JPG یا PNG، حداکثر ۸ مگابایت</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={onUpload} />
            </label>

            {personImage && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] font-bold text-violet-200">عکس شما</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personImage} alt="پیش‌نمایش عکس کاربر" className="aspect-square w-full rounded-2xl bg-black/20 object-contain" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold text-emerald-200">{resultImage ? "نتیجه پرو" : "مرجع لباس"}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultImage ?? garmentSource} alt={resultImage ? "نتیجه پرو آنلاین" : `مرجع لباس ${product.title}`} className="aspect-square w-full rounded-2xl bg-stone-100 object-contain p-2" />
                </div>
              </div>
            )}

            {error && <p className="mt-4 rounded-xl bg-rose-950/60 p-3 text-xs font-bold text-rose-200">{error}</p>}

            <div className="mt-5 flex gap-2">
              {!customer ? (
                <Link
                  href={`/account?next=%2Fproduct%2F${product.slug}%23tryon-section`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-xs font-black text-white hover:opacity-95 shadow-md"
                >
                  <LogIn className="size-4" />
                  ورود برای اجرای پرو با عکس
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={runTryOn}
                  disabled={!personImage || busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-xs font-black disabled:opacity-50 hover:opacity-95 shadow-md"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      در حال پردازش هوش مصنوعی...
                    </>
                  ) : (
                    <>
                      <UserRound className="size-4" />
                      اجرای پرو واقعی با عکس
                    </>
                  )}
                </button>
              )}
              {personImage && (
                <button
                  type="button"
                  onClick={resetPhoto}
                  className="rounded-xl bg-white/10 px-4 hover:bg-white/20 transition"
                  title="پاک کردن عکس"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-white/5 p-6 text-sm leading-8 text-violet-100">
            <div>
              <h3 className="font-black text-white">نکات عکاسی برای بهترین تن‌خور AI</h3>
              <p className="mt-3">
                کودک روبه‌روی دوربین، ایستاده و با نور یکنواخت عکاسی شود. لباس فعلی ساده باشد و دست‌ها جلوی تنه قرار نگیرند. مدل هوش مصنوعی چهره، پس‌زمینه و آناتومی را حفظ کرده و لباس کاتالوگ را جایگزین می‌کند.
              </p>
              <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs text-amber-100">
                💡 این تصویر برای ارزیابی جلوه و هماهنگی لباس است؛ اندازهٔ قطعی خرید را بر اساس جدول سانتی‌متری سایز و پیشنهاد هوشمند بالا انتخاب کنید.
              </p>
            </div>

            {resultImage && (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                {matchingVariant && matchingVariant.stock > 0 && (
                  <button
                    type="button"
                    onClick={handleAddFittedToCart}
                    className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-stone-950 hover:bg-emerald-400 transition"
                  >
                    {addedToCartSuccess ? (
                      <>
                        <Check className="size-4" />
                        به سبد خرید اضافه شد
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        افزودن همین لباس (سایز {fit.size}) به سبد
                      </>
                    )}
                  </button>
                )}
                <a
                  href={resultImage}
                  download={`miniroyal-tryon-${product.slug}.png`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-xs font-bold text-white hover:bg-white/25 transition"
                >
                  <Download className="size-4" />
                  دانلود
                </a>
              </div>
            )}
          </div>

          {/* بخش نتیجه پرو و اسلایدر مقایسه هوشمند */}
          {resultImage && (
            <div className="lg:col-span-2 rounded-3xl border border-emerald-300/40 bg-emerald-950/30 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-300">نتیجهٔ تأییدشدهٔ پرو آنلاین</p>
                  <p className="mt-1 text-[11px] text-emerald-100/80">لباس انتخاب‌شده روی عکس با موفقیت جایگزین شد.</p>
                </div>
                <div className="flex items-center gap-2">
                  {personImage && (
                    <button
                      type="button"
                      onClick={() => setShowCompareSlider(!showCompareSlider)}
                      className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-900/50 px-3 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-800/60 transition"
                    >
                      <SlidersHorizontal className="size-3" />
                      {showCompareSlider ? "نمایش تکی" : "حالت مقایسه قبل و بعد"}
                    </button>
                  )}
                  <span className="rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black text-stone-950">آماده مشاهده</span>
                </div>
              </div>

              {showCompareSlider && personImage ? (
                <div className="mt-4">
                  <TryonCompareSlider
                    beforeImage={personImage}
                    afterImage={resultImage}
                    productTitle={product.title}
                  />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resultImage}
                  alt={`نتیجه پرو آنلاین لباس ${product.title}`}
                  className="mx-auto max-h-[800px] w-full rounded-2xl bg-stone-100 object-contain shadow-2xl"
                />
              )}

              {/* اکشن بار پایین نتیجه */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-400/20 pt-4">
                <div className="text-xs text-emerald-200">
                  سایز پیشنهادی برای خرید: <strong className="text-amber-300 text-sm">{fit.size}</strong>
                </div>
                <div className="flex items-center gap-3">
                  {matchingVariant && matchingVariant.stock > 0 && (
                    <button
                      type="button"
                      onClick={handleAddFittedToCart}
                      className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-black text-stone-950 shadow hover:bg-emerald-300 transition"
                    >
                      {addedToCartSuccess ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
                      {addedToCartSuccess ? "اضافه شد!" : `خرید سایز ${fit.size}`}
                    </button>
                  )}
                  <a
                    href={resultImage}
                    download={`miniroyal-tryon-${product.slug}.png`}
                    className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    <Download className="size-3.5" />
                    دانلود عکس نهایی
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
