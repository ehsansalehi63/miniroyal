"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatToman } from "../../lib/utils";

function PaymentVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const amount = searchParams.get("amount");
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  useEffect(() => {
    // Simulate ZarinPal Sandbox gateway verification
    const timer = setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        if (orderNumber) {
          router.push(`/order/success/${orderNumber}`);
        } else {
          router.push("/");
        }
      }, 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderNumber, router]);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
      {status === "verifying" && (
        <div>
          <div className="mx-auto size-16 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
          <h1 className="mt-6 text-xl font-black text-stone-900">
            در حال ارتباط با درگاه آزمایشی زرین‌پال...
          </h1>
          <p className="mt-2 text-xs text-stone-500">
            مبلغ {amount ? formatToman(Number(amount)) : ""} — شماره سفارش: {orderNumber}
          </p>
        </div>
      )}

      {status === "success" && (
        <div>
          <span className="text-6xl">✅</span>
          <h1 className="mt-4 text-2xl font-black text-emerald-700">
            پرداخت درگاه آزمایشی با موفقیت انجام شد!
          </h1>
          <p className="mt-2 text-xs text-stone-500">
            در حال انتقال به صفحه فاکتور و رهگیری سفارش...
          </p>
        </div>
      )}
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Suspense fallback={<div className="text-xs text-stone-500">در حال دریافت اطلاعات پرداخت...</div>}>
        <PaymentVerifyContent />
      </Suspense>
    </div>
  );
}
