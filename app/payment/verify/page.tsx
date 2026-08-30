"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentResult() {
  const params = useSearchParams();
  const cancelled = params.get("status") === "cancelled";
  const message = params.get("message");

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" dir="rtl">
      <div className={`mx-auto grid size-16 place-items-center rounded-full text-3xl ${cancelled ? "bg-amber-100" : "bg-rose-100"}`}>
        {cancelled ? "↩️" : "!"}
      </div>
      <h1 className="mt-6 text-2xl font-black text-stone-900">
        {cancelled ? "پرداخت لغو شد" : "پرداخت ناموفق بود"}
      </h1>
      <p className="mt-3 text-sm text-stone-600">
        {message || "تراکنش تأیید نشد. در صورت کسر وجه، پیگیری از زرین‌پال انجام می‌شود."}
      </p>
      <Link href="/checkout" className="mt-8 inline-block rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white">
        بازگشت به تسویه حساب
      </Link>
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
