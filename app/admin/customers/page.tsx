"use client";

import { useEffect, useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { Users, Shield, Award, Search, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface CustomerItem {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: "customer" | "vip" | "wholesale";
  clubTier: "bronze" | "silver" | "gold";
  points: number;
  ordersCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/customers", { cache: "no-store" });
      const result = await response.json();
      if (result.success && Array.isArray(result.customers)) {
        setCustomers(
          result.customers.map((c: any) => ({
            id: c.id,
            name: c.name || "کاربر مینی‌رویال",
            phone: c.phone || "---",
            email: c.email || "",
            role: c.role || "customer",
            clubTier: c.clubTier || "bronze",
            points: Number(c.points || 0),
            ordersCount: Number(c.ordersCount || 0),
            totalSpent: Number(c.totalSpent || 0),
          }))
        );
      } else {
        throw new Error(result.error || "خطا در دریافت لیست مشتریان");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت اطلاعات مشتریان انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const handleUpdateRoleOrTier = async (
    id: number,
    patch: { role?: CustomerItem["role"]; clubTier?: CustomerItem["clubTier"] }
  ) => {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در بروزرسانی مشخصات مشتری.");
      }

      setCustomers((current) =>
        current.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
      setSuccessMsg("مشخصات مشتری با موفقیت در دیتابیس بروز شد.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بروزرسانی انجام نشد.");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const vipCount = customers.filter((c) => c.role === "vip").length;
  const wholesaleCount = customers.filter((c) => c.role === "wholesale").length;

  return (
    <div dir="rtl" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مدیریت مشتریان و باشگاه وفاداری</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            فهرست مشتریان، سطح باشگاه (طلایی/نقره‌ای/برنز)، حجم سفارش‌ها و تغییر نقش تجاری (عمده‌فروش B2B / VIP).
          </p>
        </div>

        <button
          onClick={() => void loadCustomers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>بروزرسانی</span>
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
          <span className="text-xs font-bold text-stone-500">کل خریداران ثبت‌شده</span>
          <p className="mt-2 text-2xl font-black text-stone-900">{toPersianDigits(customers.length)} نفر</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">مشتریان ویژه (VIP)</span>
          <p className="mt-2 text-2xl font-black text-amber-700">{toPersianDigits(vipCount)} نفر</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-stone-500">خریداران عمده (B2B)</span>
          <p className="mt-2 text-2xl font-black text-emerald-700">{toPersianDigits(wholesaleCount)} فروشگاه</p>
        </div>
      </div>

      {/* جستجو */}
      <div className="relative rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <input
          type="text"
          placeholder="جستجو بر اساس نام، شماره موبایل یا ایمیل مشتری..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl py-1.5 pr-8 pl-3 text-xs outline-none"
        />
      </div>

      {/* جدول مشتریان */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">نام خریدار</th>
                <th className="p-3.5 font-bold">شماره تماس / ایمیل</th>
                <th className="p-3.5 font-bold">نقش کاربری</th>
                <th className="p-3.5 font-bold">سطح باشگاه وفاداری</th>
                <th className="p-3.5 font-bold">امتیاز باشگاه</th>
                <th className="p-3.5 font-bold">تعداد خرید</th>
                <th className="p-3.5 font-bold">مجموع خرید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال دریافت اطلاعات..." : "هیچ مشتری‌ای یافت نشد."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold text-stone-900">{c.name}</td>
                    <td className="p-3.5">
                      <div className="font-mono text-stone-600" dir="ltr">{c.phone}</div>
                      {c.email && <div className="text-[10px] text-stone-400 font-mono" dir="ltr">{c.email}</div>}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={c.role}
                        disabled={savingId === c.id}
                        onChange={(e) => void handleUpdateRoleOrTier(c.id, { role: e.target.value as CustomerItem["role"] })}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-1.5 text-xs outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="customer">مشتری عادی</option>
                        <option value="vip">مشتری VIP 🌟</option>
                        <option value="wholesale">خریدار عمده B2B 💼</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={c.clubTier}
                        disabled={savingId === c.id}
                        onChange={(e) => void handleUpdateRoleOrTier(c.id, { clubTier: e.target.value as CustomerItem["clubTier"] })}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-1.5 text-xs outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="bronze">🥉 برنز</option>
                        <option value="silver">🥈 نقره‌ای</option>
                        <option value="gold">🥇 طلایی</option>
                      </select>
                    </td>
                    <td className="p-3.5 font-black text-amber-800">
                      {toPersianDigits(c.points)} امتیاز
                    </td>
                    <td className="p-3.5 font-bold">
                      {toPersianDigits(c.ordersCount)} سفارش
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-700">
                      {formatToman(c.totalSpent)}
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
