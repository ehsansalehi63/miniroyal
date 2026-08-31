"use client";

import { useState } from "react";
import { Product } from "../lib/types/catalog";
import VirtualTryonBox from "./VirtualTryonBox";

interface Props {
  products: Product[];
}

export default function VirtualTryonSelector({ products }: Props) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? 0);
  const product = products.find((item) => item.id === selectedId) ?? products[0];
  if (!product) return null;

  return (
    <div dir="rtl" className="space-y-4">
      <label className="block rounded-2xl border border-violet-200 bg-white p-4 text-xs font-black text-stone-800 shadow-sm">
        اول لباس موردنظر برای پرو را انتخاب کنید
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm outline-none focus:border-violet-500"
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
      <VirtualTryonBox key={product.id} product={product} />
    </div>
  );
}
