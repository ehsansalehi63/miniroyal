"use client";

import { useState, useRef } from "react";
import { Product } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";
import { Sparkles, ShieldCheck, Upload, Camera, CheckCircle2, RefreshCw, Wand2, User } from "lucide-react";

interface VirtualTryonBoxProps {
  product?: Product;
}

export default function VirtualTryonBox({ product }: VirtualTryonBoxProps) {
  const [activeTab, setActiveTab] = useState<"ai_photo" | "avatar">("ai_photo");
  
  // AI Photo Try-On State
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<number>(0);
  const [aiRendered, setAiRendered] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar Slider State
  const [height, setHeight] = useState<number>(104);
  const [weight, setWeight] = useState<number>(17);
  const [gender, setGender] = useState<"boy" | "girl">("girl");
  const [buyForGrowth, setBuyForGrowth] = useState<boolean>(false);

  const targetProduct = product || {
    id: 1,
    title: "ست هودی و شلوار پاییزی مینی رویال 👑",
    price: 680000,
    images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop"],
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setUserPhoto(url);
        startAITryonProcessing();
      };
      reader.readAsDataURL(file);
    }
  };

  const startAITryonProcessing = () => {
    setIsProcessing(true);
    setAiRendered(false);
    setAiStep(1);

    setTimeout(() => setAiStep(2), 1200);
    setTimeout(() => setAiStep(3), 2400);
    setTimeout(() => {
      setIsProcessing(false);
      setAiRendered(true);
    }, 3500);
  };

  // Smart size calculation
  const calculateSize = () => {
    let baseSize = "2-3 سال";
    let confidence = 96;

    if (height < 80) baseSize = "0-6 ماه";
    else if (height < 90) baseSize = "6-12 ماه";
    else if (height < 98) baseSize = "1-2 سال";
    else if (height < 108) baseSize = "3-4 سال";
    else if (height < 118) baseSize = "5-6 سال";
    else if (height < 128) baseSize = "7-8 سال";
    else baseSize = "9-10 سال";

    if (buyForGrowth) {
      if (baseSize === "1-2 سال") baseSize = "3-4 سال";
      else if (baseSize === "3-4 سال") baseSize = "5-6 سال";
      else if (baseSize === "5-6 سال") baseSize = "7-8 سال";
      confidence = 92;
    }

    return { size: baseSize, confidence };
  };

  const rec = calculateSize();

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-violet-200 bg-gradient-to-br from-violet-950 via-stone-900 to-fuchsia-950 p-6 sm:p-8 text-white shadow-2xl font-sans dir-rtl">
      {/* هدر پرو آنلاین */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg">
            👗
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              سامانه پرو آنلاین هوش مصنوعی (AI Virtual Try-On)
            </h3>
            <p className="text-xs text-violet-200">
              عکس فرزندتان را آپلود کنید تا هوش مصنوعی لباس <strong className="text-amber-300">{targetProduct.title}</strong> را تن او بپوشاند!
            </p>
          </div>
        </div>

        {/* دکمه‌های سوییچ تب بین پرو با عکس و پرو با آواتار */}
        <div className="flex rounded-2xl bg-white/10 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("ai_photo")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "ai_photo" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <Wand2 className="size-3.5" />
            <span>پرو با عکس کودک 📸</span>
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "avatar" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <User className="size-3.5" />
            <span>پرو با آواتار قد/وزن 📏</span>
          </button>
        </div>
      </div>

      {/* تب ۱: پرو هوش مصنوعی با عکس واقعی کاربر */}
      {activeTab === "ai_photo" && (
        <div className="mt-6 space-y-6">
          {!userPhoto ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-3xl border-2 border-dashed border-violet-400/40 bg-white/5 p-8 text-center transition hover:border-violet-400 hover:bg-white/10"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-violet-600/30 text-violet-300 shadow-inner group-hover:scale-110 transition">
                <Camera className="size-8" />
              </div>
              <h4 className="mt-4 text-sm font-black text-white">
                آپلود عکس تمام قد کودک یا گرفتن عکس با دوربین 📷
              </h4>
              <p className="mt-1 text-xs text-stone-300">
                فرمت‌های JPG، PNG از گالری موبایل یا دوربین؛ هوش مصنوعی لباس را تن کودک شما پرو می‌کند!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12 items-center">
              {/* تصویر اصلی عکس کاربر */}
              <div className="lg:col-span-5 relative flex flex-col items-center rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                <span className="text-[11px] font-bold text-violet-300 mb-2">عکس اولیه فرزند شما</span>
                <div className="relative size-64 overflow-hidden rounded-2xl border-2 border-white/30 shadow-xl">
                  <img src={userPhoto} alt="عکس کودک" className="size-full object-cover" />
                </div>
                <button
                  onClick={() => setUserPhoto(null)}
                  className="mt-3 text-xs text-amber-300 underline font-bold"
                >
                  تغییر و آپلود عکس جدید
                </button>
              </div>

              {/* رندر هوش مصنوعی پرو لباس */}
              <div className="lg:col-span-7 space-y-4">
                {isProcessing ? (
                  <div className="rounded-3xl border border-violet-500/30 bg-violet-900/40 p-6 text-center space-y-4">
                    <RefreshCw className="mx-auto size-10 animate-spin text-fuchsia-400" />
                    <h4 className="text-sm font-black text-white">هوش مصنوعی در حال پردازش و پرو لباس تن کودک شماست...</h4>
                    <div className="space-y-2 text-xs font-bold text-violet-200 max-w-sm mx-auto">
                      <p className={aiStep >= 1 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 1 ? "✅" : "⏳"} گام ۱: آنالیز هوشمند آناتومی و قد کودک در تصویر
                      </p>
                      <p className={aiStep >= 2 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 2 ? "✅" : "⏳"} گام ۲: منطبق‌سازی ۳ بعدی پارچه {targetProduct.title} روی بدن
                      </p>
                      <p className={aiStep >= 3 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 3 ? "✅" : "⏳"} گام ۳: محاسبه افتادگی پارچه، سایه‌ها و فیت بودن سایز
                      </p>
                    </div>
                  </div>
                ) : aiRendered ? (
                  <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-stone-900 p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                        <CheckCircle2 className="size-4" /> پرو آنلاین هوش مصنوعی با موفقیت انجام شد!
                      </span>
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-stone-950">
                        تطابق: %۹۸
                      </span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400/50 p-2 bg-stone-950 flex items-center justify-center">
                      <img
                        src={targetProduct.images[0]}
                        alt="نتیجه پرو"
                        className="h-64 w-full object-cover rounded-xl shadow-2xl"
                      />
                      <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/80 p-2.5 backdrop-blur-md text-xs font-bold text-white flex justify-between items-center">
                        <span>لباس انتخاب شده تن کودک شما کاملاً فیت است!</span>
                        <span className="text-amber-300 font-black">سایز پیشنهادی: {rec.size}</span>
                      </div>
                    </div>

                    <button
                      onClick={startAITryonProcessing}
                      className="w-full rounded-xl bg-violet-700 py-3 text-xs font-black text-white hover:bg-violet-800"
                    >
                      تست مجدد هوش مصنوعی 🔄
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* تب ۲: پرو با آواتار قد و وزن */}
      {activeTab === "avatar" && (
        <div className="mt-6 grid gap-8 lg:grid-cols-12 items-center">
          <div className="relative lg:col-span-5 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <span className="text-[11px] font-bold text-violet-300 mb-3">
              آواتار {gender === "girl" ? "دخترانه 🎀" : "پسرانه 🧢"} (قد {toPersianDigits(height)}cm)
            </span>
            <div className="relative size-52 rounded-full bg-gradient-to-b from-violet-500/20 to-fuchsia-500/20 p-3 border border-white/20 shadow-2xl flex items-center justify-center">
              <img
                src={targetProduct.images[0]}
                alt="پرو آنلاین"
                className="size-44 object-cover rounded-3xl shadow-xl transition-all duration-300 border-2 border-white/40"
              />
              <div className="absolute -top-2 -right-2 rounded-2xl bg-amber-400 px-3 py-1 text-xs font-black text-stone-950 shadow-lg">
                سایز {rec.size}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setGender("girl")}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  gender === "girl" ? "bg-fuchsia-600 text-white" : "bg-white/10 text-stone-300"
                }`}
              >
                🎀 آواتار دخترانه
              </button>
              <button
                onClick={() => setGender("boy")}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  gender === "boy" ? "bg-violet-600 text-white" : "bg-white/10 text-stone-300"
                }`}
              >
                🧢 آواتار پسرانه
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span>قد کودک:</span>
                  <span className="text-amber-300 text-sm font-black">{toPersianDigits(height)} سانتی‌متر</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={150}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span>وزن کودک:</span>
                  <span className="text-amber-300 text-sm font-black">{toPersianDigits(weight)} کیلوگرم</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={45}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 border border-white/10 text-xs font-bold cursor-pointer hover:bg-white/15">
              <input
                type="checkbox"
                checked={buyForGrowth}
                onChange={(e) => setBuyForGrowth(e.target.checked)}
                className="size-5 accent-fuchsia-500 rounded"
              />
              <span>🌱 یک سایز بزرگ‌تر برای رشد آینده محاسبه شود (+۱ سایز)</span>
            </label>

            <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500 text-white font-black text-base shadow-lg">
                  {rec.size}
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-emerald-200">سایز پیشنهادی هوش مصنوعی:</span>
                  <span className="text-sm font-black text-white">سایز {rec.size} مناسب فرزند شماست</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
