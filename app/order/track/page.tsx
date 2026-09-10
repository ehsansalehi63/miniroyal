"use client";

import { useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { Search, Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TrackedOrder {
  orderNumber: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  finalTotal: number;
  shippingProvider: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  postexParcelNo: string | null;
  trackingCode: string | null;
  trackingStatus: string | null;
  createdAt: string;
}

const ORDER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "در انتظار پردازش", className: "bg-amber-100 text-amber-900 border border-amber-300" },
  processing: { label: "در حال پردازش انبار", className: "bg-amber-50 text-amber-950 border border-amber-200" },
  shipped: { label: "تحویل به شرکت حمل", className: "bg-sky-100 text-sky-800" },
  delivered: { label: "تحویل داده شد", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "لغو شده", className: "bg-rose-100 text-rose-800" },
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "پرداخت شده",
  unpaid: "در انتظار پرداخت",
  failed: "پرداخت ناموفق",
  cancelled: "پرداخت لغو شد",
  refunded: "بازپرداخت شده",
};

const SHIPPING_LABELS: Record<string, string> = {
  postex: "پستکس",
  tipax: "تیپاکس",
  post: "پست پیشتاز",
  peyk: "پیک",
};

export default function OrderTrackPage() {
  const [query, setQuery] = useState("");
  const [foundOrder, setFoundOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipaxEvents, setTipaxEvents] = useState<{ title: string; time: string; location?: string }[] | null>(null);
  const [tipaxTrackingUrl, setTipaxTrackingUrl] = useState<string>("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setLoading(true);
    setTipaxEvents(null);
    setTipaxTrackingUrl("");
    try {
      const response = await fetch(`/api/orders?identifier=${encodeURIComponent(query.trim())}`);
      const result = await response.json();
      const order = result.success ? result.order : null;
      setFoundOrder(order);
      const trackingIdentifier = order?.postexParcelNo || order?.trackingCode;
      if (trackingIdentifier) {
        setTipaxTrackingUrl(`https://tipaxco.com/tracking?id=${encodeURIComponent(trackingIdentifier)}`);
        try {
          const trackingResponse = await fetch(`/api/orders/tracking?identifier=${encodeURIComponent(query.trim())}`);
          const trackingResult = await trackingResponse.json();
          if (trackingResult.success && trackingResult.tracking) {
            const rawEvents = trackingResult.tracking.events;
            if (Array.isArray(rawEvents)) {
              setTipaxEvents(
                rawEvents.map((entry: { title?: string; time?: string; location?: string }) => ({
                  title: String(entry.title || ""),
                  time: String(entry.time || ""),
                  location: entry.location ? String(entry.location) : undefined,
                }))
              );
            }
          }
        } catch { /* رهگیری تیپاکس اختیاری است */ }
      }
    } catch {
      setFoundOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = foundOrder ? ORDER_STATUS_LABELS[foundOrder.status] || { label: foundOrder.status, className: "bg-stone-100 text-stone-800" } : null;

  const timelineSteps = [
    { label: "ثبت سفارش", done: true },
    { label: "پردازش انبار", done: ["processing", "shipped", "delivered"].includes(foundOrder?.status || "") },
    { label: "تحویل به شرکت حمل", done: ["shipped", "delivered"].includes(foundOrder?.status || "") },
    { label: "تحویل درب منزل", done: foundOrder?.status === "delivered" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-black text-amber-900">
          📦 سامانه رهگیری سفارشات
        </span>
        <h1 className="mt-4 text-3xl font-black text-stone-900">رهگیری مرسوله مینی رویال</h1>
        <p className="mt-2 text-xs text-stone-600 sm:text-sm">
          شماره سفارش (مثلاً MR-12345678) یا شماره موبایل ثبت‌شده هنگام خرید را وارد کنید.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          type="text"
          required
          placeholder="شماره سفارش یا شماره همراه..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-xs outline-none focus:border-amber-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-stone-950 px-6 py-3 text-xs font-black text-white shadow-md hover:bg-stone-800 disabled:opacity-50"
        >
          <Search className="size-4" />
          <span>{loading ? "..." : "جستجو"}</span>
        </button>
      </form>

      {searched && (
        <div className="mt-10">
          {loading ? (
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          ) : foundOrder ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    شماره سفارش: {foundOrder.orderNumber}
                  </h3>
                  <span className="text-xs text-stone-500">
                    تاریخ ثبت: {foundOrder.createdAt ? toPersianDigits(foundOrder.createdAt.split("T")[0].replace(/-/g, "/")) : "—"}
                  </span>
                </div>
                {statusInfo && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusInfo.className}`}>
                    وضعیت: {statusInfo.label}
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center text-[10px] font-bold">
                {timelineSteps.map((step, index) => (
                  <div key={step.label} className={step.done ? "text-emerald-700" : "text-stone-400"}>
                    <span className={`mx-auto grid size-8 place-items-center rounded-full mb-1 text-white ${step.done ? "bg-emerald-500" : "bg-stone-200"}`}>
                      {step.done ? <CheckCircle2 className="size-4" /> : toPersianDigits(index + 1)}
                    </span>
                    {step.label}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs leading-6 text-stone-700">
                <div>
                  <p><strong>گیرنده:</strong> {foundOrder.recipientName}</p>
                  <p><strong>تلفن:</strong> {toPersianDigits(foundOrder.phone)}</p>
                  <p><strong>آدرس:</strong> {foundOrder.province}، {foundOrder.city}، {foundOrder.address}</p>
                </div>
                <div>
                  <p><strong>مبلغ نهایی:</strong> {formatToman(Number(foundOrder.finalTotal))}</p>
                  <p><strong>روش ارسال:</strong> {SHIPPING_LABELS[foundOrder.shippingProvider] || foundOrder.shippingProvider}</p>
                  <p>
                    <strong>وضعیت پرداخت:</strong>{" "}
                    <span className={foundOrder.paymentStatus === "paid" ? "font-bold text-emerald-700" : foundOrder.paymentStatus === "unpaid" ? "text-amber-700" : "text-rose-700"}>
                      {PAYMENT_STATUS_LABELS[foundOrder.paymentStatus] || foundOrder.paymentStatus}
                    </span>
                  </p>
                  {foundOrder.postexParcelNo ? (
                    <div className="space-y-1">
                      <p><strong>بارکد رهگیری تیپاکس:</strong> <span className="font-mono font-bold text-amber-800">{foundOrder.postexParcelNo}</span></p>
                      {tipaxTrackingUrl && (
                        <a
                          href={tipaxTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-black text-amber-700 hover:text-amber-800 underline"
                        >
                          <Truck className="size-3.5" />
                          <span>پیگیری مستقیم در سایت رسمی تیپاکس</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1"><Clock className="size-3.5 text-amber-600" /> کد رهگیری: در انتظار صدور بارکد تیپاکس</p>
                  )}
                </div>
              </div>

              {tipaxEvents && tipaxEvents.length > 0 && (
                <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Truck className="size-4 text-amber-700" /> آخرین وضعیت مرسوله در تیپاکس (Tipax):
                  </h4>
                  <ul className="mt-3 space-y-2 text-[11px] text-stone-600">
                    {tipaxEvents.map((event, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Package className="size-3.5 shrink-0 text-amber-600" />
                        <span className="font-semibold text-stone-800">{event.title || "رویداد تیپاکس"}</span>
                        {event.location && <span className="text-stone-500">[{event.location}]</span>}
                        {event.time && <span className="text-stone-400">({event.time})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
              <XCircle className="size-5 text-rose-400" />
              سفارشی با این مشخصات یافت نشد. لطفاً شماره سفارش را بررسی کرده یا با پشتیبانی تماس بگیرید.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
