"use client";

import { useState } from "react";
import { Product, Variant } from "../../lib/types/catalog";
import { toPersianDigits } from "../../lib/utils";
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
  const { addItem } = useCart();

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
          <label className="text-xs font-black text-stone-900">
            انتخاب سایز: <span className="text-amber-900 font-extrabold">{selectedSize}</span>
          </label>
          <a
            href="#tryon-section"
            className="flex items-center gap-1 text-[11px] font-bold text-violet-800 hover:text-violet-950 transition"
          >
            <span>👗</span>
            <span>راهنمای سایز و پرو آنلاین</span>
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
                className={`relative rounded-xl px-4 py-2.5 text-xs font-black transition-all duration-200 ${
                  isSelected
                    ? "bg-stone-950 text-white shadow-md ring-2 ring-amber-400/40"
                    : hasStock
                    ? "bg-stone-100/90 text-stone-800 hover:bg-stone-200 hover:text-stone-950"
                    : "bg-stone-50 text-stone-400 line-through opacity-50"
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
          <label className="text-xs font-black text-stone-900">
            انتخاب رنگ: <span className="text-stone-700">{selectedColor}</span>
          </label>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {colors.map((col) => {
              const isSelected = selectedColor === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(col.name)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? "border-stone-950 bg-stone-900 text-white shadow-sm"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  {col.code && (
                    <span
                      className="size-3.5 rounded-full border border-black/15 shadow-inner"
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
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {!isOutOfStock ? (
          <>
            {/* تعداد */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="grid size-9 place-items-center rounded-lg bg-white text-stone-800 shadow-sm hover:bg-stone-100 font-bold transition"
              >
                -
              </button>
              <span className="w-10 text-center text-xs font-black text-stone-900">
                {toPersianDigits(quantity)}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="grid size-9 place-items-center rounded-lg bg-white text-stone-800 shadow-sm hover:bg-stone-100 font-bold transition"
              >
                +
              </button>
            </div>

            {/* افزودن به سبد */}
            <button
              onClick={handleAddToCart}
              className="flex-1 rounded-xl bg-stone-950 py-3.5 text-xs font-black text-white shadow-lg transition hover:bg-violet-950 active:scale-[0.98] sm:text-sm"
            >
              {addedToCart ? "✓ به سبد خرید اضافه شد!" : "افزودن به سبد خرید 🛍️"}
            </button>
          </>
        ) : (
          <div className="flex flex-1 flex-col gap-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center text-xs font-bold text-amber-900">
              این سایز و رنگ در حال حاضر ناموجود است.
            </div>
            <button
              onClick={() => setShowNotifyModal(true)}
              className="rounded-xl border border-amber-400/80 bg-white py-3 text-xs font-black text-amber-950 hover:bg-amber-50 transition"
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
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-violet-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
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
    </div>
  );
}
