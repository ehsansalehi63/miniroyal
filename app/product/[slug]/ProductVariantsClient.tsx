"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ShoppingBag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Variant } from "../../lib/types/catalog";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { recommendSize } from "../../lib/smartFit";
import { useCart } from "../../lib/cart";

interface ProductVariantsClientProps {
  product: Product;
}

export default function ProductVariantsClient({ product }: ProductVariantsClientProps) {
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(
    new Map(
      product.variants.map((v) => [v.color, { name: v.color, code: v.colorCode }])
    ).values()
  );

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(
    colors[0]?.name || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [showNotifyModal, setShowNotifyModal] = useState<boolean>(false);
  const [notifyPhone, setNotifyPhone] = useState<string>("");
  const [notifySuccess, setNotifySuccess] = useState<boolean>(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const { addItem } = useCart();

  // محاسبه سایز پیشنهادی پیش‌فرض هوش مصنوعی
  const aiFit = useMemo(() => {
    return recommendSize(product, {
      heightCm: 104,
      weightKg: 17,
      ageMonths: 72,
      gender: product.gender === "unisex" ? "unisex" : product.gender,
      buyForGrowth: false,
    });
  }, [product]);

  // نمایش نوار خرید شناور هنگام اسکرول به پایین
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find matching variant
  const currentVariant: Variant | undefined = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const isOutOfStock = !currentVariant || currentVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, currentVariant, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyPhone.trim()) return;
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifySuccess(false);
      setShowNotifyModal(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* انتخاب سایز */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-900">
            انتخاب سایز: <span className="text-amber-800 font-black">{selectedSize}</span>
          </label>
          <a
            href="#tryon-section"
            className="text-[11px] font-bold text-amber-800 hover:underline"
          >
            👗 راهنمای سایز هوشمند
          </a>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const sizeVariants = product.variants.filter((v) => v.size === size);
            const hasStock = sizeVariants.some((v) => v.stock > 0);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`relative rounded-2xl px-4 py-2.5 text-xs font-extrabold transition ${
                  isSelected
                    ? "bg-stone-950 text-white shadow-md shadow-stone-300"
                    : hasStock
                    ? "bg-stone-100 text-stone-800 hover:bg-stone-200"
                    : "bg-stone-50 text-stone-400 line-through opacity-60"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* انتخاب رنگ */}
      {colors.length > 0 && (
        <div>
          <label className="text-xs font-bold text-stone-900">
            انتخاب رنگ: <span className="text-amber-800 font-black">{selectedColor}</span>
          </label>
          <div className="mt-2.5 flex flex-wrap gap-3">
            {colors.map((col) => {
              const isSelected = selectedColor === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(col.name)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? "border-amber-700 bg-amber-50 text-amber-900 ring-2 ring-amber-200"
                      : "border-stone-200 bg-white text-stone-700"
                  }`}
                >
                  {col.code && (
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: col.code }}
                    />
                  )}
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* وضعیت موجودی و دکمه خرید */}
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {!isOutOfStock ? (
          <>
            {/* تعداد */}
            <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="grid size-8 place-items-center rounded-xl bg-white text-stone-700 shadow-sm hover:bg-stone-100 font-bold"
              >
                -
              </button>
              <span className="w-10 text-center text-xs font-bold text-stone-900">
                {toPersianDigits(quantity)}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="grid size-8 place-items-center rounded-xl bg-white text-stone-700 shadow-sm hover:bg-stone-100 font-bold"
              >
                +
              </button>
            </div>

            {/* افزودن به سبد */}
            <button
              onClick={handleAddToCart}
              className="flex-1 rounded-2xl bg-stone-950 py-3.5 text-sm font-black text-white shadow-xl shadow-stone-200 transition hover:bg-stone-800"
            >
              {addedToCart ? "✓ به سبد خرید اضافه شد!" : "افزودن به سبد خرید 🛍️"}
            </button>

            {/* دکمه اختصاصی پرو آنلاین محصول */}
            <a
              href={`/virtual-tryon?product=${encodeURIComponent(product.slug)}`}
              className="flex items-center gap-1.5 rounded-2xl border-2 border-amber-400/80 bg-amber-50 px-4 py-3.5 text-xs font-black text-amber-950 transition hover:bg-amber-400 hover:text-stone-950"
            >
              <Sparkles className="size-4 text-amber-600" />
              <span>پرو آنلاین لباس ✨</span>
            </a>
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-2">
            <div className="rounded-2xl bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
              این سایز و رنگ متأسفانه ناموجود است.
            </div>
            <button
              onClick={() => setShowNotifyModal(true)}
              className="rounded-2xl border-2 border-amber-400 bg-white py-3 text-xs font-bold text-amber-900 hover:bg-amber-50"
            >
              🔔 موجود شد به من اطلاع بده
            </button>
          </div>
        )}
      </div>

      {/* مدال اطلاع از موجودی */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-black text-stone-900">
              🔔 اطلاع از شارژ مجدد سایز {selectedSize}
            </h4>
            <p className="mt-2 text-xs text-stone-600">
              شماره موبایل خود را وارد کنید تا به محض شارژ مجدد این محصول، پیامک اطلاع‌رسانی برایتان ارسال شود.
            </p>

            {notifySuccess ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
                ✅ درخواست شما ثبت شد! به محض موجودی پیامک می‌فرستیم.
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="mt-4 space-y-3">
                <input
                  type="tel"
                  required
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-stone-950 py-2.5 text-xs font-black text-white shadow-md hover:bg-stone-800 transition"
                  >
                    ثبت شماره
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نوار شناور خرید سریع با پس‌زمینه شیشه‌ای مات و سایز پیشنهادی AI */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-18 inset-x-3 sm:bottom-5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 w-auto sm:w-[94%] max-w-4xl"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-[20px] border border-stone-700/70 bg-stone-950/90 px-4 py-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl ring-1 ring-amber-400/20">
              {/* سمت راست: تامبنیل + عنوان + قیمت با فونت وزیرمتن فارسی */}
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="size-11 rounded-xl object-cover border border-white/15 shrink-0 bg-stone-900"
                />
                <div className="min-w-0">
                  <h4 className="truncate text-xs font-black sm:text-sm text-stone-100 max-w-[130px] sm:max-w-[200px]">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-amber-300">
                      {formatToman(product.salePrice ?? product.basePrice)}
                    </span>
                    {product.salePrice && (
                      <span className="text-[10px] text-stone-400 line-through">
                        {formatToman(product.basePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* وسط: تغییر سریع سایز و بج پیشنهاد هوش مصنوعی */}
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden md:inline text-stone-400 text-[11px]">سایز:</span>
                <div className="flex items-center rounded-xl bg-stone-900/90 border border-stone-700/80 px-2 py-1">
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="bg-transparent text-xs font-black text-amber-300 outline-none cursor-pointer pr-1"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s} className="bg-stone-950 text-white font-bold">
                        سایز {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* کلید اعمال سریع سایز پیشنهادی هوش مصنوعی */}
                {aiFit.size && (
                  <button
                    type="button"
                    onClick={() => setSelectedSize(aiFit.size)}
                    title="انتخاب مستقیم سایز پیشنهادی هوش مصنوعی"
                    className={`hidden sm:flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black transition ${
                      selectedSize === aiFit.size
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                        : "bg-white/10 text-stone-300 hover:bg-white/20 border border-white/5"
                    }`}
                  >
                    <Sparkles className="size-3 text-amber-400" />
                    <span>پیشنهاد AI: {aiFit.size}</span>
                  </button>
                )}
              </div>

              {/* سمت چپ: دکمه افزودن مستقیم به سبد خرید با فیدبک فیزیکی */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href={`/virtual-tryon?product=${encodeURIComponent(product.slug)}`}
                  className="flex items-center gap-1 rounded-xl bg-amber-400/90 hover:bg-amber-400 px-3 py-2.5 text-xs font-black text-stone-950 transition border border-amber-300 shadow-sm"
                  title="پرو آنلاین هوشمند این لباس"
                >
                  <Sparkles className="size-3.5 text-stone-950" />
                  <span className="hidden md:inline">پرو آنلاین</span>
                </a>
                {!isOutOfStock ? (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition active:scale-[0.97]"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="size-4 text-stone-950" />
                        به سبد اضافه شد!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        افزودن به سبد خرید
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 400, behavior: "smooth" });
                      setShowNotifyModal(true);
                    }}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-rose-800/80 bg-rose-950/80 px-4 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-900/80 transition"
                  >
                    ناموجود (اطلاع به من)
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
