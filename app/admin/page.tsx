import Link from "next/link";
import { mockProducts } from "../lib/data/mockProducts";
import { formatToman, toPersianDigits } from "../lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  Users,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((p) =>
    p.variants.some((v) => v.stock <= 3)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">پیشخوان مدیریت مینی رویال 📊</h1>
          <p className="mt-1 text-xs text-stone-500">
            گزارش عملکرد فروشگاه، وضعیت انبار، سفارشات جدید و شاخص‌های کلیدی (KPIs)
          </p>
        </div>

        <Link
          href="/admin/products"
          className="rounded-2xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          + افزودن محصول جدید
        </Link>
      </div>

      {/* کارت‌های KPI اصلی */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">فروش ماه جاری</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900">
            {formatToman(48500000)}
          </div>
          <span className="mt-1 block text-[11px] font-bold text-emerald-600">
            ▲ ۱۸٪ رشد نسبت به ماه قبل
          </span>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">سفارشات جدید</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-600">
              <PackageCheck className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900">
            {toPersianDigits(142)} سفارش
          </div>
          <span className="mt-1 block text-[11px] font-bold text-violet-600">
            ۱۲ سفارش نیازمند پردازش انبار
          </span>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">تعداد کالاها</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-600">
              <ShoppingBag className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900">
            {toPersianDigits(totalProducts)} تنوع محصول
          </div>
          <span className="mt-1 block text-[11px] font-bold text-stone-500">
            شامل ۳۰ محصول فعال با عکس
          </span>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">هشدار موجودی کم</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">
            {toPersianDigits(lowStockProducts.length)} محصول
          </div>
          <span className="mt-1 block text-[11px] font-bold text-amber-600">
            سایزهای زیر ۳ عدد نیازمند شارژ
          </span>
        </div>
      </div>

      {/* هشدار موجودی انبار */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-4">
          ⚠️ کالاهای نیازمند شارژ مجدد موجودی
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3 font-bold">نام محصول</th>
                <th className="p-3 font-bold">کد کالا (SKU)</th>
                <th className="p-3 font-bold">دسته</th>
                <th className="p-3 font-bold">سایز / رنگ کم موجود</th>
                <th className="p-3 font-bold">موجودی مانده</th>
                <th className="p-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {lowStockProducts.slice(0, 5).map((p) => {
                const lowVariant = p.variants.find((v) => v.stock <= 3) || p.variants[0];
                return (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="p-3 font-bold">{p.title}</td>
                    <td className="p-3 font-mono text-stone-500">{p.sku}</td>
                    <td className="p-3">{p.categoryName}</td>
                    <td className="p-3">{lowVariant?.size} - {lowVariant?.color}</td>
                    <td className="p-3 font-black text-rose-600">{toPersianDigits(lowVariant?.stock || 0)} عدد</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/products?edit=${p.id}`}
                        className="rounded-lg bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100"
                      >
                        ویرایش موجودی
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
