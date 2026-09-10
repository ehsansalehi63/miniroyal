"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, AlertCircle, RefreshCw, Play, Clock, Sparkles } from "lucide-react";
import { toPersianDigits } from "../../lib/utils";

type JobRecord = {
  id: number;
  job_type: string;
  payload_json?: any;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  error_message?: string;
  created_at: string;
};

export default function AdminAutomationPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/automation", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        throw new Error(data.error || "دریافت صف اتوماسیون انجام نشد.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت صف اتوماسیون");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const handleTriggerJob = async (jobType: string, label: string) => {
    setTriggering(true);
    setError("");
    try {
      const res = await fetch("/api/admin/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobType,
          payload: { triggeredBy: "admin_panel", requestedAt: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ثبت تسک انجام نشد.");
      }
      setSuccessMsg(`تسک «${label}» با موفقیت در صف پردازش دیتابیس ثبت شد.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در اجرای تسک");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">موتور اتوماسیون و صف کارهای پس‌زمینه</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            پایپ‌لاین پردازش تصویر، تطبیق سایز و مشخصات با Vision، همگام‌سازی موجودی و صف پس‌زمینه MySQL.
          </p>
        </div>

        <button
          onClick={() => void loadJobs()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>بروزرسانی صف</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* کارت‌های آماری */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">وضعیت موتور اتوماسیون</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-black text-emerald-700">فعال و آماده‌باش</span>
            <span className="size-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">تعداد کارهای ثبت‌شده در صف</span>
          <div className="mt-2 text-2xl font-black text-stone-900">{toPersianDigits(jobs.length)} تسک</div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">شبکه‌های متصل انتشار</span>
          <div className="mt-2 text-xs font-bold text-stone-700">تلگرام، بله، ایتا، سایت فروشگاهی</div>
        </div>
      </div>

      {/* دکمه‌های اجرای سریع تسک‌ها */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-stone-900 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600" />
          <span>اجرای دستی وظایف و بررسی هوشمند فروشگاه</span>
        </h3>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => void handleTriggerJob("inventory_sync", "بررسی سلامت انبار و آستانه کسری")}
            disabled={triggering}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition disabled:opacity-50"
          >
            <Play className="size-3.5 text-amber-400" />
            <span>اجرای ممیزی انبار و موجودی کالاها</span>
          </button>
          <button
            onClick={() => void handleTriggerJob("seo_sitemap_sync", "تولید مجدد سایت‌مپ و بهینه‌سازی SEO")}
            disabled={triggering}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50 transition disabled:opacity-50"
          >
            <Play className="size-3.5 text-stone-600" />
            <span>بروزرسانی سایت‌مپ و تگ‌های سئو</span>
          </button>
        </div>
      </div>

      {/* جدول تسک‌ها */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-xs font-bold text-stone-900">صف کارهای ثبت‌شده در جدول دیتابیس (`job_queue`)</h3>
          <span className="text-[11px] text-stone-400">آخرین ۵۰ مورد</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">شناسه</th>
                <th className="p-3.5 font-bold">نوع تسک</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold">تعداد تلاش</th>
                <th className="p-3.5 font-bold">تاریخ و زمان ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال دریافت صف..." : "هیچ تسکی در صف وجود ندارد."}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono font-bold text-amber-800">#{job.id}</td>
                    <td className="p-3.5 font-mono font-medium text-stone-900">{job.job_type}</td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          job.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : job.status === "processing"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : job.status === "failed"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {job.status === "completed"
                          ? "تکمیل شده ✅"
                          : job.status === "processing"
                          ? "در حال پردازش ⏳"
                          : job.status === "failed"
                          ? "خطا ❌"
                          : "در صف انتظار"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{toPersianDigits(job.attempts)}</td>
                    <td className="p-3.5 text-stone-500 font-sans">
                      {new Date(job.created_at).toLocaleString("fa-IR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
