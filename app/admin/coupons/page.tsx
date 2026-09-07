"use client";

import { useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { Trash2 } from "lucide-react";

interface CouponItem {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([
    { id: 1, code: "MINI10", type: "percent", value: 10, minOrder: 200000, isActive: true },
    { id: 2, code: "ROYAL50", type: "fixed", value: 50000, minOrder: 400000, isActive: true },
    { id: 3, code: "WELCOME", type: "percent", value: 15, minOrder: 0, isActive: true },
  ]);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(200000);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const newCoupon: CouponItem = {
      id: Date.now(),
      code: code.trim().toUpperCase(),
      type,
      value,
      minOrder,
      isActive: true,
    };
    setCoupons([...coupons, newCoupon]);
    setCode("");
  };

  const handleDelete = (id: number) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">مدیریت کدهای تخفیف و کمپین‌ها 🏷️</h1>
        <p className="mt-1 text-xs text-stone-500">
          ساخت کد تخفیف جدید، تعیین درصد یا مبلغ ثابت تخفیف و حداقل مبلغ سفارش
        </p>
      </div>

      <form onSubmit={handleAddCoupon} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900">ساخت کد تخفیف جدید</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-stone-700">کد تخفیف *</label>
            <input
              type="text"
              required
              placeholder="مثال: MINI20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">نوع تخفیف</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500 font-bold"
            >
              <option value="percent">درصدی (%)</option>
              <option value="fixed">مبلغ ثابت (تومان)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">مقدار تخفیف</label>
            <input
              type="number"
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">حداقل سفارش (تومان)</label>
            <input
              type="number"
              required
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          ایجاد کد تخفیف جدید
        </button>
      </form>

      {/* لیست کدهای تخفیف */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="p-3.5 font-bold">کد تخفیف</th>
              <th className="p-3.5 font-bold">نوع</th>
              <th className="p-3.5 font-bold">مقدار</th>
              <th className="p-3.5 font-bold">حداقل خرید</th>
              <th className="p-3.5 font-bold">وضعیت</th>
              <th className="p-3.5 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <td className="p-3.5 font-mono font-bold text-violet-700">{c.code}</td>
                <td className="p-3.5">{c.type === "percent" ? "درصدی" : "ثابت"}</td>
                <td className="p-3.5 font-bold">
                  {c.type === "percent" ? `%${toPersianDigits(c.value)}` : formatToman(c.value)}
                </td>
                <td className="p-3.5">{formatToman(c.minOrder)}</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    فعال
                  </span>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600"
                    title="حذف"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
