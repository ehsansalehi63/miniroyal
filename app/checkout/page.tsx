"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../lib/cart";
import { formatToman } from "../lib/utils";
import Link from "next/link";
import { ShieldCheck, MapPin, Truck, CreditCard } from "lucide-react";
import AddressMapPicker from "../components/AddressMapPicker";

type CityOption = { id: number; name: string; province: string; provinceId: number };

const FREE_SHIPPING_THRESHOLD = 500000;
const DEFAULT_SHIPPING_COST = 45000;

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
  const [shippingProvider, setShippingProvider] = useState<"tipax" | "post" | "peyk">("tipax");
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "cod">("zarinpal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [citiesError, setCitiesError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Shipping quote state
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [quotedShippingCost, setQuotedShippingCost] = useState<number | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    fetch("/api/shipping/tipax/cities", { cache: "force-cache" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "فهرست شهرها در دسترس نیست.");
        const nextCities: CityOption[] = Array.isArray(data.cities) ? data.cities : [];
        setCities(nextCities);
        setProvinces(Array.isArray(data.provinces) && data.provinces.length ? data.provinces : [...new Set(nextCities.map((item) => item.province).filter(Boolean))]);
      })
      .catch((error) => setCitiesError(error instanceof Error ? error.message : "فهرست شهرها در دسترس نیست."));
  }, []);

  const cityOptions = useMemo(() => {
    if (!province) return [];
    return cities.filter((item) => item.province === province).sort((a, b) => a.name.localeCompare(b.name, "fa"));
  }, [cities, province]);

  const selectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      if (!latitude && !longitude) return;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [latitude, longitude]);

  const handlePickOnMap = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  // استعلام هزینه ارسال بر اساس شهر مقصد هر وقت شهر انتخاب شد یا روش ارسال عوض شد
  const subtotal = getRawSubtotal();
  const discount = getDiscountAmount();
  const itemsTotalWeightGrams = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(200, Math.round(Number((item as { product?: { weightGrams?: number } }).product?.weightGrams || 500))) * item.quantity, 0),
    [items]
  );

  useEffect(() => {
    if (!city || subtotal <= 0) {
      setQuoteStatus("idle");
      setQuotedShippingCost(null);
      setQuoteError("");
      return;
    }
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      setQuoteStatus("ready");
      setQuotedShippingCost(0);
      setQuoteError("");
      return;
    }
    let cancelled = false;
    setQuoteStatus("loading");
    setQuoteError("");
    fetch("/api/shipping/postex/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        totalValue: subtotal - discount,
        totalWeight: Math.max(0.1, itemsTotalWeightGrams / 1000),
        paymentType: paymentMethod === "cod" ? "COD" : "SENDER",
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "استعلام هزینه ارسال ناموفق بود.");
        if (cancelled) return;
        const raw = data.data;
        // استخراج مبلغ از پاسخ پستکس (ساختارهای مختلف ممکن)
        const candidates: unknown[] = [];
        const collect = (value: unknown, depth = 0) => {
          if (!value || typeof value !== "object" || depth > 4) return;
          if (Array.isArray(value)) { value.forEach((entry) => collect(entry, depth + 1)); return; }
          const record = value as Record<string, unknown>;
          for (const key of ["price", "amount", "quote_price", "quotePrice", "total_price", "totalPrice", "shipping_price", "shippingPrice", "cost", "delivery_price", "deliveryPrice"]) {
            if (record[key] !== undefined && record[key] !== null) candidates.push(record[key]);
          }
          for (const key of Object.keys(record)) collect(record[key], depth + 1);
        };
        collect(raw);
        const numeric = candidates.map((value) => Number(value)).find((value) => Number.isFinite(value) && value > 0);
        if (numeric === undefined) throw new Error("پاسخ استعلام هزینه ارسال قابل خواندن نبود.");
        if (cancelled) return;
        // پستکس مبالغ را به ریال (×10 تومان) برمی‌گرداند
        const toman = numeric > 1000000 ? Math.round(numeric / 10) : Math.round(numeric);
        setQuotedShippingCost(Math.min(toman, 500000));
        setQuoteStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setQuoteStatus("error");
        setQuotedShippingCost(null);
        setQuoteError(error instanceof Error ? error.message : "استعلام هزینه ارسال ناموفق بود.");
      });
    return () => { cancelled = true; };
  }, [city, subtotal, discount, itemsTotalWeightGrams, paymentMethod]);

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

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = freeShipping ? 0 : quotedShippingCost !== null ? quotedShippingCost : DEFAULT_SHIPPING_COST;
  const finalTotal = getFinalTotal() + shippingCost;

  const normalizeDigits = (value: string) =>
    value.replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char))).replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeDigits(phone).replace(/\D/g, "");
    const cleanPostalCode = normalizeDigits(postalCode).replace(/\D/g, "");
    if (!recipientName || !address) {
      alert("لطفاً نام گیرنده و آدرس را تکمیل کنید.");
      return;
    }
    if (!province) {
      alert("لطفاً استان را انتخاب کنید.");
      return;
    }
    if (!city) {
      alert("لطفاً شهر را انتخاب کنید.");
      return;
    }
    if (/^09\d{9}$/.test(cleanPhone) === false) {
      alert("شماره موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }
    if (/^\d{10}$/.test(cleanPostalCode) === false) {
      alert("کد پستی باید دقیقاً ۱۰ رقم باشد.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName, phone: cleanPhone, province, city, address, postalCode: cleanPostalCode, latitude, longitude,
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

              <div>
                <label className="block text-xs font-bold text-stone-700">استان *</label>
                {provinces.length > 0 ? (
                  <select
                    required
                    value={province}
                    onChange={(e) => { setProvince(e.target.value); setCity(""); }}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
                  >
                    <option value="">انتخاب استان</option>
                    {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="مثال: اصفهان"
                    value={province}
                    onChange={(e) => { setProvince(e.target.value); setCity(""); }}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700">شهر *</label>
                {cityOptions.length > 0 ? (
                  <select
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500 disabled:bg-stone-50 disabled:text-stone-400"
                  >
                    <option value="">{province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}</option>
                    {cityOptions.map((item) => <option key={`${item.id}-${item.name}`} value={item.name}>{item.name}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder={province ? "نام شهر" : "ابتدا استان را انتخاب کنید"}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={Boolean(provinces.length) && !province}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500 disabled:bg-stone-50 disabled:text-stone-400"
                  />
                )}
                {citiesError && <p className="mt-1 text-[10px] text-amber-700">{citiesError}؛ شهر را دستی وارد کنید.</p>}
              </div>

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
                  inputMode="numeric"
                  placeholder="۱۲۳۴۵۶۷۸۹۰"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-stone-700">انتخاب آدرس روی نقشه *</p>
                    <p className="mt-0.5 text-[10px] text-stone-500">موقعیت دقیق روی نقشه ثبت می‌شود تا مرسوله سریع‌تر به دست شما برسد.</p>
                  </div>
                  <button type="button" onClick={selectCurrentLocation} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-[11px] font-bold text-violet-700 hover:bg-violet-50">
                    استفاده از موقعیت فعلی من
                  </button>
                </div>
                <AddressMapPicker latitude={latitude} longitude={longitude} onPick={handlePickOnMap} />
                {latitude !== null && longitude !== null && (
                  <p className="mt-2 text-[10px] font-semibold text-emerald-700">
                    موقعیت ثبت شد: {latitude.toFixed(5)}، {longitude.toFixed(5)}
                  </p>
                )}
              </div>
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
                    {!city
                      ? "پس از انتخاب شهر"
                      : freeShipping
                        ? "رایگان"
                        : quoteStatus === "loading"
                          ? "در حال محاسبه..."
                          : shippingCost === 0
                            ? "رایگان"
                            : formatToman(shippingCost)}
                  </span>
                </label>
              ))}
            </div>

            {!city && (
              <p className="mt-3 text-[10px] font-semibold text-stone-500">برای محاسبه دقیق هزینه ارسال، ابتدا استان و شهر را انتخاب کنید.</p>
            )}
            {quoteStatus === "loading" && <p className="mt-3 text-[10px] font-semibold text-violet-700">هزینه ارسال بر اساس آدرس شما در حال محاسبه است...</p>}
            {quoteStatus === "error" && city && !freeShipping && (
              <p className="mt-3 text-[10px] font-semibold text-amber-700">استعلام آنلاین هزینه ارسال ممکن نشد؛ هزینه پیش‌فرض {formatToman(DEFAULT_SHIPPING_COST)} اعمال می‌شود. {quoteError}</p>
            )}
            {quoteStatus === "ready" && !freeShipping && quotedShippingCost !== null && (
              <p className="mt-3 text-[10px] font-semibold text-emerald-700">هزینه ارسال بر اساس آدرس انتخابی شما محاسبه شد.</p>
            )}
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
                  {!city
                    ? "پس از انتخاب شهر"
                    : quoteStatus === "loading" && !freeShipping
                      ? "در حال محاسبه..."
                      : shippingCost === 0
                        ? "رایگان"
                        : formatToman(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-violet-700 border-t border-stone-100 pt-3">
                <span>مبلغ نهایی:</span>
                <span>{quoteStatus === "loading" && !freeShipping ? "..." : formatToman(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || quoteStatus === "loading"}
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
