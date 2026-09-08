"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentResult() {
  const params = useSearchParams();
  const cancelled = params.get("status") === "cancelled";
  const orderNumber = params.get("orderNumber");
  const rawMessage = params.get("message");
  const message = rawMessage && rawMessage.includes("<")
    ? "خطا در اتصال به درگاه پرداخت زرین‌پال. وجهی کسر نشد."
    : rawMessage;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" dir="rtl">
      <div className={`mx-auto grid size-16 place-items-center rounded-full text-3xl ${cancelled ? "bg-amber-100" : "bg-rose-100"}`}>
        {cancelled ? "↩️" : "!"}
      </div>
      <h1 className="mt-6 text-2xl font-black text-stone-900">
        {cancelled ? "پرداخت لغو شد" : "پرداخت ناموفق بود"}
      </h1>
      {orderNumber && (
        <p className="mt-2 text-xs font-mono font-bold text-stone-500">
          شماره سفارش: {orderNumber}
        </p>
      )}
      <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
        {message || "تراکنش تأیید نشد. در صورت کسر وجه از حساب، مبلغ حداکثر تا ۷۲ ساعت آینده توسط بانک عودت داده می‌شود."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {orderNumber && (
          <Link
            href={`/order/success/${encodeURIComponent(orderNumber)}?status=pending`}
            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-black text-white hover:bg-amber-700 transition shadow-md"
          >
            مشاهده جزییات سفارش
          </Link>
        )}
        <Link
          href="/shop"
          className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-black text-white hover:bg-stone-800 transition shadow-md"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">در حال بررسی نتیجه پرداخت...</div>}>
      <PaymentResult />
    </Suspense>
  );
}
