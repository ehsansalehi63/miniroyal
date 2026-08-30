"use client";

import { useState } from "react";
import { mockCategories } from "../../lib/data/mockProducts";
import { Plus, Edit, FolderTree } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(mockCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("👕");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    const newCat = {
      id: Date.now(),
      parentId: null,
      name,
      slug,
      description: "دسته‌بندی جدید",
      icon,
      sortOrder: categories.length + 1,
    };
    setCategories([...categories, newCat]);
    setName("");
    setSlug("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">مدیریت دسته‌بندی‌ها و برندها 📂</h1>
        <p className="mt-1 text-xs text-stone-500">
          ایجاد و ویرایش دسته‌بندی‌های کاتالوگ فروشگاه، تغییر آیکون و آدرس‌های فارسی URL
        </p>
      </div>

      <form onSubmit={handleAdd} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900">افزودن دسته جدید</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-stone-700">نام دسته *</label>
            <input
              type="text"
              required
              placeholder="مثال: اکسسوری کودک"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">اسلاگ (URL) *</label>
            <input
              type="text"
              required
              placeholder="مثال: accessory"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">آیکون / ایموجی</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          ثبت دسته‌بندی جدید
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.slug} className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-2xl">
              {c.icon || "👕"}
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{c.name}</h3>
              <p className="text-xs text-stone-500 font-mono">/category/{c.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
