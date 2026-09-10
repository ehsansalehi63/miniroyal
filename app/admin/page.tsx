import Link from "next/link";
import { getProducts } from "../lib/catalog";
import { listOrders, getSalesAnalytics } from "../lib/orders";
import { listAdminReviews } from "../lib/reviews";
import { formatToman, toPersianDigits } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  PackageCheck,
  AlertTriangle,
  MessageSquare,
  Star,
  Boxes,
  Truck,
  CheckCircle2,
  Calendar,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [{ products }, orders, reviews, analytics] = await Promise.all([
    getProducts({ limit: 10000 }),
    listOrders(),
    listAdminReviews(),
    getSalesAnalytics(),
  ]);

  const totalProducts = products.length;
  const totalUnits = products.reduce(
    (acc, p) => acc + p.variants.reduce((vs, v) => vs + (v.stock || 0), 0),
    0
  );
  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stock > 0 && v.stock <= 3)
  );
  const outOfStockProducts = products.filter((p) =>
    p.variants.every((v) => v.stock === 0)
  );

  // محاسبه واقعی فروش ماه جاری و ماه قبل
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevDate.toISOString().slice(0, 7);

  const currentMonthOrders = orders.filter(
    (o) => String(o.createdAt).slice(0, 7) === currentMonthStr && o.status !== "cancelled"
  );
  const prevMonthOrders = orders.filter(
    (o) => String(o.createdAt).slice(0, 7) === prevMonthStr && o.status !== "cancelled"
  );

  const monthSales = currentMonthOrders.reduce(
    (sum, o) => sum + Number(o.finalTotal || 0),
    0
  );
  const prevMonthSales = prevMonthOrders.reduce(
    (sum, o) => sum + Number(o.finalTotal || 0),
    0
  );

  let growthPercent = 0;
  if (prevMonthSales > 0) {
    growthPercent = Math.round(((monthSales - prevMonthSales) / prevMonthSales) * 100);
  } else if (monthSales > 0) {
    growthPercent = 100;
  }

  const processingOrdersCount = orders.filter((o) => o.status === "processing").length;
  const shippedOrdersCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "delivered").length;

  // نظرات واقعی ثبت شده
  const totalReviewsCount = reviews.length;
  const pendingReviewsCount = reviews.filter((r) => !r.isApproved).length;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "۵.۰";

  return (
    <div className="space-y-8">
      {/* هدر پیشخوان */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900">پیشخوان مدیریت مینی رویال 📊</h1>
          <p className="mt-1 text-xs text-stone-500">
            گزارش عملکرد واقعی فروشگاه، موجودی دیتابیس، سفارشات، نظرات و تحلیل فروش
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ehsanpaneladmin/products"
            className="rounded-2xl bg-stone-950 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-stone-800 transition"
          >
            + افزودن محصول
          </Link>
          <Link
            href="/ehsanpaneladmin/orders"
            className="rounded-2xl bg-amber-400 px-4 py-2.5 text-xs font-black text-stone-950 shadow-sm hover:bg-amber-300 transition"
          >
            سفارشات تیپاکس
          </Link>
        </div>
      </div>

      {/* ردیف اول: کارت‌های KPI اصلی مبتنی بر واقعیت */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* فروش ماه جاری و درصد رشد واقعی */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">فروش ماه جاری</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-black text-stone-900">
            {formatToman(monthSales)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
            {growthPercent >= 0 ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="size-3.5" />
                ▲ {toPersianDigits(growthPercent)}٪ رشد نسبت به ماه قبل
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-0.5">
                <TrendingDown className="size-3.5" />
                ▼ {toPersianDigits(Math.abs(growthPercent))}٪ نسبت به ماه قبل
              </span>
            )}
          </div>
        </div>

        {/* سفارشات جدید و نیازمند ارسال */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">سفارشات نیازمند ارسال</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <PackageCheck className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-black text-stone-900">
            {toPersianDigits(processingOrdersCount)} سفارش
          </div>
          <span className="mt-1 block text-[11px] font-bold text-amber-700">
            {toPersianDigits(orders.length)} کل سفارشات ثبت‌شده
          </span>
        </div>

        {/* موجودی کل انبار و وضعیت کالاها */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">موجودی انبار</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-600">
              <Boxes className="size-5" />
            </span>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-black text-stone-900">
            {toPersianDigits(totalUnits)} عدد کالا
          </div>
          <span className="mt-1 block text-[11px] font-bold text-stone-500">
            در {toPersianDigits(totalProducts)} تنوع محصول
          </span>
        </div>

        {/* نظرات خریداران و در انتظار بررسی */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">نظرات خریداران</span>
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <MessageSquare className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              {toPersianDigits(totalReviewsCount)} نظر
            </span>
            <span className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-800 border border-amber-200">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {toPersianDigits(averageRating)}
            </span>
          </div>
          <span className="mt-1 block text-[11px] font-bold text-amber-700">
            {pendingReviewsCount > 0 ? (
              <span className="text-rose-600 font-black">
                ⚠️ {toPersianDigits(pendingReviewsCount)} نظر در انتظار تأیید ادمین
              </span>
            ) : (
              "تمام نظرات بررسی و تأیید شده‌اند"
            )}
          </span>
        </div>
      </div>

      {/* ردیف دوم: تحلیل واقعی وضعیت سفارشات و پرفروش‌ترین محصولات */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* وضعیت گردش سفارشات */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Truck className="size-4 text-amber-600" />
            <span>وضعیت گردش سفارشات در سایت</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-amber-50/70 p-3 text-xs">
              <span className="font-bold text-amber-900">در حال پردازش انبار</span>
              <span className="font-black text-amber-950 font-mono text-sm">
                {toPersianDigits(processingOrdersCount)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-sky-50/70 p-3 text-xs">
              <span className="font-bold text-sky-900">تحویل تیپاکس / ارسال شده</span>
              <span className="font-black text-sky-950 font-mono text-sm">
                {toPersianDigits(shippedOrdersCount)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50/70 p-3 text-xs">
              <span className="font-bold text-emerald-900">تحویل موفق به مشتری</span>
              <span className="font-black text-emerald-950 font-mono text-sm">
                {toPersianDigits(deliveredOrdersCount)}
              </span>
            </div>
          </div>
        </div>

        {/* پرفروش‌ترین محصولات بر اساس اقلام سفارشات */}
        <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Flame className="size-4 text-rose-500" />
            <span>پرفروش‌ترین کالاهای فروشگاه (بر اساس سفارشات واقعی)</span>
          </h3>

          {analytics.topProducts.length === 0 ? (
            <p className="text-xs text-stone-400 p-4 text-center">
              با ثبت سفارش‌های جدید در سایت، تحلیل پرفروش‌ترین اقلام به صورت زنده در اینجا ثبت می‌شود.
            </p>
          ) : (
            <div className="space-y-2.5">
              {analytics.topProducts.map((tp, idx) => (
                <div
                  key={tp.productId || idx}
                  className="flex items-center justify-between rounded-2xl bg-stone-50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-white border border-stone-200 font-mono font-black text-[11px] text-stone-700 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-900 truncate max-w-xs sm:max-w-md">
                      {tp.title}
                    </span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-emerald-700 font-mono">
                      {toPersianDigits(tp.totalSold)} عدد فروش
                    </span>
                    <span className="block text-[10px] text-stone-400 font-sans">
                      {formatToman(tp.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ردیف سوم: هشدار واقعی موجودی کالاها */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <h2 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <span>کالاهای نیازمند شارژ مجدد در دیتابیس ({toPersianDigits(lowStockProducts.length)})</span>
          </h2>
          <Link
            href="/ehsanpaneladmin/inventory"
            className="text-xs font-black text-amber-800 hover:text-amber-950"
          >
            مشاهده کل انبار ←
          </Link>
        </div>

        {/* کارت‌های موبایل کالاهای رو به اتمام */}
        <div className="block md:hidden space-y-3">
          {lowStockProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              خوشبختانه تمامی کالاها موجودی کافی دارند.
            </div>
          ) : (
            lowStockProducts.slice(0, 6).map((p) => {
              const lowVariant = p.variants.find((v) => v.stock > 0 && v.stock <= 3) || p.variants[0];
              return (
                <div
                  key={`mob-low-${p.id}`}
                  className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-stone-900">{p.title}</h4>
                    <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 shrink-0">
                      فقط {toPersianDigits(lowVariant?.stock || 0)} عدد
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>مشخصه: {lowVariant?.size} - {lowVariant?.color}</span>
                    <span className="font-mono text-[10px]">SKU: {p.sku}</span>
                  </div>
                  <Link
                    href={`/ehsanpaneladmin/inventory`}
                    className="block text-center rounded-xl bg-amber-400 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-300"
                  >
                    افزایش موجودی در انبار
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* جدول دسکتاپ کالاهای رو به اتمام */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[650px] text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3 font-bold">نام محصول</th>
                <th className="p-3 font-bold">کد کالا (SKU)</th>
                <th className="p-3 font-bold">دسته</th>
                <th className="p-3 font-bold">سایز / رنگ کم موجود</th>
                <th className="p-3 font-bold">موجودی مانده</th>
                <th className="p-3 font-bold text-center">عملیات انبار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-stone-400">
                    تمامی محصولات دارای موجودی کافی هستند.
                  </td>
                </tr>
              ) : (
                lowStockProducts.slice(0, 8).map((p) => {
                  const lowVariant = p.variants.find((v) => v.stock > 0 && v.stock <= 3) || p.variants[0];
                  return (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <td className="p-3 font-bold">{p.title}</td>
                      <td className="p-3 font-mono text-stone-500">{p.sku}</td>
                      <td className="p-3">{p.categoryName}</td>
                      <td className="p-3">{lowVariant?.size} - {lowVariant?.color}</td>
                      <td className="p-3 font-black text-rose-600">
                        {toPersianDigits(lowVariant?.stock || 0)} عدد
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/ehsanpaneladmin/inventory`}
                          className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition"
                        >
                          شارژ موجودی
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

