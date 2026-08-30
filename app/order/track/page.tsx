"use client";

import { useState } from "react";
import { formatToman } from "../../lib/utils";
import { Search } from "lucide-react";

interface TrackedOrder {
  orderNumber: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  finalTotal: number;
  shippingProvider: string;
  createdAt: string;
}

export default function OrderTrackPage() {
  const [query, setQuery] = useState("");
  const [foundOrder, setFoundOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (typeof window !== "undefined") {
      const orders: TrackedOrder[] = JSON.parse(localStorage.getItem("miniroyal_orders") || "[]");
      const found = orders.find(
        (o) =>
          o.orderNumber?.toLowerCase() === query.trim().toLowerCase() ||
          o.phone === query.trim()
      );
      setFoundOrder(found || null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <span className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-800">
          📦 سامانه رهگیری سفارشات
        </span>
        <h1 className="mt-4 text-3xl font-black text-stone-900">رهگیری مرسوله مینی رویال</h1>
        <p className="mt-2 text-xs text-stone-600 sm:text-sm">
          شماره سفارش (مثلاً MR-123456) یا شماره موبایل ثبت‌شده هنگام خرید را وارد کنید.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          type="text"
          required
          placeholder="شماره سفارش یا شماره همراه..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-xs outline-none focus:border-violet-500 focus:bg-white"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-full bg-violet-700 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          <Search className="size-4" />
          <span>جستجو</span>
        </button>
      </form>

      {searched && (
        <div className="mt-10">
          {foundOrder ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    شماره سفارش: {foundOrder.orderNumber}
                  </h3>
                  <span className="text-xs text-stone-500">تاریخ ثبت: {foundOrder.createdAt?.split("T")[0]}</span>
                </div>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                  وضعیت: در حال پردازش انبار
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs leading-6 text-stone-700">
                <div>
                  <p><strong>گیرنده:</strong> {foundOrder.recipientName}</p>
                  <p><strong>تلفن:</strong> {foundOrder.phone}</p>
                  <p><strong>آدرس:</strong> {foundOrder.province}، {foundOrder.city}، {foundOrder.address}</p>
                </div>
                <div>
                  <p><strong>مبلغ نهایی:</strong> {formatToman(foundOrder.finalTotal)}</p>
                  <p><strong>روش ارسال:</strong> {foundOrder.shippingProvider}</p>
                  <p><strong>کد رهگیری پستی:</strong> در انتظار صدور بارنامه</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
              سفارشی با این مشخصات یافت نشد. لطفاً شماره سفارش را بررسی کرده یا با پشتیبانی تماس بگیرید.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
