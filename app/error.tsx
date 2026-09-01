"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, ShoppingBag } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js Error Boundary caught:", error);
    // Auto-retry once on cold start
    const timer = setTimeout(() => {
      reset();
    }, 200);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center p-6 text-center font-sans dir-rtl">
      <div className="grid size-20 overflow-hidden rounded-3xl bg-violet-100 shadow-lg">
        <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
      </div>
      <h1 className="mt-6 text-2xl font-black text-stone-900 sm:text-3xl">
        در حال بارگذاری سریع فروشگاه مینی رویال...
      </h1>
      <p className="mt-2 text-xs text-stone-500 sm:text-sm">
        سرور در حال بارگذاری اطلاعات است؛ تا چند لحظه دیگر صفحه خودکار به‌روزرسانی می‌شود.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-800"
        >
          <RefreshCw className="size-4" />
          <span>تلاش مجدد بارگذاری</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50"
        >
          <Home className="size-4" />
          <span>صفحه اصلی</span>
        </Link>
      </div>
    </div>
  );
}
