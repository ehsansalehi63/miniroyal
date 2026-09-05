"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../lib/cart";
import { formatToman } from "../lib/utils";
import Link from "next/link";
import { ShieldCheck, MapPin, Truck, CreditCard } from "lucide-react";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { items, getRawSubtotal, getDiscountAmount, getFinalTotal, clearCart } = useCart();

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingProvider, setShippingProvider] = useState<"postex" | "tipax" | "post" | "peyk">("postex");
  const [postexShippingCost, setPostexShippingCost] = useState<number | null>(null);
  const [postexQuoteLoading, setPostexQuoteLoading] = useState(false);
  const [postexQuoteError, setPostexQuoteError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "cod">("zarinpal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<Array<{ id: number; name: string; province: string }>>([]);
  const [citiesError, setCitiesError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    fetch("/api/shipping/postex/cities", { cache: "force-cache" })
      .then(async (response) => { const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || "فهرست شهرها در دسترس نیست."); const nextCities = Array.isArray(data.cities) ? data.cities : []; setCities(nextCities); if (!nextCities.some((item: { province?: string }) => item.province)) { setProvince(""); setCity(""); } })
      .catch((error) => setCitiesError(error instanceof Error ? error.message : "فهرست شهرها در دسترس نیست."));
  }, []);

  const selectCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("مرورگر شما موقعیت مکانی را پشتیبانی نمی‌کند."); return; }
    setLocationMessage("در حال دریافت موقعیت شما...");
    navigator.geolocation.getCurrentPosition((position) => { setLatitude(position.coords.latitude); setLongitude(position.coords.longitude); setLocationMessage("موقعیت فعلی ثبت شد؛ آدرس پستی را هم کامل وارد کنید."); }, () => setLocationMessage("دسترسی به موقعیت ممکن نشد؛ مجوز مرورگر را فعال کنید."), { enableHighAccuracy: true, timeout: 10000 });
  };

  useEffect(() => {
    if (!city.trim() || !items.length) return;
    const controller = new AbortController();
    setPostexQuoteLoading(true);
    setPostexQuoteError("");
    fetch("/api/shipping/postex/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ city, totalValue: getFinalTotal(), totalWeight: items.reduce((sum, item) => sum + item.quantity * 500, 0), paymentType: paymentMethod === "cod" ? "COD" : "SENDER" }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "استعلام هزینه ارسال انجام نشد.");
      const numbers: number[] = [];
      const collect = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        for (const [key, child] of Object.entries(value)) {
          if (typeof child === "number" && /(price|amount|cost|total|fee|tariff)/i.test(key) && child > 0) numbers.push(child);
          else if (typeof child === "object") collect(child);
        }
      };
      collect(result.data);
      const rialAmount = Math.min(...numbers.filter((value) => value > 1000));
      if (!Number.isFinite(rialAmount)) throw new Error("هزینه ارسال از پاسخ پستکس قابل تشخیص نیست.");
      setPostexShippingCost(Math.ceil(rialAmount / 10));
    }).catch((error) => { if (error.name !== "AbortError") { setPostexShippingCost(null); setPostexQuoteError(error instanceof Error ? error.message : "استعلام هزینه ارسال انجام نشد."); } }).finally(() => setPostexQuoteLoading(false));
    return () => controller.abort();
  }, [city, paymentMethod, items, getFinalTotal]);

  useEffect(() => {
    if (!city.trim().replace(/ي/g, "ی").includes("اصفهان") && paymentMethod === "cod") setPaymentMethod("zarinpal");
  }, [city, paymentMethod]);

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-stone-900">سبد خرید شما خالی است.</h1>
        <Link href="/shop" className="mt-4 inline-block text-xs font-bold text-violet-700 underline">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const subtotal = getRawSubtotal();
  const discount = getDiscountAmount();
  const shippingCost = shippingProvider === "postex" && postexShippingCost !== null ? postexShippingCost : subtotal >= 500000 ? 0 : 45000;
  const finalTotal = getFinalTotal() + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phone || !address || !postalCode) {
      alert("لطفاً تمام اطلاعات آدرس و گیرنده را تکمیل کنید.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName, phone, province, city, address, postalCode, latitude, longitude,
          shippingProvider, paymentMethod, subtotal, discount, shippingCost, finalTotal,
          items,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "ثبت سفارش ناموفق بود.");
      clearCart();
      if (paymentMethod === "zarinpal") {
        router.push(`/payment/gateway?orderNumber=${result.orderNumber}&amount=${finalTotal}`);
      } else {
        router.push(`/order/success/${result.orderNumber}?status=pending`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ثبت سفارش.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-violet-700">خانه</Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-violet-700">سبد خرید</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">تسویه حساب و پرداخت</span>
      </nav>

      <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">تسویه حساب سفارش</h1>

      <form onSubmit={handleSubmitOrder} className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* اطلاعات گیرنده و آدرس */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* آدرس تحویل */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-black text-stone-900 border-b border-stone-100 pb-4">
              <MapPin className="size-5 text-violet-600" />
              <span>۱. آدرس تحویل مرسوله</span>
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-stone-700">نام و نام خانوادگی گیرنده *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زهرا محمدی"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700">شماره موبایل جهت هماهنگی تحویل *</label>
                <input
                  type="tel"
                  required
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div><label className="block text-xs font-bold text-stone-700">استان *</label>{cities.length && cities.some((item) => item.province) ? <select required value={province} onChange={(e) => { setProvince(e.target.value); setCity(""); }} className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"><option value="">انتخاب استان</option>{[...new Set(cities.map((item) => item.province).filter(Boolean))].map((item) => <option key={item} value={item}>{item}</option>)}</select> : <input type="text" required value={province} onChange={(e) => setProvince(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" />}</div>

              <div><label className="block text-xs font-bold text-stone-700">شهر *</label>{cities.length ? <select required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"><option value="">انتخاب شهر</option>{cities.filter((item) => !cities.some((candidate) => candidate.province) || !province || item.province === province).map((item) => <option key={`${item.id}-${item.name}`} value={item.name}>{item.name}</option>)}</select> : <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" />}{citiesError && <p className="mt-1 text-[10px] text-amber-700">{citiesError}؛ شهر را دستی وارد کنید.</p>}</div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700">آدرس دقیق پستی *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="خیابان، کوچه، پلاک، واحد..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700">کد پستی ۱۰ رقمی *</label>
                <input
                  type="text"
                  required
                  placeholder="۱۲۳۴۵۶۷۸۹۰"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-violet-950">ثبت موقعیت روی نقشه</p><p className="mt-1 text-[10px] text-violet-800">موقعیت فعلی برای دقت ارسال ذخیره می‌شود؛ آدرس پستی را هم کامل بنویسید.</p></div><button type="button" onClick={selectCurrentLocation} className="rounded-xl bg-violet-700 px-3 py-2 text-[11px] font-bold text-white">استفاده از موقعیت فعلی</button></div>{locationMessage && <p className="mt-2 text-[10px] font-semibold text-violet-800">{locationMessage}</p>}{latitude !== null && longitude !== null && <a className="mt-2 block text-[10px] text-violet-700 underline" href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`} target="_blank" rel="noreferrer">مشاهده موقعیت ثبت‌شده روی نقشه</a>}</div>
            </div>
          </div>

          {/* روش ارسال */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-black text-stone-900 border-b border-stone-100 pb-4">
              <Truck className="size-5 text-violet-600" />
              <span>۲. روش ارسال</span>
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { id: "postex" as const, title: "ارسال هوشمند پستکس", time: postexQuoteLoading ? "در حال استعلام هزینه..." : "محاسبه آنلاین هزینه و رهگیری" },
                { id: "tipax" as const, title: "تیپاکس (ارسال سریع)", time: "۱ الی ۲ روز کاری" },
                { id: "post" as const, title: "پست پیشتاز", time: "۲ الی ۴ روز کاری" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                    shippingProvider === m.id
                      ? "border-violet-700 bg-violet-50/50 ring-2 ring-violet-200"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingProvider"
                      checked={shippingProvider === m.id}
                      onChange={() => setShippingProvider(m.id)}
                      className="accent-violet-600"
                    />
                    <div>
                      <span className="block text-xs font-bold text-stone-900">{m.title}</span>
                      <span className="text-[11px] text-stone-500">{m.time}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-violet-700">
                    {shippingProvider === "postex" && postexQuoteLoading ? "در حال بررسی" : shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}
                  </span>
                </label>
              ))}
            </div>
            {postexQuoteError && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">{postexQuoteError} هزینه پایه موقتاً نمایش داده شد.</p>}
          </div>

          {/* روش پرداخت */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-black text-stone-900 border-b border-stone-100 pb-4">
              <CreditCard className="size-5 text-violet-600" />
              <span>۳. روش پرداخت</span>
            </h2>

            <div className="mt-4 space-y-3">
              <label
                className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                  paymentMethod === "zarinpal"
                    ? "border-violet-700 bg-violet-50/50 ring-2 ring-violet-200"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "zarinpal"}
                    onChange={() => setPaymentMethod("zarinpal")}
                    className="accent-violet-600"
                  />
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      پرداخت آنلاین امن زرین‌پال
                    </span>
                    <span className="text-[11px] text-stone-500">
                      پرداخت با کلیه کارت‌های شتاب بدون پول واقعی (محیط تست)
                    </span>
                  </div>
                </div>
                <span className="text-xl">💳</span>
              </label>

              {city.trim().replace(/ي/g, "ی").includes("اصفهان") && <label
                key="cod"
                className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                  paymentMethod === "cod"
                    ? "border-violet-700 bg-violet-50/50 ring-2 ring-violet-200"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-violet-600"
                  />
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      پرداخت در محل (COD)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      پرداخت وجه هنگام تحویل گرفتن مرسوله درب منزل
                    </span>
                  </div>
                </div>
                <span className="text-xl">💵</span>
              </label>}
            </div>
          </div>
        </div>

        {/* خلاصه فاکتور نهایی */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-4">
              اقلام سفارش ({items.length})
            </h2>

            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pl-1 divide-y divide-stone-100">
              {items.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <strong className="block text-stone-900 font-bold">{item.product.title}</strong>
                    <span className="text-stone-500 text-[11px]">
                      سایز: {item.variant.size} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-stone-800">
                    {formatToman((item.product.salePrice ?? item.product.basePrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-stone-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>مبلغ کالاها:</span>
                <span className="font-bold text-stone-900">{formatToman(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>تخفیف:</span>
                  <span>- {formatToman(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>هزینه ارسال:</span>
                <span className="font-bold text-stone-900">
                  {shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-violet-700 border-t border-stone-100 pt-3">
                <span>مبلغ نهایی:</span>
                <span>{formatToman(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-violet-700 py-3.5 text-xs font-bold text-white shadow-xl shadow-violet-200 transition hover:bg-violet-800 disabled:opacity-50"
            >
              {isSubmitting ? "در حال ثبت سفارش..." : "تأیید نهایی و پرداخت سفارش 🔒"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>پرداخت امن و تضمین اصالت مینی رویال</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
