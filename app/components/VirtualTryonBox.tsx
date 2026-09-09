"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  Crown,
  Download,
  LogIn,
  RotateCcw,
  Scan,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
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

const SCAN_STAGES = [
  "اسکن آناتومیک و سنجش نسبت‌های قامتی کودک...",
  "تطبیق بافت پارچه، الگوی برش و درزهای مزون...",
  "نورپردازی سه‌بعدی و عکاسی استودیویی رویال...",
];

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.readAsDataURL(file);
  });
}

function compressImage(source: string, maxSide = 832, quality = 0.68) {
  // Two photos (child + garment) travel in ONE JSON POST through Hostinger's
  // front proxy, so each side is capped (~1.6MB) to stay far below typical
  // shared-hosting request-body limits (413) while keeping enough detail
  // for the AI edit + identity verification (which downscales anyway).
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
      for (const nextQuality of [0.6, 0.52, 0.44]) {
        if (encoded.length <= 1_600_000) break;
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
  const [scanStage, setScanStage] = useState(0);
  const [scanProgress, setScanProgress] = useState(24);
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
    setScanStage(0);
    setScanProgress(18);

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 8 + 4) : prev));
    }, 600);

    const stageTimer = setInterval(() => {
      setScanStage((prev) => (prev + 1) % SCAN_STAGES.length);
    }, 2800);

    try {
      const response = await fetch("/api/ai-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImage,
          garmentImage: await compressImage(await sourceToDataUrl(product.tryOnAsset?.url ?? product.images[0])),
          productId: product.id,
          requestedSize: fit.size,
          // محصولات اکسسوری (کلاه، کیف، کفش و...) با پرامپت اختصاصی اکسسوری
          // در مدل‌های ویرایش تصویر پردازش شوند، نه مدل VTON لباس.
          ...(product.tryOnAsset?.layerType === "accessory" ? { kind: "accessory" } : {}),
        }),
      });
      const responseText = await response.text();
      let data: { success?: boolean; imageUrl?: string; error?: string; code?: string; reason?: string; attempts?: Array<{ provider: string; status: number | null; detail: string }>; remaining?: number | null; unlimited?: boolean; notice?: string } = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        if (responseText.trimStart().startsWith("<")) {
          throw new Error(
            response.status === 502 || response.status === 504
              ? "سرویس پرو آنلاین موقتاً با وقفه پاسخ مواجه شد (کد ۵۰۲). لطفاً لحظاتی بعد مجدداً تلاش کنید."
              : `پاسخ غیرمنتظره از سرور دریافت شد (کد ${response.status})؛ لطفاً دوباره تلاش کنید.`
          );
        }
        throw new Error("پاسخ نامعتبر از سرویس پرو آنلاین دریافت شد.");
      }
      if (!response.ok || !data.success || !data.imageUrl) {
        // سیاست سخت‌گیرانه: اگر اتصال هوش مصنوعی برقرار نشد، فقط پیام خطای
        // صادقانه نمایش داده می‌شود؛ هیچ عکس جایگزین/ساختگی ساخته نمی‌شود.
        // علت دقیق (امن، بدون کلید) در کنسول مرورگر لاگ می‌شود تا برای
        // پشتیبانی قابل ارسال باشد.
        console.warn("[tryon-failure]", { code: data.code, reason: data.reason, attempts: data.attempts });
        throw new Error(
          data.error ||
            "اتصال به سرویس هوش مصنوعی برقرار نشد و تصویری تولید نشد. لطفاً دوباره تلاش کنید."
        );
      }
      setScanProgress(100);
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
      clearInterval(progressTimer);
      clearInterval(stageTimer);
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
    <section
      dir="rtl"
      data-tryon-version="2"
      className="relative overflow-hidden rounded-[28px] border border-amber-500/30 bg-[#0d0c0b]/95 p-5 text-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-amber-400/15 sm:p-8"
    >
      {/* هاله نور پس‌زمینه مزون اختصاصی */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-amber-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-600/10 blur-[100px]" />

      {/* هدر آتلیه سلطنتی همراه با نشان پرستیژ و سهمیه */}
      <div className="relative z-10 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-300">
            <Crown className="size-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <span className="text-xs font-black tracking-wide">آتلیه هوشمند پرو سلطنتی مینی رویال</span>
          </div>
          <h2 className="mt-2 text-xl font-black sm:text-2xl text-stone-100">
            تجربهٔ تن‌خور اختصاصی مزون با هوش مصنوعی
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            سنجش میلیمتریک الگوی اندام کودک و انطباق سه‌بعدی بافت لباس در محیط اختصاصی آتلیه.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* بج سهمیه متالیک */}
          {quota.unlimited ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1.5 text-xs font-bold text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>پرو نامحدود مدیر</span>
            </div>
          ) : quota.remaining !== null ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-stone-900/80 px-4 py-1.5 text-xs font-bold text-amber-200 shadow-sm backdrop-blur-md">
              <span className="text-stone-400">سهمیه آتلیه:</span>
              <strong className="text-amber-300">
                {toPersianDigits(quota.remaining)} از {toPersianDigits(quota.limit || 5)}
              </strong>
            </div>
          ) : null}

          {/* کلید تغییر حالت‌های آتلیه */}
          <div className="flex rounded-xl border border-stone-700/60 bg-stone-900/90 p-1 backdrop-blur">
            <button
              onClick={() => setTab("fit")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                tab === "fit"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              آنالیز سایز
            </button>
            <button
              onClick={() => setTab("photo")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                tab === "photo"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              عکاسی و پرو با عکس
            </button>
          </div>
        </div>
      </div>

      {tab === "fit" ? (
        <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          {/* فرم کنترلرهای ابعاد با فیدبک فیزیکی بدون تاخیر */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              قد کودک
              <motion.span
                key={heightCm}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 block text-lg font-black text-amber-300"
              >
                {toPersianDigits(heightCm)} سانتی‌متر
              </motion.span>
              <input
                className="mt-3 w-full accent-amber-400 cursor-pointer"
                type="range"
                min="55"
                max="170"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
              />
            </label>

            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              وزن کودک
              <motion.span
                key={weightKg}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 block text-lg font-black text-amber-300"
              >
                {toPersianDigits(weightKg)} کیلوگرم
              </motion.span>
              <input
                className="mt-3 w-full accent-amber-400 cursor-pointer"
                type="range"
                min="3"
                max="60"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
            </label>

            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              سن کودک
              <motion.span
                key={ageMonths}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 block text-lg font-black text-amber-300"
              >
                {toPersianDigits(Math.floor(ageMonths / 12))} سال
              </motion.span>
              <input
                className="mt-3 w-full accent-amber-400 cursor-pointer"
                type="range"
                min="0"
                max="204"
                value={ageMonths}
                onChange={(e) => setAgeMonths(Number(e.target.value))}
              />
            </label>

            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              دور سینه
              <motion.span
                key={chestCm}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 block text-lg font-black text-amber-300"
              >
                {toPersianDigits(chestCm)} سانتی‌متر
              </motion.span>
              <input
                className="mt-3 w-full accent-amber-400 cursor-pointer"
                type="range"
                min="30"
                max="110"
                value={chestCm}
                onChange={(e) => setChestCm(Number(e.target.value))}
              />
            </label>

            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              دور کمر
              <motion.span
                key={waistCm}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 block text-lg font-black text-amber-300"
              >
                {toPersianDigits(waistCm)} سانتی‌متر
              </motion.span>
              <input
                className="mt-3 w-full accent-amber-400 cursor-pointer"
                type="range"
                min="25"
                max="100"
                value={waistCm}
                onChange={(e) => setWaistCm(Number(e.target.value))}
              />
            </label>

            <label className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 backdrop-blur-sm transition hover:border-stone-700">
              جنسیت
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
                className="mt-3 w-full rounded-xl border border-stone-700 bg-stone-950 p-2.5 text-xs font-bold text-white outline-none"
              >
                <option value="girl">دخترانه</option>
                <option value="boy">پسرانه</option>
                <option value="unisex">یونیسکس</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-xs font-bold text-stone-300 sm:col-span-2 cursor-pointer">
              <input
                type="checkbox"
                checked={buyForGrowth}
                onChange={(e) => setBuyForGrowth(e.target.checked)}
                className="size-4 accent-amber-500 rounded"
              />
              <span>برای رشد آینده کودک کمی آزادتر و راحت‌تر در نظر گرفته شود</span>
            </label>
          </div>

          {/* کارت پیشنهاد هوشمند با قاب طلایی-دودی و استیت‌های فیزیکی */}
          <div className="flex flex-col justify-between rounded-[24px] border border-amber-500/30 bg-gradient-to-b from-stone-900/90 to-[#12100d]/95 p-6 shadow-xl backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-300">
                  پیشنهاد دقیق آتلیه برای «{product.title}»
                </p>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-0.5 text-[10px] font-black text-amber-300">
                  تطبیق هوشمند
                </span>
              </div>

              <div className="mt-5 flex items-end gap-3">
                <motion.strong
                  key={fit.size}
                  initial={{ scale: 0.8, y: 5 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 drop-shadow-sm"
                >
                  {fit.size}
                </motion.strong>
                <span className="mb-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-stone-950 shadow-sm">
                  {toPersianDigits(fit.confidence)}٪ تطابق قدی و وزنی
                </span>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs leading-6 text-stone-300">
                {fit.reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {matchingVariant && matchingVariant.stock > 0 ? (
                <button
                  type="button"
                  onClick={handleAddFittedToCart}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-xs font-black text-stone-950 shadow-lg hover:from-emerald-400 hover:to-emerald-500 transition active:scale-[0.98]"
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
                <p className="text-center text-xs font-bold text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                  سایز پیشنهادی {fit.size} در حال حاضر ناموجود است.
                </p>
              )}

              <button
                type="button"
                onClick={() => setTab("photo")}
                className="w-full rounded-xl border border-amber-500/40 bg-stone-900/80 py-3 text-xs font-black text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
              >
                مرحلهٔ بعد: پرو زنده روی عکس کودک ←
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] border border-amber-500/20 bg-stone-900/50 p-6 backdrop-blur-xl">
            {/* کارت خلاصه لباس */}
            <div className="mb-5 rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={garmentSource}
                alt={`لباس ${product.title}`}
                className="size-20 rounded-xl bg-stone-100 object-contain p-1"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{product.title}</p>
                <p className="mt-1 text-[11px] text-stone-300">
                  سایز پیشنهادی آتلیه: <strong className="text-amber-300 font-bold">{fit.size}</strong>
                </p>
              </div>
            </div>

            {/* محفظه عکاسی و اسکن شبیه‌ساز اختصاصی آتلیه */}
            {busy ? (
              <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-stone-950 p-6 shadow-2xl">
                {/* پس‌زمینه عکس کاربر با فیلتر تار و شبیه‌سازی اسکن */}
                {personImage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={personImage}
                    alt="در حال اسکن"
                    className="absolute inset-0 size-full object-cover opacity-35 filter blur-[1px]"
                  />
                )}

                {/* شبکه بافت و خطوط مختصات مزون */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18)_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* پرتو لیزر متحرک اسکن تن‌خور */}
                <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_20px_rgba(251,191,36,1)] animate-scan-laser" />

                {/* کروشه‌های فوکوس کادربندی عکاسی آتلیه */}
                <div className="pointer-events-none absolute inset-4 border border-amber-400/20">
                  <div className="absolute -left-1 -top-1 size-4 border-l-2 border-t-2 border-amber-400" />
                  <div className="absolute -right-1 -top-1 size-4 border-r-2 border-t-2 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-amber-400" />
                </div>

                {/* کادر لودینگ اختصاصی آتلیه */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-3 flex size-16 items-center justify-center rounded-full border border-amber-400/50 bg-stone-950/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                    <Scan className="size-8 text-amber-400 animate-pulse" />
                  </div>

                  <span className="text-xs font-black text-amber-300">
                    {SCAN_STAGES[scanStage]}
                  </span>

                  {/* نوار پیشرفت اسکن */}
                  <div className="mt-4 w-48 overflow-hidden rounded-full bg-stone-800/80 p-0.5 border border-stone-700">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-stone-400">
                    پیشرفت پردازش: {toPersianDigits(scanProgress)}٪
                  </span>
                </div>
              </div>
            ) : (
              <>
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-amber-400/30 bg-stone-950/40 hover:border-amber-400/60 hover:bg-stone-950/70"
                  }`}
                >
                  <Camera className="size-10 text-amber-400 drop-shadow" />
                  <span className="mt-3 text-sm font-black">انتخاب عکس تمام‌قد کودک</span>
                  <span className="mt-2 text-xs text-stone-400">فرمت JPG یا PNG، حداکثر ۸ مگابایت</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="user"
                    className="hidden"
                    onChange={onUpload}
                  />
                </label>

                {personImage && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="overflow-hidden rounded-xl border border-stone-800 bg-black/40 p-1">
                      <p className="mb-1 text-[10px] font-bold text-stone-400 pr-1">عکس ورودی شما</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={personImage}
                        alt="پیش‌نمایش عکس کاربر"
                        className="aspect-square w-full rounded-lg object-contain"
                      />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-stone-800 bg-black/40 p-1">
                      <p className="mb-1 text-[10px] font-bold text-amber-300 pr-1">
                        {resultImage ? "نتیجه آتلیه" : "مرجع لباس"}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resultImage ?? garmentSource}
                        alt={resultImage ? "نتیجه پرو آنلاین" : `مرجع لباس ${product.title}`}
                        className="aspect-square w-full rounded-lg bg-stone-100 object-contain p-2"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-800/60 bg-rose-950/80 p-3">
                <p className="text-xs font-bold leading-6 text-rose-200">{error}</p>
                {!busy && personImage && (
                  <button
                    type="button"
                    onClick={runTryOn}
                    className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-rose-700/60 bg-rose-900/60 px-3 py-1.5 text-[11px] font-black text-rose-100 transition hover:bg-rose-800/70"
                  >
                    <RotateCcw className="size-3.5" />
                    تلاش مجدد برای اتصال به سرویس هوش مصنوعی
                  </button>
                )}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              {!customer ? (
                <Link
                  href={`/account?next=%2Fproduct%2F${product.slug}%23tryon-section`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-stone-950 hover:from-amber-400 hover:to-amber-500 shadow-md transition"
                >
                  <LogIn className="size-4" />
                  ورود برای اجرای پرو با عکس
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={runTryOn}
                  disabled={!personImage || busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-stone-950 disabled:opacity-50 hover:from-amber-400 hover:to-amber-500 shadow-md transition"
                >
                  <UserRound className="size-4" />
                  اجرای پرو در آتلیه هوشمند
                </button>
              )}
              {personImage && !busy && (
                <button
                  type="button"
                  onClick={resetPhoto}
                  className="rounded-xl border border-stone-700 bg-stone-900/80 px-4 hover:bg-stone-800 transition"
                  title="پاک کردن عکس"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* پنل راهنمای عکاسی مزون */}
          <div className="flex flex-col justify-between rounded-[24px] border border-stone-800 bg-stone-900/40 p-6 text-sm leading-8 text-stone-300 backdrop-blur-xl">
            <div>
              <h3 className="font-black text-stone-100 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                استاندارد عکاسی مزون برای بهترین نتیجهٔ تن‌خور
              </h3>
              <p className="mt-3 text-xs leading-6 text-stone-300">
                کودک در برابر دوربین، ایستاده و با نور طبیعی یا یکنواخت اتاق قرار گیرد. لباس فعلی ساده باشد تا مدل هوش مصنوعی چهره، موها و پرسپکتیو را کاملاً حفظ کرده و پارچهٔ محصول را با بافت دقیق شبیه‌سازی کند.
              </p>
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
                💡 تصویر حاصل به شما دید کاملی از جلوه و هارمونی لباس روی فرزندتان می‌دهد. سایز فیزیکی را بر اساس پیشنهاد هوشمند و جدول اندازه‌گیری انتخاب فرمایید.
              </div>
            </div>

            {resultImage && (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                {matchingVariant && matchingVariant.stock > 0 && (
                  <button
                    type="button"
                    onClick={handleAddFittedToCart}
                    className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-xs font-black text-stone-950 hover:from-emerald-400 hover:to-emerald-500 transition shadow-lg"
                  >
                    {addedToCartSuccess ? (
                      <>
                        <Check className="size-4" />
                        به سبد خرید اضافه شد
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        خرید مستقیم همین مدل (سایز {fit.size})
                      </>
                    )}
                  </button>
                )}
                <a
                  href={resultImage}
                  download={`miniroyal-atelier-${product.slug}.png`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-900/80 px-5 py-3.5 text-xs font-bold text-white hover:bg-stone-800 transition"
                >
                  <Download className="size-4 text-amber-400" />
                  دانلود پرتره
                </a>
              </div>
            )}
          </div>

          {/* بخش مقایسه قبل و بعد با اسلایدر عکاسی اختصاصی */}
          {resultImage && (
            <div className="lg:col-span-2 rounded-[24px] border border-amber-500/30 bg-stone-950/90 p-4 sm:p-6 shadow-2xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-300">
                    پرتره نهایی آمادهٔ مشاهده در آتلیه مینی رویال
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    تن‌خور اختصاصی با حفظ نور، ژست و چهرهٔ کودک ثبت شد.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {personImage && (
                    <button
                      type="button"
                      onClick={() => setShowCompareSlider(!showCompareSlider)}
                      className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition"
                    >
                      <SlidersHorizontal className="size-3" />
                      {showCompareSlider ? "نمایش تکی" : "اسلایدر مقایسه قبل و بعد"}
                    </button>
                  )}
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-stone-950">
                    تأیید شد
                  </span>
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
                  className="mx-auto max-h-[800px] w-full rounded-2xl bg-stone-900 object-contain shadow-2xl"
                />
              )}

              {/* اکشن بار پایین نتیجه */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-800 pt-4">
                <div className="text-xs text-stone-300">
                  سایز برگزیده برای خرید:{" "}
                  <strong className="text-amber-300 text-sm">{fit.size}</strong>
                </div>
                <div className="flex items-center gap-3">
                  {matchingVariant && matchingVariant.stock > 0 && (
                    <button
                      type="button"
                      onClick={handleAddFittedToCart}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md hover:from-emerald-400 hover:to-emerald-500 transition"
                    >
                      {addedToCartSuccess ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
                      {addedToCartSuccess ? "اضافه شد!" : `خرید سایز ${fit.size}`}
                    </button>
                  )}
                  <a
                    href={resultImage}
                    download={`miniroyal-tryon-${product.slug}.png`}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition"
                  >
                    <Download className="size-3.5 text-amber-400" />
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
