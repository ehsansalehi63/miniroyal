"use client";
import { useEffect, useState } from "react";
import type { Category } from "../../lib/types/catalog";
import { Plus, FolderTree } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("👕");
  const [parentId, setParentId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const loadCategories = () => fetch("/api/admin/categories", { cache: "no-store" }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "دریافت دسته‌بندی‌ها انجام نشد.");
    setCategories(data.categories || []);
  }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "دریافت دسته‌بندی‌ها انجام نشد."));

  useEffect(() => { void loadCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, icon, parentId }) });
    const data = await response.json();
    if (!response.ok || !data.success) { setMessage(data.error || "ثبت دسته‌بندی انجام نشد."); return; }
    setCategories((current) => [...current, data.category]);
    setName(""); setSlug(""); setIcon("👕"); setParentId(null); setMessage("دسته‌بندی در MySQL ذخیره شد و در فهرست قابل انتخاب است.");
  };

  const parentCategories = categories.filter((category) => !category.parentId);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-stone-900">مدیریت دسته‌بندی‌ها و برندها 📂</h1><p className="mt-1 text-xs text-stone-500">دسته‌بندی‌ها مستقیماً در MySQL ذخیره می‌شوند و در منو و فرم محصول قابل استفاده‌اند.</p></div>
      <form onSubmit={handleAdd} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-stone-900">افزودن دسته جدید</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold text-stone-700">نام دسته *<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: اکسسوری کودک" className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-normal outline-none focus:border-violet-500" /></label>
          <label className="text-xs font-bold text-stone-700">اسلاگ URL *<input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="accessory" className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-normal outline-none focus:border-violet-500" /></label>
          <label className="text-xs font-bold text-stone-700">دسته والد<select value={parentId ?? ""} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 font-normal outline-none focus:border-violet-500"><option value="">دسته اصلی</option>{parentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-xs font-bold text-stone-700">آیکون<input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-normal outline-none focus:border-violet-500" /></label>
        </div>
        {message && <p className="rounded-xl bg-violet-50 p-3 text-xs font-bold text-violet-700">{message}</p>}
        <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"><Plus className="size-4" />ثبت دسته‌بندی جدید</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <div key={category.id} className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><span className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-2xl">{category.icon || "👕"}</span><div><h3 className="text-sm font-bold text-stone-900">{category.name}</h3><p className="text-xs text-stone-500 font-mono">/category/{category.slug}</p>{category.parentId && <p className="mt-1 text-[10px] text-violet-600">زیرمجموعه: {categories.find((item) => item.id === category.parentId)?.name || "دسته والد"}</p>}</div></div>)}</div>
      {!categories.length && <div className="rounded-3xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500"><FolderTree className="mx-auto mb-3 size-8" />هنوز دسته‌ای در دیتابیس ثبت نشده است.</div>}
    </div>
  );
}
