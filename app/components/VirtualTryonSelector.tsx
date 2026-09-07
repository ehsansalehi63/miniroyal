"use client";

import { useState } from "react";
import { Product } from "../lib/types/catalog";
import { CustomerSession } from "../lib/customer-auth";
import VirtualTryonBox from "./VirtualTryonBox";

interface Props {
  products: Product[];
  initialProductSlug?: string;
  customer?: CustomerSession | null;
}

export default function VirtualTryonSelector({ products, initialProductSlug, customer }: Props) {
  const initialProduct = products.find((item) => item.slug === initialProductSlug);
  const [selectedId, setSelectedId] = useState<number | null>(initialProduct?.id ?? products[0]?.id ?? null);
  const product = selectedId === null ? undefined : products.find((item) => item.id === selectedId);
  if (!products.length) return <p className="rounded-2xl bg-amber-50 p-4 text-center text-sm">فعلاً محصول قابل پرویی در کاتالوگ موجود نیست.</p>;

  return (
    <div dir="rtl" className="space-y-4">
      <label className="block rounded-2xl border border-stone-200 bg-white p-4 text-xs font-black text-stone-800 shadow-sm">
        مرحلهٔ اول: لباس موردنظر برای پرو را انتخاب کنید
        <select
          value={selectedId ?? ""}
          onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none focus:border-amber-500 font-bold"
        >
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-[10px] font-normal text-stone-500">
          عکس لباس، جدول اندازه و پیشنهاد سایز همین محصول در پرو استفاده می‌شود.
        </span>
      </label>
      {product ? (
        <VirtualTryonBox key={product.id} product={product} customer={customer} />
      ) : (
        <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-10 text-center text-sm font-bold text-amber-900">
          برای فعال‌شدن آپلود عکس و پیشنهاد سایز، ابتدا یک محصول را انتخاب کنید.
        </div>
      )}
    </div>
  );
}
