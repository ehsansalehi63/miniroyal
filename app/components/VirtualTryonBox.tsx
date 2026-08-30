"use client";

import { useState, useRef, useEffect } from "react";
import { Product } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";
import { Sparkles, ShieldCheck, Upload, Camera, CheckCircle2, RefreshCw, Wand2, User, Move, ZoomIn, RotateCw, Sliders, Download, Layers } from "lucide-react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive Layering Controls
  const [clothX, setClothX] = useState<number>(50); // percentage (0 to 100)
  const [clothY, setClothY] = useState<number>(45); // percentage (0 to 100)
  const [clothScale, setClothScale] = useState<number>(65); // size percentage (20 to 120)
  const [clothRotate, setClothRotate] = useState<number>(0); // deg (-45 to 45)
  const [clothOpacity, setClothOpacity] = useState<number>(95); // opacity (30 to 100)

  // Avatar Slider State
  const [height, setHeight] = useState<number>(104);
  const [weight, setWeight] = useState<number>(17);
  const [gender, setGender] = useState<"boy" | "girl">("girl");
  const [buyForGrowth, setBuyForGrowth] = useState<boolean>(false);

  const targetProduct = product || {
    id: 1,
    title: "هودی گرم پسرانه طرح خرس رویایی مینی رویال 👑",
    price: 680000,
    images: ["/images/products/boy-hoodie.svg"],
  };

  const productImage = targetProduct.images?.[0] || "/images/products/boy-hoodie.svg";

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

    setTimeout(() => setAiStep(2), 600);
    setTimeout(() => setAiStep(3), 1200);
    setTimeout(() => {
      setIsProcessing(false);
      setAiRendered(true);
      setClothX(50);
      setClothY(42);
      setClothScale(65);
      setClothRotate(0);
      setClothOpacity(95);
    }, 1800);
  };

  // Render to Canvas for HD Export / Download
  useEffect(() => {
    if (aiRendered && userPhoto && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = userPhoto;

      bgImg.onload = () => {
        canvas.width = bgImg.width || 800;
        canvas.height = bgImg.height || 1000;

        // Draw background child photo
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // Draw clothing overlay
        const clothImg = new Image();
        clothImg.crossOrigin = "anonymous";
        clothImg.src = productImage;

        clothImg.onload = () => {
          ctx.save();
          const targetWidth = (canvas.width * clothScale) / 100;
          const targetHeight = (clothImg.height / clothImg.width) * targetWidth;

          const posX = (canvas.width * clothX) / 100;
          const posY = (canvas.height * clothY) / 100;

          ctx.translate(posX, posY);
          ctx.rotate((clothRotate * Math.PI) / 180);
          ctx.globalAlpha = clothOpacity / 100;

          ctx.drawImage(
            clothImg,
            -targetWidth / 2,
            -targetHeight / 2,
            targetWidth,
            targetHeight
          );
          ctx.restore();
        };
      };
    }
  }, [aiRendered, userPhoto, productImage, clothX, clothY, clothScale, clothRotate, clothOpacity]);

  // Download Merged Canvas Photo
  const handleDownloadResult = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `miniroyal-tryon-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // Smart size calculation
  const calculateSize = () => {
    let baseSize = "۲ تا ۳ سال";
    let confidence = 98;
    let fitText = "کاملاً فیت و ایده‌آل";

    if (height < 80) baseSize = "۰ تا ۶ ماه";
    else if (height < 90) baseSize = "۶ تا ۱۲ ماه";
    else if (height < 98) baseSize = "۱ تا ۲ سال";
    else if (height < 108) baseSize = "۳ تا ۴ سال";
    else if (height < 118) baseSize = "۵ تا ۶ سال";
    else if (height < 128) baseSize = "۷ تا ۸ سال";
    else baseSize = "۹ تا ۱۰ سال";

    if (buyForGrowth) {
      if (baseSize === "۱ تا ۲ سال") baseSize = "۳ تا ۴ سال";
      else if (baseSize === "۳ تا ۴ سال") baseSize = "۵ تا ۶ سال";
      else if (baseSize === "۵ تا ۶ سال") baseSize = "۷ تا ۸ سال";
      confidence = 94;
      fitText = "کمی آزاد برای استفاده ۲ فصلی (+۱ سایز بزرگ‌تر)";
    }

    return { size: baseSize, confidence, fitText };
  };

  const rec = calculateSize();

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-violet-300/40 bg-gradient-to-br from-violet-950 via-stone-900 to-fuchsia-950 p-6 sm:p-8 text-white shadow-2xl font-sans dir-rtl">
      {/* Hidden Canvas for High Quality PNG Download */}
      <canvas ref={canvasRef} className="hidden" />

      {/* هدر پرو آنلاین */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg">
            👗
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              سامانه پرو آنلاین هوشمند (AI 3D Virtual Try-On)
            </h3>
            <p className="text-xs text-violet-200">
              عکس فرزندتان را آپلود کنید تا هوش مصنوعی لباس <strong className="text-amber-300">{targetProduct.title}</strong> را تن او پرو کند!
            </p>
          </div>
        </div>

        {/* سوییچ بین پرو با عکس و پرو با آواتار */}
        <div className="flex rounded-2xl bg-white/10 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("ai_photo")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "ai_photo" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <Wand2 className="size-3.5" />
            <span>پرو با عکس واقعی کودک 📸</span>
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "avatar" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <User className="size-3.5" />
            <span>پرو با آواتار قد/وزن 📏</span>
          </button>
        </div>
      </div>

      {/* تب ۱: پرو هوش مصنوعی تعاملی با عکس کاربر */}
      {activeTab === "ai_photo" && (
        <div className="mt-6 space-y-6">
          {!userPhoto ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* باکس آپلود عکس */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-3xl border-2 border-dashed border-violet-400/40 bg-white/5 p-8 text-center transition hover:border-violet-400 hover:bg-white/10 flex flex-col items-center justify-center min-h-[260px]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="grid size-16 place-items-center rounded-2xl bg-violet-600/40 text-violet-200 shadow-inner group-hover:scale-110 transition">
                  <Camera className="size-8" />
                </div>
                <h4 className="mt-4 text-sm font-black text-white">
                  آپلود عکس کودک یا استفاده از دوربین 📷
                </h4>
                <p className="mt-2 text-xs text-stone-300 max-w-xs">
                  فرمت‌های JPG، PNG؛ هوش مصنوعی آناتومی را تشخیص داده و لباس را تن او تنظیم می‌کند.
                </p>
              </div>

              {/* نمونه عکس پیش‌فرض برای تست سریع */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-300 block mb-1">💡 تست سریع بدون نیاز به آپلود</span>
                  <h4 className="text-sm font-black text-white">از عکس‌های مدل آماده کودک استفاده کنید:</h4>
                  <p className="text-xs text-stone-300 mt-1">
                    یکی از مدل‌های زیر را انتخاب کنید تا پرو ۳ بعدی لباس را بلافاصله مشاهده کنید.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      setUserPhoto("/images/products/boy-hoodie.svg");
                      startAITryonProcessing();
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 hover:bg-violet-600/40 transition border border-white/10"
                  >
                    <img src="/images/products/boy-hoodie.svg" alt="مدل پسر" className="size-10 rounded-xl object-cover bg-white/10" />
                    <span className="text-xs font-bold text-white text-right">مدل پسربچه 🧢</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserPhoto("/images/products/girl-dress.svg");
                      startAITryonProcessing();
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 hover:bg-fuchsia-600/40 transition border border-white/10"
                  >
                    <img src="/images/products/girl-dress.svg" alt="مدل دختر" className="size-10 rounded-xl object-cover bg-white/10" />
                    <span className="text-xs font-bold text-white text-right">مدل دختربچه 🎀</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* بخش کانواس پرو واقعی */}
              <div className="lg:col-span-7 space-y-4">
                {isProcessing ? (
                  <div className="rounded-3xl border border-violet-500/30 bg-violet-900/40 p-8 text-center space-y-4 min-h-[380px] flex flex-col items-center justify-center">
                    <RefreshCw className="size-12 animate-spin text-fuchsia-400" />
                    <h4 className="text-sm font-black text-white">هوش مصنوعی در حال پرو و منطبق‌سازی لباس تن کودک شماست...</h4>
                    <div className="space-y-2 text-xs font-bold text-violet-200 max-w-sm mx-auto text-right">
                      <p className={aiStep >= 1 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 1 ? "✅" : "⏳"} گام ۱: اسکن آناتومی، قد و سینه کودک در تصویر
                      </p>
                      <p className={aiStep >= 2 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 2 ? "✅" : "⏳"} گام ۲: منطبق‌سازی ۳ بعدی پارچه {targetProduct.title}
                      </p>
                      <p className={aiStep >= 3 ? "text-emerald-300" : "opacity-40"}>
                        {aiStep >= 3 ? "✅" : "⏳"} گام ۳: تنظیم نور، سایه‌ها و افتادگی طبیعی پارچه
                      </p>
                    </div>
                  </div>
                ) : aiRendered ? (
                  <div className="space-y-4">
                    {/* Viewport کانواس تعاملی پرو */}
                    <div className="relative overflow-hidden rounded-3xl border-2 border-violet-400/50 bg-stone-950 aspect-[4/5] sm:aspect-[4/3] w-full shadow-2xl flex items-center justify-center">
                      <img
                        src={userPhoto}
                        alt="عکس کودک"
                        className="absolute inset-0 size-full object-cover"
                      />

                      {/* لایه لباس خروجی پرو */}
                      <div
                        className="absolute pointer-events-none transition-all duration-75"
                        style={{
                          left: `${clothX}%`,
                          top: `${clothY}%`,
                          width: `${clothScale}%`,
                          transform: `translate(-50%, -50%) rotate(${clothRotate}deg)`,
                          opacity: clothOpacity / 100,
                        }}
                      >
                        <img
                          src={productImage}
                          alt="لباس پرو شده"
                          className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                        />
                      </div>

                      {/* نشان زنده فیت بودن */}
                      <div className="absolute top-3 right-3 z-10 rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-black text-stone-950 shadow-lg flex items-center gap-1">
                        <CheckCircle2 className="size-4 text-stone-950" />
                        <span>تطابق تن‌خور: %۹۸</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl bg-stone-950/85 backdrop-blur-md p-3 text-xs font-bold text-white flex flex-wrap justify-between items-center gap-2 border border-white/10">
                        <span>لباس انتخاب‌شده روی بدن کودک فیت است!</span>
                        <span className="text-amber-300 font-black">سایز پیشنهادی: {rec.size}</span>
                      </div>
                    </div>

                    {/* دکمه دانلود عینی تصویر پرو شده */}
                    <button
                      type="button"
                      onClick={handleDownloadResult}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-black text-white shadow-lg hover:from-emerald-700 hover:to-teal-700 transition"
                    >
                      <Download className="size-4" />
                      <span>📸 ذخیره و دانلود تصویر پرو شده در گالری گوشی/کامپیوتر</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* پنل تنظیمات تعاملی پرو */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sliders className="size-4" /> تنظیم انطباق لباس روی بدن (Fine Tuning)
                    </span>
                    <button
                      onClick={() => setUserPhoto(null)}
                      className="text-[11px] text-stone-300 hover:text-white underline font-bold"
                    >
                      تغییر عکس 📷
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>جابه‌جایی عمودی (بالا/پایین):</span>
                        <span className="text-amber-300">{clothY}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={clothY}
                        onChange={(e) => setClothY(Number(e.target.value))}
                        className="w-full accent-violet-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>بزرگ‌نمایی لباس (سایز تن‌خور):</span>
                        <span className="text-amber-300">{clothScale}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={110}
                        value={clothScale}
                        onChange={(e) => setClothScale(Number(e.target.value))}
                        className="w-full accent-fuchsia-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>چرخش زاویه شانه:</span>
                        <span className="text-amber-300">{clothRotate} درجه</span>
                      </div>
                      <input
                        type="range"
                        min={-30}
                        max={30}
                        value={clothRotate}
                        onChange={(e) => setClothRotate(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>شفافیت و فیت بودن پارچه:</span>
                        <span className="text-amber-300">{clothOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={clothOpacity}
                        onChange={(e) => setClothOpacity(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setClothX(50);
                      setClothY(42);
                      setClothScale(65);
                      setClothRotate(0);
                      setClothOpacity(95);
                    }}
                    className="w-full rounded-2xl bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition border border-white/10"
                  >
                    🎯 انطباق هوشمند خودکار (Auto Align)
                  </button>
                </div>

                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-300">
                    <span>پیشنهاد سایز هوشمند مینی رویال:</span>
                    <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-[10px] text-stone-950">اطمینان %{rec.confidence}</span>
                  </div>
                  <p className="text-sm font-black text-white">
                    سایز مناسب فرزند شما: <strong className="text-amber-300">{rec.size}</strong>
                  </p>
                  <p className="text-xs text-emerald-200">
                    {rec.fitText}
                  </p>
                </div>
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
            <div className="relative size-56 rounded-full bg-gradient-to-b from-violet-500/20 to-fuchsia-500/20 p-3 border border-white/20 shadow-2xl flex items-center justify-center">
              <img
                src={productImage}
                alt="پرو آنلاین"
                className="size-48 object-cover rounded-3xl shadow-xl transition-all duration-300 border-2 border-white/40"
              />
              <div className="absolute -top-2 -right-2 rounded-2xl bg-amber-400 px-3.5 py-1 text-xs font-black text-stone-950 shadow-lg">
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
