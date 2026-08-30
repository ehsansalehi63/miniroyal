"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function AdminAutomationPage() {
  const [jobs] = useState([
    {
      id: "JOB-9012",
      source: "telegram",
      imagesCount: 4,
      productTitle: "تیشرت پسرانه طرح خرس رویال",
      status: "completed",
      durationSec: 42,
      createdAt: "10 دقیقه پیش",
    },
    {
      id: "JOB-9013",
      source: "pwa",
      imagesCount: 3,
      productTitle: "پیراهن دخترانه گل‌دار بهاری",
      status: "processing",
      durationSec: 15,
      createdAt: "۲ دقیقه پیش",
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">موتور اتوماسیون ۹۰ ثانیه‌ای 🤖</h1>
        <p className="mt-1 text-xs text-stone-500">
          پایپ‌لاین ۹ ایستگاهی دریافت عکس از ربات تلگرام/PWA → پاکسازی تصویر → Vision → تولید محتوا و انتشار
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">حالت انتشار</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-black text-emerald-700">خودکار (Auto Mode)</span>
            <span className="size-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">متوسط زمان پردازش</span>
          <div className="mt-2 text-xl font-black text-stone-900">۳۸ ثانیه</div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">شبکه‌های فعال انتشار</span>
          <div className="mt-2 text-sm font-bold text-stone-800">
            تلگرام، ایتا، بله، اینستاگرام
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-stone-900">آخرین فرآیندهای آپلود و انتشار (`ingest_jobs`)</h3>
          <button className="flex items-center gap-1.5 text-xs font-bold text-violet-700">
            <RefreshCw className="size-3.5" />
            <span>به‌روزرسانی صف</span>
          </button>
        </div>

        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="p-3.5 font-bold">شناسه کار (Job ID)</th>
              <th className="p-3.5 font-bold">ورودی</th>
              <th className="p-3.5 font-bold">تعداد عکس</th>
              <th className="p-3.5 font-bold">عنوان استخراجی</th>
              <th className="p-3.5 font-bold">زمان پردازش</th>
              <th className="p-3.5 font-bold">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-stone-50">
                <td className="p-3.5 font-mono font-bold text-violet-700">{job.id}</td>
                <td className="p-3.5">{job.source === "telegram" ? "ربات تلگرام 📱" : "PWA فروشنده 💻"}</td>
                <td className="p-3.5">{job.imagesCount} تصویر</td>
                <td className="p-3.5 font-bold">{job.productTitle}</td>
                <td className="p-3.5 font-mono">{job.durationSec} ثانیه</td>
                <td className="p-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      job.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {job.status === "completed" ? "تکمیل و منتشر شده" : "در حال پردازش..."}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
