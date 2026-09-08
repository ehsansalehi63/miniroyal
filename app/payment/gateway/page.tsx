"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderNumber = searchParams.get("orderNumber") || "";
    const amount = Number(searchParams.get("amount"));
    if (!orderNumber || !Number.isSafeInteger(amount)) {
      router.replace("/checkout");
      return;
    }
    let cancelled = false;
    fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, amount }),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") || "";
        let data: { success?: boolean; paymentUrl?: string; error?: string } = {};

        if (contentType.includes("application/json")) {
          data = await response.json().catch(() => ({
            success: false,
            error: "پاسخ نامعتبر از سرور درگاه پرداخت.",
          }));
        } else {
          data = {
            success: false,
            error: "سرور درگاه پرداخت در دسترس نیست. لطفاً بعداً تلاش کنید یا از روش کارت به کارت استفاده نمایید.",
          };
        }

        if (!data.success || !data.paymentUrl) {
          throw new Error(data.error || "خطا در برقراری ارتباط با درگاه پرداخت.");
        }
        if (!cancelled) window.location.assign(data.paymentUrl);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          router.replace(
            `/payment/verify?status=failed&orderNumber=${encodeURIComponent(orderNumber)}&message=${encodeURIComponent(error.message)}`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" dir="rtl">
      <div className="mx-auto size-14 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
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
