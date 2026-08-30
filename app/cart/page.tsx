"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useCart } from "../lib/cart";
import { formatToman, toPersianDigits } from "../lib/utils";
import { Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function CartPage() {
  const isMounted = useIsMounted();
  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const {
    items,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    getRawSubtotal,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();

  if (!isMounted) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-stone-500">
        در حال بارگذاری سبد خرید...
      </div>
    );
  }

  const subtotal = getRawSubtotal();
  const discount = getDiscountAmount();
  const finalTotal = getFinalTotal();
  const freeShippingThreshold = 500000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    setCouponFeedback(res);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-violet-50 text-4xl text-violet-600">
          <ShoppingBag className="size-10" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-stone-900 sm:text-3xl">
          سبد خرید شما خالی است!
        </h1>
        <p className="mt-2 text-xs text-stone-500 sm:text-sm">
          می‌توانید برای مشاهده محصولات جدید به فروشگاه مینی رویال مراجعه کنید.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-violet-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-violet-800"
        >
          <span>مشاهده فروشگاه پوشاک کودک</span>
          <ArrowRight className="size-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-violet-700">خانه</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">سبد خرید</span>
      </nav>

      <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">
        سبد خرید شما ({toPersianDigits(items.length)} کالا)
      </h1>

      {/* نوار ارسال رایگان */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-violet-100 bg-violet-50/70 p-5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800">
          <span>
            {remainingForFreeShipping > 0 ? (
              <>
                🚚 تنها <strong className="text-violet-700">{formatToman(remainingForFreeShipping)}</strong> دیگر تا ارسال رایگان نیاز است!
              </>
            ) : (
              <>🎉 تبریک! سفارش شما شامل ارسال رایگان گردید.</>
            )}
          </span>
          <span className="text-violet-700">{toPersianDigits(freeShippingPercent)}٪</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${freeShippingPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* لیست آیتم‌ها */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {items.map((item) => {
            const unitPrice = (item.product.salePrice ?? item.product.basePrice) + item.variant.priceAdjustment;
            const totalPrice = unitPrice * item.quantity;

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="size-20 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      <Link href={`/product/${item.product.slug}`}>{item.product.title}</Link>
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-500">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
                        سایز: {item.variant.size}
                      </span>
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
                        رنگ: {item.variant.color}
                      </span>
                    </div>
                    <span className="mt-2 block text-xs font-extrabold text-stone-900 sm:hidden">
                      {formatToman(unitPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0">
                  {/* شمارنده تعداد */}
                  <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="grid size-7 place-items-center rounded-xl bg-white text-stone-700 font-bold shadow-sm hover:bg-stone-100 text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-stone-900">
                      {toPersianDigits(item.quantity)}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="grid size-7 place-items-center rounded-xl bg-white text-stone-700 font-bold shadow-sm hover:bg-stone-100 text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* قیمت کل آیتم */}
                  <span className="hidden sm:block text-sm font-black text-stone-900">
                    {formatToman(totalPrice)}
                  </span>

                  {/* حذف */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-stone-400 transition hover:text-rose-600"
                    title="حذف از سبد"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              پاک کردن کل سبد خرید
            </button>
            <Link href="/shop" className="text-xs font-bold text-violet-700 hover:underline">
              ← ادامه خرید و دیدن محصولات بیشتر
            </Link>
          </div>
        </div>

        {/* فاکتور و خلاصه فاکتور */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-4">
              خلاصه صورت‌حساب
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between text-stone-600 font-medium">
                <span>مجموع قیمت کالاها:</span>
                <span className="font-bold text-stone-900">{formatToman(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>سود شما از کد تخفیف:</span>
                  <span>- {formatToman(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600 font-medium">
                <span>هزینه ارسال (پست/تیپاکس):</span>
                <span className="font-bold text-stone-900">
                  {remainingForFreeShipping === 0 ? "رایگان 🎉" : formatToman(45000)}
                </span>
              </div>

              <div className="border-t border-stone-100 pt-4 flex justify-between text-sm font-black text-stone-900">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-violet-700">
                  {formatToman(finalTotal + (remainingForFreeShipping === 0 ? 0 : 45000))}
                </span>
              </div>
            </div>

            {/* فرم کد تخفیف */}
            <form onSubmit={handleApplyCoupon} className="mt-6 border-t border-stone-100 pt-4">
              <label className="block text-xs font-bold text-stone-700 flex items-center gap-1">
                <Tag className="size-3.5 text-violet-600" /> کد تخفیف داری؟
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: MINI10 یا ROYAL50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs uppercase outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
                >
                  اعمال
                </button>
              </div>

              {couponFeedback && (
                <p
                  className={`mt-2 text-[11px] font-bold ${
                    couponFeedback.success ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}

              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 p-2 text-xs text-emerald-800">
                  <span>کد <strong>{appliedCoupon.code}</strong> فعال شد</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[10px] text-rose-600 underline"
                  >
                    حذف
                  </button>
                </div>
              )}
            </form>

            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-2xl bg-violet-700 py-3.5 text-center text-xs font-bold text-white shadow-xl shadow-violet-200 transition hover:bg-violet-800"
            >
              ادامه و ثبت نهایی آدرس و پرداخت ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
