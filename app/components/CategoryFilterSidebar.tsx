"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "../lib/types/catalog";

interface CategoryFilterSidebarProps {
  categories: Category[];
  availableSizes: string[];
  availableColors: { name: string; hex: string }[];
  currentCategorySlug?: string;
}

export default function CategoryFilterSidebar({
  availableSizes,
  availableColors,
  currentCategorySlug,
}: CategoryFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [gender, setGender] = useState(searchParams.get("gender") || "all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.getAll("size")
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.getAll("color")
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [isOfferOnly, setIsOfferOnly] = useState(
    searchParams.get("offer") === "true"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (gender && gender !== "all") params.set("gender", gender);
    selectedSizes.forEach((s) => params.append("size", s));
    selectedColors.forEach((c) => params.append("color", c));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (isOfferOnly) params.set("offer", "true");
    if (sort && sort !== "recommended") params.set("sort", sort);

    const basePath = currentCategorySlug
      ? `/category/${currentCategorySlug}`
      : "/shop";
    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const resetFilters = () => {
    setGender("all");
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice("");
    setMaxPrice("");
    setIsOfferOnly(false);
    setSort("recommended");
    const basePath = currentCategorySlug
      ? `/category/${currentCategorySlug}`
      : "/shop";
    router.push(basePath);
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  return (
    <aside className="w-full flex-col gap-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <h3 className="text-sm font-black text-stone-950">فیلترهای هوشمند</h3>
        <button
          onClick={resetFilters}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          حذف همه
        </button>
      </div>

      {/* مرتب‌سازی */}
      <div className="mt-4">
        <label className="block text-xs font-black text-stone-800">مرتب‌سازی براساس</label>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
          }}
          className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50/80 p-2.5 text-xs font-bold outline-none focus:border-amber-600"
        >
          <option value="recommended">پیشنهادی مینی رویال</option>
          <option value="newest">جدیدترین کالکشن‌ها</option>
          <option value="bestselling">محبوب‌ترین‌ها</option>
          <option value="price_asc">قیمت: کم به زیاد</option>
          <option value="price_desc">قیمت: زیاد به کم</option>
        </select>
      </div>

      {/* جنسیت */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <label className="block text-xs font-black text-stone-800">جنسیت و رده</label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {[
            { id: "all", label: "همه" },
            { id: "boy", label: "پسرانه" },
            { id: "girl", label: "دخترانه" },
            { id: "unisex", label: "نوزادی و اسپرت" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setGender(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all duration-200 ${
                gender === item.id
                  ? "bg-stone-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* سایزها */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <label className="block text-xs font-black text-stone-800">سایز (سن / قواره)</label>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {availableSizes.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
                  isSelected
                    ? "bg-stone-950 text-white shadow-sm"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* رنگ‌ها */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <label className="block text-xs font-black text-stone-800">پالت رنگی</label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                onClick={() => toggleColor(color.name)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  isSelected
                    ? "border-stone-950 bg-stone-900 text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span
                  className="size-3 rounded-full border border-black/15 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* بازه قیمت */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <label className="block text-xs font-black text-stone-800">محدوده قیمت (تومان)</label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            placeholder="از"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-1/2 rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs outline-none focus:border-amber-600"
          />
          <input
            type="number"
            placeholder="تا"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-1/2 rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs outline-none focus:border-amber-600"
          />
        </div>
      </div>

      {/* تخفیف‌دارها */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
          <input
            type="checkbox"
            checked={isOfferOnly}
            onChange={(e) => setIsOfferOnly(e.target.checked)}
            className="size-4 rounded accent-amber-600"
          />
          🔥 فقط کالاهای تخفیف‌دار و ویژه
        </label>
      </div>

      {/* اعمال فیلتر ها */}
      <button
        onClick={applyFilters}
        className="mt-6 w-full rounded-xl bg-stone-950 py-3 text-xs font-black text-white shadow-md transition hover:bg-stone-800 active:scale-[0.98]"
      >
        اعمال فیلترها
      </button>
    </aside>
  );
}
