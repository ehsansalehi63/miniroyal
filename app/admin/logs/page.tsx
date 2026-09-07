"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

type Log = { timestamp: string; level: string; event: string; route?: string; method?: string; statusCode?: number; message?: string; requestId?: string; context?: Record<string, unknown> };

const levelLabel: Record<string, string> = { error: "خطا", warn: "هشدار", info: "اطلاعات", debug: "اشکال‌زدایی" };

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch(`/api/admin/logs?limit=300&level=${encodeURIComponent(level)}&search=${encodeURIComponent(search)}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "دریافت لاگ انجام نشد."); setLogs(data.logs || []); } catch (reason) { setError(reason instanceof Error ? reason.message : "دریافت لاگ انجام نشد."); } finally { setLoading(false); }
  }, [level, search]);
  useEffect(() => { void load(); }, [load]);
  return <div dir="rtl" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black text-stone-900">لاگ و عیب‌یابی سیستم</h1><p className="mt-1 text-xs text-stone-500">درخواست‌ها، خطاهای API، زمان پاسخ و رخدادهای سرور برای بررسی سریع.</p></div><button type="button" onClick={() => void load()} className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> تازه‌سازی</button></div>
    <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-3"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-stone-200 px-3"><Search className="size-4 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی route، رخداد یا پیام..." className="w-full p-2 text-xs outline-none" /></div><select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs"><option value="">همهٔ سطوح</option><option value="error">خطاها</option><option value="warn">هشدارها</option><option value="info">اطلاعات</option></select></div>
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-xs"><thead className="bg-stone-50 text-stone-600"><tr><th className="p-3">زمان</th><th className="p-3">سطح</th><th className="p-3">رخداد</th><th className="p-3">route</th><th className="p-3">وضعیت</th><th className="p-3">پیام / مدت</th></tr></thead><tbody className="divide-y divide-stone-100">{logs.map((log, index) => <tr key={`${log.timestamp}-${index}`} className="hover:bg-stone-50"><td className="whitespace-nowrap p-3 text-stone-500">{new Date(log.timestamp).toLocaleString("fa-IR")}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${log.level === "error" ? "bg-rose-100 text-rose-700" : log.level === "warn" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{levelLabel[log.level] || log.level}</span></td><td className="p-3 font-bold">{log.event}</td><td className="max-w-sm truncate p-3 font-mono text-[10px] text-stone-500">{log.method} {log.route}</td><td className="p-3 font-bold">{log.statusCode || "—"}</td><td className="p-3 text-stone-600">{log.message || (log.context?.durationMs ? `مدت پاسخ: ${log.context.durationMs}ms` : "—")}</td></tr>)}{!logs.length && <tr><td colSpan={6} className="p-10 text-center text-stone-500">لاگی برای نمایش وجود ندارد.</td></tr>}</tbody></table></div></div>
  </div>;
}
