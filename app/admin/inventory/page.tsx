"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowDownToLine, Boxes, PackageSearch, RefreshCw } from "lucide-react";
import { mockProducts } from "../../lib/data/mockProducts";
import { formatToman } from "../../lib/utils";

const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

export default function AdminInventoryPage() {
  const rows = useMemo(
    () =>
      mockProducts.flatMap((product) =>
        (product.variants ?? []).map((variant) => ({
          ...variant,
          productTitle: product.title,
          categoryName: product.categoryName,
          value: variant.stock * (product.salePrice ?? product.basePrice),
        }))
      ),
    []
  );

  const totalUnits = rows.reduce((sum, row) => sum + row.stock, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const lowStock = rows.filter((row) => row.stock > 0 && row.stock <= 3);
  const outOfStock = rows.filter((row) => row.stock === 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="fashion-kicker text-[10px] font-black">Inventory control center</p>
          <h1 className="mt-2 text-2xl font-black text-stone-900">مرکز کنترل انبار</h1>
          <p className="mt-1 text-xs text-stone-500">موجودی variantها، هشدار کمبود و ارزش تقریبی انبار مرکزی.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-xs font-black text-white shadow-lg hover:bg-violet-800">
          <ArrowDownToLine className="size-4" /> ثبت ورود کالا
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "کل واحدهای قابل فروش", value: formatNumber(totalUnits), icon: Boxes, tone: "violet" },
          { label: "ارزش تقریبی انبار", value: formatToman(totalValue), icon: PackageSearch, tone: "emerald" },
          { label: "در آستانهٔ کمبود", value: formatNumber(lowStock.length), icon: AlertTriangle, tone: "amber" },
          { label: "ناموجود", value: formatNumber(outOfStock.length), icon: RefreshCw, tone: "rose" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="fashion-surface rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">{item.label}</span>
                <Icon className={`size-5 ${item.tone === "emerald" ? "text-emerald-600" : item.tone === "amber" ? "text-amber-600" : item.tone === "rose" ? "text-rose-600" : "text-violet-700"}`} />
              </div>
              <p className="mt-4 text-xl font-black text-stone-900">{item.value}</p>
            </article>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-5">
          <div>
            <h2 className="text-base font-black text-stone-900">وضعیت موجودی کالاها</h2>
            <p className="mt-1 text-[11px] text-stone-500">مبنای نهایی موجودی از جدول‌های warehouse و inventory_balances تأمین می‌شود.</p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-black text-sky-700">انبار مرکزی · MAIN</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="p-4 font-bold">محصول</th>
                <th className="p-4 font-bold">دسته</th>
                <th className="p-4 font-bold">SKU</th>
                <th className="p-4 font-bold">سایز / رنگ</th>
                <th className="p-4 font-bold">موجودی</th>
                <th className="p-4 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => {
                const status = row.stock === 0 ? "ناموجود" : row.stock <= 3 ? "رو به اتمام" : "موجود";
                return (
                  <tr key={row.id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-stone-900">{row.productTitle}</td>
                    <td className="p-4 text-stone-500">{row.categoryName}</td>
                    <td className="p-4 font-mono text-stone-500">{row.sku}</td>
                    <td className="p-4 text-stone-600">{row.size} · {row.color}</td>
                    <td className="p-4 font-black text-stone-900">{formatNumber(row.stock)} واحد</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${row.stock === 0 ? "bg-rose-50 text-rose-700" : row.stock <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
