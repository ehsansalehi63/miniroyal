"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderNumber = searchParams.get("orderNumber") || "";
    if (!orderNumber) {
      router.replace("/checkout");
      return;
    }
    let cancelled = false;
    // مبلغ عمداً ارسال نمی‌شود؛ سرور مبلغ نهایی همان سفارش را از دیتابیس می‌خواند تا
    // اختلاف تخفیف/کرایه بین مرورگر و سرور باعث رد شدن پرداخت نشود.
    fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !data.paymentUrl) {
          throw new Error(data.error || "خطا در ایجاد تراکنش");
        }
        if (!cancelled) window.location.assign(data.paymentUrl);
      })
      .catch((error: Error) => {
        if (!cancelled) router.replace(`/payment/verify?status=failed&message=${encodeURIComponent(error.message)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" dir="rtl">
      <div className="mx-auto size-14 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
      <h1 className="mt-6 text-xl font-black text-stone-900">در حال انتقال به درگاه امن زرین‌پال</h1>
      <p className="mt-2 text-sm text-stone-500">اطلاعات کارت فقط در صفحه رسمی زرین‌پال وارد می‌شود.</p>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center" dir="rtl">در حال آماده‌سازی درگاه پرداخت...</div>}>
      <PaymentGatewayContent />
    </Suspense>
  );
}
