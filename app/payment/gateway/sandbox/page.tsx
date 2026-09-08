"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { toPersianDigits } from "@/app/lib/utils";

function SandboxGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const amount = Number(searchParams.get("amount")) || 0;
  const state = searchParams.get("state") || "";
  const authorityParam = searchParams.get("authority") || "";
  const [processing, setProcessing] = useState(false);

  const handlePaySuccess = () => {
    setProcessing(true);
    const authority = authorityParam || `SANDBOX-${Date.now()}`;
    const verifyUrl = `/api/payment/verify?orderNumber=${encodeURIComponent(orderNumber)}&amount=${amount}&state=${encodeURIComponent(state)}&Authority=${encodeURIComponent(authority)}&Status=OK`;
    window.location.href = verifyUrl;
  };

  const handleCancel = () => {
    router.replace(`/payment/verify?status=cancelled&orderNumber=${encodeURIComponent(orderNumber)}`);
  };

  return (
    <main dir="rtl" className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl text-center sm:p-8">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <CreditCard className="size-8" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          <ShieldCheck className="size-3.5" />
          <span>شبیه‌ساز پرداخت امن مینی‌رویال</span>
        </div>

        <h1 className="mt-4 text-xl font-black text-stone-900">پرداخت اینترنتی زرین‌پال (تستی)</h1>
        
        <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-xs text-stone-600 border border-stone-100">
          <div className="flex justify-between items-center py-1.5 border-b border-stone-200/60">
            <span className="font-medium text-stone-500">شماره سفارش:</span>
            <span className="font-black text-stone-900 font-mono">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="font-medium text-stone-500">مبلغ قابل پرداخت:</span>
            <span className="font-black text-amber-700 text-sm">{toPersianDigits(amount.toLocaleString())} تومان</span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50/70 p-3 text-right text-[11px] text-blue-800 leading-relaxed">
          <AlertCircle className="size-4 shrink-0 text-blue-600 mt-0.5" />
          <span>
            مرچنت‌کد اختصاصی زرین‌پال در هاست هنوز ثبت نشده است. در این حالت می‌توانید با دکمه زیر تراکنش موفق تستی را تجربه کنید تا فرایند ثبت سفارش، ثبت انبار و ایجاد کد پیگیری بررسی شود.
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={processing}
            onClick={handlePaySuccess}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>در حال تأیید پرداخت تستی...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>تأیید پرداخت تستی (شبیه‌ساز موفق)</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-stone-200 py-3 text-xs font-bold text-stone-600 hover:bg-stone-50 transition active:scale-[0.98]"
          >
            <ArrowRight className="size-3.5" />
            <span>انصراف و بازگشت</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SandboxGatewayPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center" dir="rtl">در حال آماده‌سازی درگاه آزمایشی...</div>}>
      <SandboxGatewayContent />
    </Suspense>
  );
}
