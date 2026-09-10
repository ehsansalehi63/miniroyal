"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  PackageSearch,
  RefreshCw,
  Search,
  Check,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import type { Product } from "../../lib/types/catalog";

const formatNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

type InventoryRow = {
  id: number;
  productId: number;
  productTitle: string;
  categoryName?: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  unitPrice: number;
  value: number;
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "in">("all");
  const [editingStock, setEditingStock] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // دیالوگ ثبت ورود کالا (افزایش سریع موجودی)
  const [inflowModalOpen, setInflowModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | "">("");
  const [inflowAmount, setInflowAmount] = useState(10);
  const [inflowSaving, setInflowSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products?limit=100", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "دریافت موجودی انجام نشد.");
      setProducts(data.products || []);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "دریافت موجودی انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const rows: InventoryRow[] = useMemo(
    () =>
      products.flatMap((product) =>
        (product.variants ?? []).map((variant) => {
          const unitPrice = product.salePrice ?? product.basePrice;
          return {
            id: variant.id,
            productId: product.id,
            productTitle: product.title,
            categoryName: product.categoryName,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            unitPrice,
            value: variant.stock * unitPrice,
          };
        })
      ),
    [products]
  );

  const totalUnits = rows.reduce((sum, row) => sum + row.stock, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const lowStockRows = rows.filter((row) => row.stock > 0 && row.stock <= 3);
  const outOfStockRows = rows.filter((row) => row.stock === 0);

  const filteredRows = rows.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.productTitle.toLowerCase().includes(q) ||
      row.sku.toLowerCase().includes(q) ||
      (row.categoryName && row.categoryName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (stockFilter === "low") return row.stock > 0 && row.stock <= 3;
    if (stockFilter === "out") return row.stock === 0;
    if (stockFilter === "in") return row.stock > 3;
    return true;
  });

  const handleUpdateStock = async (variantId: number, targetStock: number) => {
    if (targetStock < 0) return;
    setSavingId(variantId);
    setError("");
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stock: targetStock }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در بروزرسانی موجودی انبار.");
      }

      // آپدیت استیت محلی
      setProducts((currentProducts) =>
        currentProducts.map((p) => ({
          ...p,
          variants: (p.variants ?? []).map((v) =>
            v.id === variantId ? { ...v, stock: data.stock } : v
          ),
        }))
      );

      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });

      setSuccessMsg("موجودی با موفقیت در دیتابیس بروز شد.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بروزرسانی موجودی.");
    } finally {
      setSavingId(null);
    }
  };

  const handleApplyInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || inflowAmount <= 0) return;
    setInflowSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: Number(selectedVariantId), delta: inflowAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ثبت ورود کالا ناموفق بود.");
      }

      setProducts((currentProducts) =>
        currentProducts.map((p) => ({
          ...p,
          variants: (p.variants ?? []).map((v) =>
            v.id === Number(selectedVariantId) ? { ...v, stock: data.stock } : v
          ),
        }))
      );

      setInflowModalOpen(false);
      setSelectedVariantId("");
      setInflowAmount(10);
      setSuccessMsg("ورود کالا با موفقیت به انبار اضافه شد.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت ورود کالا.");
    } finally {
      setInflowSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl" dir="rtl">
      {/* هدر صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مرکز کنترل و انبارداری</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            مدیریت زنده موجودی تنوع‌ها، ویرایش سریع و مستقیم در دیتابیس MySQL و رصد وضعیت تأمین کالا.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadProducts()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>بروزرسانی</span>
          </button>
          <button
            type="button"
            onClick={() => setInflowModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-stone-800 transition"
          >
            <ArrowDownToLine className="size-4 text-amber-400" />
            <span>ثبت ورود کالا</span>
          </button>
        </div>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "کل واحدهای موجود", value: `${formatNumber(totalUnits)} عدد`, icon: Boxes, tone: "amber" },
          { label: "ارزش تقریبی انبار", value: formatToman(totalValue), icon: PackageSearch, tone: "emerald" },
          { label: "در آستانه اتمام (۱ تا ۳)", value: `${formatNumber(lowStockRows.length)} تنوع`, icon: AlertTriangle, tone: "amber" },
          { label: "کالاهای ناموجود (۰)", value: `${formatNumber(outOfStockRows.length)} تنوع`, icon: RefreshCw, tone: "rose" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">{item.label}</span>
                <Icon
                  className={`size-5 ${
                    item.tone === "emerald"
                      ? "text-emerald-600"
                      : item.tone === "amber"
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                />
              </div>
              <p className="mt-3 text-xl font-black text-stone-900">{item.value}</p>
            </article>
          );
        })}
      </div>

      {/* نوار جستجو و فیلترها */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="text"
            placeholder="جستجو در عنوان کالا، بارکد یا کد SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2 pr-10 pl-3 text-xs outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setStockFilter("all")}
            className={`rounded-xl px-3 py-1.5 transition ${
              stockFilter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            همه ({toPersianDigits(rows.length)})
          </button>
          <button
            onClick={() => setStockFilter("low")}
            className={`rounded-xl px-3 py-1.5 transition ${
              stockFilter === "low" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            رو به اتمام ({toPersianDigits(lowStockRows.length)})
          </button>
          <button
            onClick={() => setStockFilter("out")}
            className={`rounded-xl px-3 py-1.5 transition ${
              stockFilter === "out" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            ناموجود ({toPersianDigits(outOfStockRows.length)})
          </button>
          <button
            onClick={() => setStockFilter("in")}
            className={`rounded-xl px-3 py-1.5 transition ${
              stockFilter === "in" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            موجود کافی ({toPersianDigits(rows.length - lowStockRows.length - outOfStockRows.length)})
          </button>
        </div>
      </div>

      {/* کارت‌های لمسی انبارداری مخصوص موبایل */}
      <div className="block md:hidden space-y-3.5">
        {filteredRows.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-400 shadow-sm">
            {loading ? "در حال فراخوانی اطلاعات..." : "هیچ رکوردی مطابق فیلتر یافت نشد."}
          </div>
        ) : (
          filteredRows.map((row) => {
            const currentValue = editingStock[row.id] !== undefined ? editingStock[row.id] : row.stock;
            const isDirty = editingStock[row.id] !== undefined && editingStock[row.id] !== row.stock;
            const isSaving = savingId === row.id;

            return (
              <div
                key={`mob-inv-${row.id}`}
                className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg inline-block">
                      {row.categoryName || "عمومی"}
                    </span>
                    <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-2">
                      {row.productTitle}
                    </h4>
                    <span className="block font-mono text-[10px] text-stone-400 mt-0.5">
                      SKU: {row.sku}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black shrink-0 ${
                      row.stock === 0
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : row.stock <= 3
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {row.stock === 0 ? "ناموجود" : row.stock <= 3 ? "رو به اتمام" : "موجود"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-2.5 text-xs">
                  <span className="text-stone-600 font-bold">
                    مشخصه: <strong className="text-stone-900">{row.size} · {row.color}</strong>
                  </span>

                  <div className="text-left">
                    <span className="text-[10px] text-stone-400 ml-1">موجودی فعلی:</span>
                    <span className="font-mono font-black text-sm text-stone-900">
                      {formatNumber(row.stock)}
                    </span>
                  </div>
                </div>

                {/* کنترلگر ویرایش مستقیم تعداد */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                  <span className="text-xs font-bold text-stone-600">تغییر موجودی:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingStock((prev) => ({
                          ...prev,
                          [row.id]: Math.max(0, currentValue - 1),
                        }))
                      }
                      className="size-8 rounded-xl border border-stone-300 bg-white grid place-items-center text-stone-700 hover:bg-stone-100"
                    >
                      <Minus className="size-3.5" />
                    </button>

                    <input
                      type="number"
                      min={0}
                      value={currentValue}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setEditingStock((prev) => ({ ...prev, [row.id]: val }));
                      }}
                      className="w-16 rounded-xl border border-stone-300 bg-white p-1.5 text-center font-mono font-bold text-xs"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setEditingStock((prev) => ({
                          ...prev,
                          [row.id]: currentValue + 1,
                        }))
                      }
                      className="size-8 rounded-xl border border-stone-300 bg-white grid place-items-center text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="size-3.5" />
                    </button>

                    {isDirty && (
                      <button
                        type="button"
                        onClick={() => void handleUpdateStock(row.id, currentValue)}
                        disabled={isSaving}
                        className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800 transition flex items-center gap-1 shadow-xs"
                      >
                        <Check className="size-3.5" />
                        <span>{isSaving ? "..." : "ذخیره"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* جدول نمایش و ویرایش مستقیم موجودی برای دسکتاپ */}
      <section className="hidden md:block overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-3.5 font-bold">نام محصول</th>
                <th className="p-3.5 font-bold">دسته‌بندی</th>
                <th className="p-3.5 font-bold">کد SKU</th>
                <th className="p-3.5 font-bold">مشخصه (سایز / رنگ)</th>
                <th className="p-3.5 font-bold">موجودی فعلی</th>
                <th className="p-3.5 font-bold">ویرایش سریع موجودی</th>
                <th className="p-3.5 font-bold text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال فراخوانی اطلاعات..." : "هیچ رکوردی مطابق فیلتر یافت نشد."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const currentValue = editingStock[row.id] !== undefined ? editingStock[row.id] : row.stock;
                  const isDirty = editingStock[row.id] !== undefined && editingStock[row.id] !== row.stock;
                  const isSaving = savingId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-stone-50/70">
                      <td className="p-3.5 font-bold text-stone-900 max-w-[200px]">
                        <span className="line-clamp-2">{row.productTitle}</span>
                      </td>
                      <td className="p-3.5 text-stone-500">{row.categoryName || "عمومی"}</td>
                      <td className="p-3.5 font-mono text-stone-500">{row.sku}</td>
                      <td className="p-3.5 text-stone-700 font-medium">
                        {row.size} · {row.color}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-black text-stone-900 text-sm">
                          {formatNumber(row.stock)}
                        </span>
                        <span className="text-[10px] text-stone-400 mr-1">عدد</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStock((prev) => ({
                                ...prev,
                                [row.id]: Math.max(0, currentValue - 1),
                              }))
                            }
                            className="rounded-lg border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100 transition"
                            title="کاهش یک عدد"
                          >
                            <Minus className="size-3" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={currentValue}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setEditingStock((prev) => ({ ...prev, [row.id]: val }));
                            }}
                            className="w-16 rounded-lg border border-stone-200 p-1 text-center font-mono font-bold text-xs outline-none focus:border-amber-500"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setEditingStock((prev) => ({
                                ...prev,
                                [row.id]: currentValue + 1,
                              }))
                            }
                            className="rounded-lg border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100 transition"
                            title="افزایش یک عدد"
                          >
                            <Plus className="size-3" />
                          </button>

                          {isDirty && (
                            <button
                              type="button"
                              onClick={() => void handleUpdateStock(row.id, currentValue)}
                              disabled={isSaving}
                              className="rounded-lg bg-emerald-700 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition flex items-center gap-1 shadow-sm"
                              title="ذخیره در دیتابیس"
                            >
                              <Check className="size-3" />
                              <span>{isSaving ? "..." : "ذخیره"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            row.stock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : row.stock <= 3
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {row.stock === 0 ? "ناموجود" : row.stock <= 3 ? "رو به اتمام" : "موجود"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* مدال ثبت ورود کالا (شارژ سریع انبار) */}
      {inflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="size-5 text-amber-600" />
                <h3 className="text-sm font-black text-stone-900">ثبت ورود محموله به انبار</h3>
              </div>
              <button
                onClick={() => setInflowModalOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleApplyInflow} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700">انتخاب کالا و تنوع سایز/رنگ *</label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-amber-500 bg-white font-medium"
                >
                  <option value="">-- انتخاب کنید --</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.productTitle} ({r.size} - {r.color}) | موجودی: {r.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700">تعداد ورودی به انبار (افزایش به موجودی) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={inflowAmount}
                  onChange={(e) => setInflowAmount(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 p-2.5 text-xs font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInflowModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={inflowSaving || !selectedVariantId}
                  className="rounded-xl bg-stone-950 px-5 py-2 text-xs font-black text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {inflowSaving ? "در حال ثبت..." : "افزایش موجودی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
