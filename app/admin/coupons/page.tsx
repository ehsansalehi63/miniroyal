"use client";

import { useEffect, useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { Trash2, Plus, Ticket, CheckCircle2, AlertCircle, RefreshCw, Power } from "lucide-react";

interface CouponItem {
  id: number;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  timesUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  // فرم ثبت کد جدید
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrderAmount, setMinOrderAmount] = useState(250000);
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "دریافت کدهای تخفیف ناموفق بود.");
      }
      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در اتصال به دیتابیس کدهای تخفیف.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue,
          minOrderAmount,
          maxDiscount: maxDiscount === "" ? null : Number(maxDiscount),
          usageLimit: usageLimit === "" ? null : Number(usageLimit),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ثبت کد تخفیف ناموفق بود.");
      }

      setSuccessMsg(`کد تخفیف ${code.trim().toUpperCase()} با موفقیت در دیتابیس ثبت شد.`);
      setCode("");
      setMaxDiscount("");
      setUsageLimit("");
      await loadCoupons();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد کد تخفیف.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    setBusyId(coupon.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در تغییر وضعیت.");
      }
      setCoupons((curr) =>
        curr.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "تغییر وضعیت انجام نشد.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "حذف کد تخفیف ناموفق بود.");
      }
      setCoupons((curr) => curr.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف انجام نشد.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مدیریت کوپن‌ها و کدهای تخفیف</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            ساخت و اعمال تخفیف درصدی و ریالی ووکامرس متصل مستقیم به دیتابیس MySQL و سبد خرید خریداران.
          </p>
        </div>
        <button
          onClick={() => void loadCoupons()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>بروزرسانی لیست</span>
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

      {/* فرم ساخت کد تخفیف جدید */}
      <form
        onSubmit={handleAddCoupon}
        className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Plus className="size-4 text-amber-600" />
          <h3 className="text-sm font-black text-stone-900">تعریف کد تخفیف جدید</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-stone-700">کد کوپن *</label>
            <input
              type="text"
              required
              placeholder="مثال: SPRING20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-mono uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">نوع تخفیف</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-bold bg-white"
            >
              <option value="percent">درصدی (%)</option>
              <option value="fixed">مبلغ ثابت (تومان)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">
              {discountType === "percent" ? "درصد تخفیف (۱ تا ۱۰۰)" : "مبلغ تخفیف (تومان)"}
            </label>
            <input
              type="number"
              required
              min={1}
              max={discountType === "percent" ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">حداقل خرید (تومان)</label>
            <input
              type="number"
              min={0}
              step={10000}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">حداکثر تخفیف درصدی (اختیاری)</label>
            <input
              type="number"
              placeholder="مثال: ۱۰۰۰۰۰ تومان"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">سقف تعداد دفعات استفاده (اختیاری)</label>
            <input
              type="number"
              placeholder="مثال: ۵۰ مرتبه"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-stone-950 px-6 py-3 text-xs font-black text-white shadow-md hover:bg-stone-800 transition disabled:opacity-50"
          >
            {submitting ? "در حال ثبت..." : "ثبت و فعال‌سازی در فروشگاه"}
          </button>
        </div>
      </form>

      {/* جدول نمایش کدهای تخفیف */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-4 bg-stone-50/70 flex items-center justify-between">
          <h2 className="text-xs font-black text-stone-800">فهرست کدهای تخفیف ثبت‌شده در دیتابیس</h2>
          <span className="text-[11px] font-bold text-stone-500">{toPersianDigits(coupons.length)} کد فعال و غیرفعال</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">کد کوپن</th>
                <th className="p-3.5 font-bold">نوع</th>
                <th className="p-3.5 font-bold">میزان تخفیف</th>
                <th className="p-3.5 font-bold">حداقل سفارش</th>
                <th className="p-3.5 font-bold">دفعات استفاده</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال فراخوانی اطلاعات..." : "هیچ کد تخفیفی یافت نشد. از فرم بالا اولین کد را بسازید."}
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-mono font-black text-amber-800 text-sm">
                      {c.code}
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-bold">
                        {c.discountType === "percent" ? "درصدی" : "مبلغ ثابت"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold">
                      {c.discountType === "percent" ? `%${toPersianDigits(c.discountValue)}` : formatToman(c.discountValue)}
                      {c.maxDiscount ? (
                        <span className="block text-[10px] text-stone-400 font-normal">
                          سقف: {formatToman(c.maxDiscount)}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3.5 text-stone-600">{formatToman(c.minOrderAmount)}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-stone-700">{toPersianDigits(c.timesUsed)}</span>
                      {c.usageLimit ? (
                        <span className="text-[10px] text-stone-400"> / {toPersianDigits(c.usageLimit)}</span>
                      ) : (
                        <span className="text-[10px] text-stone-400"> مرتبه</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => void handleToggleActive(c)}
                        disabled={busyId === c.id}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black transition ${
                          c.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                      >
                        <Power className="size-3" />
                        <span>{c.isActive ? "فعال" : "غیرفعال"}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => void handleDelete(c.id)}
                        disabled={busyId === c.id}
                        className="rounded-xl p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="حذف کوپن"
                      >
                        <Trash2 className="size-4" />
                      </button>
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
