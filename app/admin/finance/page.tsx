"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockProducts } from "../../lib/data/mockProducts";
import { formatToman } from "../../lib/utils";

export default function AdminFinancePage() {
  const metrics = useMemo(() => {
    const gross = mockProducts.reduce((sum, product) => sum + (product.salePrice ?? product.basePrice) * product.salesCount, 0);
    const fees = Math.round(gross * 0.015);
    const cost = Math.round(gross * 0.42);
    return { gross, fees, cost, net: Math.max(0, gross - fees - cost) };
  }, []);
  const cards: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
    { label: "فروش ناخالص", value: metrics.gross, icon: ReceiptText, color: "text-violet-700" },
    { label: "کارمزد درگاه", value: metrics.fees, icon: ArrowDownLeft, color: "text-rose-600" },
    { label: "بهای تمام‌شده", value: metrics.cost, icon: ArrowUpRight, color: "text-amber-600" },
    { label: "سود عملیاتی تخمینی", value: metrics.net, icon: Landmark, color: "text-emerald-600" },
  ];

  return <div dir="rtl" className="space-y-6">
    <div><p className="fashion-kicker text-[10px] font-black">Sales ledger</p><h1 className="mt-2 text-2xl font-black text-stone-900">حسابداری و مالی فروش</h1><p className="mt-1 text-xs text-stone-500">داشبورد اولیهٔ دفتر فروش؛ هر پرداخت، بازپرداخت و هزینه باید در دفتر دوطرفه ثبت شود.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <article key={label} className="fashion-surface rounded-3xl p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-stone-500">{label}</span><Icon className={`size-5 ${color}`} /></div><p className="mt-4 text-xl font-black text-stone-900">{formatToman(value)}</p></article>)}</div>
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-base font-black text-stone-900">دفتر ثبت رویدادهای مالی</h2><p className="mt-1 text-[11px] text-stone-500">واحد تمام مبالغ: تومان؛ ثبت نهایی از جدول finance_journals و finance_entries انجام می‌شود.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">تعادل بدهکار/بستانکار</span></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-right text-xs"><thead className="bg-stone-50 text-stone-500"><tr><th className="p-3">شرح</th><th className="p-3">حساب بدهکار</th><th className="p-3">حساب بستانکار</th><th className="p-3">مبلغ</th><th className="p-3">وضعیت</th></tr></thead><tbody className="divide-y divide-stone-100">{[["فروش آنلاین سفارش‌های پرداخت‌شده", "بانک و درگاه پرداخت", "فروش پوشاک و اکسسوری", metrics.gross], ["ثبت بهای تمام‌شده کالا", "بهای تمام‌شده کالای فروش‌رفته", "موجودی کالا", metrics.cost], ["کارمزد پرداخت آنلاین", "هزینه کارمزد درگاه", "بانک و درگاه پرداخت", metrics.fees]].map(([title, debit, credit, amount]) => <tr key={String(title)}><td className="p-3 font-bold text-stone-900">{title}</td><td className="p-3 text-stone-600">{debit}</td><td className="p-3 text-stone-600">{credit}</td><td className="p-3 font-black">{formatToman(Number(amount))}</td><td className="p-3"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black text-sky-700">پیش‌نویس</span></td></tr>)}</tbody></table></div></section>
  </div>;
}
