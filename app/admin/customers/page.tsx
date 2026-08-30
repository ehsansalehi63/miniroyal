"use client";

import { useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import {  } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "مریم احمدی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      email: "maryam@gmail.com",
      role: "customer",
      clubTier: "gold",
      points: 1250,
      ordersCount: 8,
      totalSpent: 4200000,
    },
    {
      id: 2,
      name: "رضا کریمی",
      phone: "۰۹۱۹۸۷۶۵۴۳۲",
      email: "reza@yahoo.com",
      role: "vip",
      clubTier: "silver",
      points: 620,
      ordersCount: 4,
      totalSpent: 2150000,
    },
    {
      id: 3,
      name: "فروغ صادقی (بوتیک کودک نی‌نی)",
      phone: "۰۹۳۵۱۱۱۲۲۳۳",
      email: "boutique@nini.ir",
      role: "wholesale",
      clubTier: "gold",
      points: 3400,
      ordersCount: 15,
      totalSpent: 18500000,
    },
  ]);

  const handleRoleChange = (id: number, newRole: string) => {
    setCustomers(customers.map((c) => (c.id === id ? { ...c, role: newRole } : c)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">مدیریت مشتریان و باشگاه وفاداری 👥</h1>
        <p className="mt-1 text-xs text-stone-500">
          مشاهده لیست مشتریان، سطح باشگاه (طلایی/نقره‌ای/برنز)، امتیازها و تغییر نقش (عمده/VIP)
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">نام مشتری</th>
                <th className="p-3.5 font-bold">تلفن / ایمیل</th>
                <th className="p-3.5 font-bold">نقش کاربری</th>
                <th className="p-3.5 font-bold">سطح باشگاه</th>
                <th className="p-3.5 font-bold">امتیاز باشگاه</th>
                <th className="p-3.5 font-bold">تعداد خرید</th>
                <th className="p-3.5 font-bold">مجموع خرید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="p-3.5 font-bold">{c.name}</td>
                  <td className="p-3.5 text-stone-500">{c.phone}</td>
                  <td className="p-3.5">
                    <select
                      value={c.role}
                      onChange={(e) => handleRoleChange(c.id, e.target.value)}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-1.5 text-xs outline-none focus:border-violet-500 font-bold"
                    >
                      <option value="customer">مشتری عادی</option>
                      <option value="vip">مشتری VIP</option>
                      <option value="wholesale">خریدار عمده B2B</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                      🏆 {c.clubTier === "gold" ? "سطح طلایی" : "سطح نقره‌ای"}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-violet-700">{toPersianDigits(c.points)} امتیاز</td>
                  <td className="p-3.5 font-bold">{toPersianDigits(c.ordersCount)} سفارش</td>
                  <td className="p-3.5 font-extrabold text-emerald-700">{formatToman(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
