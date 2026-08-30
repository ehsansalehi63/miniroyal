"use client";

import { useState } from "react";
import { Product, Variant } from "../../lib/types/catalog";
import { toPersianDigits } from "../../lib/utils";

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

  // Find matching variant
  const currentVariant: Variant | undefined = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const isOutOfStock = !currentVariant || currentVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
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
            انتخاب سایز: <span className="text-violet-700">{selectedSize}</span>
          </label>
          <a
            href="#tryon-section"
            className="text-[11px] font-bold text-violet-700 hover:underline"
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
                    ? "bg-violet-700 text-white shadow-md shadow-violet-200"
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
            انتخاب رنگ: <span className="text-violet-700">{selectedColor}</span>
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
                      ? "border-violet-700 bg-violet-50 text-violet-900 ring-2 ring-violet-200"
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
              className="flex-1 rounded-2xl bg-violet-700 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-200 transition hover:bg-violet-800"
            >
              {addedToCart ? "✓ به سبد خرید اضافه شد!" : "افزودن به سبد خرید 🛍️"}
            </button>
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
