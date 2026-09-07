"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, ShieldCheck, Database, ShoppingBag, CreditCard, MessageSquare, Image, Sparkles } from "lucide-react";

interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: Record<string, { status: "ok" | "warning" | "error"; detail: string }>;
}

export default function AdminHealthPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthCheckResult | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-health");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Health check error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getIcon = (key: string) => {
    switch (key) {
      case "database": return Database;
      case "catalog": return ShoppingBag;
      case "virtual_tryon": return Sparkles;
      case "payment_gateway": return CreditCard;
      case "sms_gateway": return MessageSquare;
      case "github_webhook": return Server;
      case "image_cdn": return Image;
      default: return Activity;
    }
  };

  const getLabel = (key: string) => {
    switch (key) {
      case "database": return "دیتابیس MySQL و جداول";
      case "catalog": return "کاتالوگ محصولات";
      case "virtual_tryon": return "پرو آنلاین هوشمند (Smart Fit)";
      case "payment_gateway": return "درگاه پرداخت زرین‌پال";
      case "sms_gateway": return "سامانه پیامک و کد OTP";
      case "github_webhook": return "دیپلوی اتوماتیک Webhook";
      case "image_cdn": return "بارگذاری عکس‌ها و CDN";
      case "cart_and_checkout": return "سبد خرید و سیستم تسویه";
      default: return key;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">مرکز تست و عیب‌یابی سلامت کامل سیستم 🩺</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-300">
              تست سلامت لایو
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            بررسی خودکار و تست تمام زیرسیستم‌ها، دیتابیس، درگاه پرداخت، پرو آنلاین و وب‌هوک
          </p>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 text-xs font-black text-white shadow-lg transition hover:bg-violet-800 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "در حال تست زیرسیستم‌ها..." : "شروع تست مجدد سلامت کل سایت"}</span>
        </button>
      </div>

      {data && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <span className={`grid size-12 place-items-center rounded-2xl text-2xl ${
                data.status === "healthy" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                {data.status === "healthy" ? "✅" : "⚠️"}
              </span>
              <div>
                <h2 className="text-base font-black text-stone-900">
                  {data.status === "healthy" ? "تمامی زیرسیستم‌های مینی رویال ۱۰۰٪ سالم و عملیاتی هستند" : "یک یا چند زیرسیستم نیازمند بررسی است"}
                </h2>
                <span className="text-xs text-stone-500">
                  آخرین چک: {new Date(data.timestamp).toLocaleString("fa-IR")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(data.checks).map(([key, check]) => {
              const Icon = getIcon(key);
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-4 transition ${
                    check.status === "ok"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : check.status === "warning"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-rose-200 bg-rose-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-stone-900">
                      <Icon className="size-4 text-violet-700" />
                      <span>{getLabel(key)}</span>
                    </div>

                    {check.status === "ok" ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" /> سالم
                      </span>
                    ) : check.status === "warning" ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="size-3" /> هشداری
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                        <XCircle className="size-3" /> ارور
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-stone-600 font-medium">
                    {check.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
