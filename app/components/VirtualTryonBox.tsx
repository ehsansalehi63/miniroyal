"use client";

import { useState } from "react";
import { Product } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";
import { Sparkles, CheckCircle2, ShieldCheck, Ruler, UserCheck } from "lucide-react";

interface VirtualTryonBoxProps {
  product?: Product;
}

export default function VirtualTryonBox({ product }: VirtualTryonBoxProps) {
  const [height, setHeight] = useState<number>(104);
  const [weight, setWeight] = useState<number>(17);
  const [gender, setGender] = useState<"boy" | "girl">("girl");
  const [outfitColor, setOutfitColor] = useState<string>("violet");
  const [buyForGrowth, setBuyForGrowth] = useState<boolean>(false);

  // Default product if not provided
  const targetProduct = product || {
    id: 1,
    title: "ست هودی و شلوار پاییزی مینی رویال 👑",
    price: 680000,
    images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop"],
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

    if (weight > 22 && height < 110) {
      confidence = 90;
    }

    if (buyForGrowth) {
      if (baseSize === "1-2 سال") baseSize = "3-4 سال";
      else if (baseSize === "3-4 سال") baseSize = "5-6 سال";
      else if (baseSize === "5-6 سال") baseSize = "7-8 سال";
      else if (baseSize === "7-8 سال") baseSize = "9-10 سال";
      confidence = 92;
    }

    return { size: baseSize, confidence };
  };

  const rec = calculateSize();

  // Dynamic avatar scale based on height
  const avatarScale = Math.min(1.2, Math.max(0.8, height / 110));

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-violet-200 bg-gradient-to-br from-violet-900 via-stone-900 to-fuchsia-950 p-6 sm:p-8 text-white shadow-2xl font-sans dir-rtl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg">
            👗
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              پرو آنلاین و آواتار ۳ بعدی هوشمند (Smart Fit)
            </h3>
            <p className="text-xs text-violet-200">
              لباس <strong className="text-amber-300">{targetProduct.title}</strong> را تن آواتار فرزندت ببین!
            </p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="size-4" /> ۱۰۰٪ تضمین تعویض سایز
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 items-center">
        {/* آواتار ۳ بعدی شبیه‌سازی‌شده */}
        <div className="relative lg:col-span-5 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-violet-300">
              آواتار {gender === "girl" ? "دخترانه 🎀" : "پسرانه 🧢"} (قد {toPersianDigits(height)}cm)
            </span>
          </div>

          {/* نمای سه بعدی آواتار */}
          <div
            className="relative flex items-center justify-center transition-all duration-500"
            style={{ transform: `scale(${avatarScale})` }}
          >
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

        {/* اسلایدرها و کنترل‌ها */}
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

          {/* باکس نهایی نتیجه سایز */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500 text-white font-black text-lg shadow-lg">
                {rec.size}
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-emerald-200">سایز پیشنهادی هوش مصنوعی:</span>
                <span className="text-base font-black text-white">سایز {rec.size} مناسب فرزند شماست</span>
              </div>
            </div>

            <div className="text-left">
              <span className="rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-black text-stone-950">
                درصد اطمینان: %{toPersianDigits(rec.confidence)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
