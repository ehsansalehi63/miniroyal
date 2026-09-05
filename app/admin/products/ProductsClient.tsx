"use client";

import { useEffect, useState } from "react";
import { Category, Product, SizeChartRow, Variant } from "../../lib/types/catalog";
import { formatToman } from "../../lib/utils";
import DropzoneImageUploader from "../../components/DropzoneImageUploader";
import ProductAngleMediaManager from "../../components/ProductAngleMediaManager";
import ProductSpecificationsEditor, { ProductAttributeDraft } from "../../components/ProductSpecificationsEditor";
import type { ProductMediaAngle, ProductAngleMedia } from "../../lib/types/catalog";
import { Search, Plus, Edit, Trash2, Copy } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [apiMessage, setApiMessage] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [attributes, setAttributes] = useState<ProductAttributeDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("پسرانه");
  const [basePrice, setBasePrice] = useState(380000);
  const [salePrice, setSalePrice] = useState(295000);
  const [sku, setSku] = useState("KID-BOY-NEW");
  const [variants, setVariants] = useState<Variant[]>([
    { id: 1, productId: 0, sku: "KID-BOY-NEW-01", size: "", color: "", colorCode: "#000000", stock: 0, priceAdjustment: 0 },
  ]);
  const [images, setImages] = useState<string[]>([
    "/images/products/boy-hoodie.svg",
  ]);
  const [mediaAngles, setMediaAngles] = useState<Partial<Record<ProductMediaAngle, ProductAngleMedia>>>({});
  const [sizeChart, setSizeChart] = useState<SizeChartRow[]>([
    { size: "۴ سال", ageRange: "۳ تا ۴ سال", heightCm: "۹۸ تا ۱۰۴", chestCm: "۵۴ تا ۵۶", lengthCm: "۴۲" },
  ]);
  const [fitProfile, setFitProfile] = useState<NonNullable<Product["fitProfile"]>>({
    garmentType: "top",
    measurementMethod: "garment",
    preferredBodyMeasurement: "height",
    easeCm: 7,
    stretch: "low",
    sizeSystem: "age",
    tryOnAnchors: { shoulder: 50, waist: 52, length: 68 },
  });

  useEffect(() => {
    fetch("/api/admin/products?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "دریافت محصولات از دیتابیس انجام نشد.");
        if (Array.isArray(data.products) && data.products.length) setProducts(data.products.map((product: Product & { short_desc?: string; category_name?: string; size_chart_json?: SizeChartRow[] }) => ({
          ...product,
          title: String(product.title || "محصول بدون عنوان"),
          sku: String(product.sku || "بدون SKU"),
          shortDesc: product.shortDesc || product.short_desc || "",
          categoryName: String(product.categoryName || product.category_name || "بدون دسته‌بندی"),
          images: Array.isArray(product.images) ? (product.images as Array<string | { url: string }>).map((image) => typeof image === "string" ? image : image.url).filter(Boolean) : [],
          variants: Array.isArray(product.variants) ? product.variants : [],
          sizeChartJson: product.sizeChartJson || product.size_chart_json || [],
        })));
      })
      .catch((error: unknown) => setApiMessage(error instanceof Error ? error.message : "دریافت محصولات انجام نشد."))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "دریافت دسته‌بندی‌ها انجام نشد."); setCategories(data.categories || []); })
      .catch((error: unknown) => setApiMessage(error instanceof Error ? error.message : "دریافت دسته‌بندی‌ها انجام نشد."));
  }, []);

  const filtered = products.filter(
    (p) =>
      String(p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiMessage("");
    const finalImages = images.length > 0 ? images : ["/images/products/boy-hoodie.svg"];
    const payload = {
      title, sku, categoryId: categoryId || editingProduct?.categoryId || categories[0]?.id || 0, categoryName, basePrice, salePrice,
      shortDesc: editingProduct?.shortDesc || "محصول جدید افزوده شده توسط مدیر سیستم",
      description: editingProduct?.description || "توضیحات کامل محصول در پنل مدیریت ثبت شده است.",
      gender: editingProduct?.gender || "boy", ageMinMonth: editingProduct?.ageMinMonth || 24, ageMaxMonth: editingProduct?.ageMaxMonth || 96,
      status: editingProduct?.status || "draft", fitType: editingProduct?.fitType || "normal", sizeChartJson: sizeChart, fitProfile, images: finalImages.map((url, index) => ({ url, alt: title, sortOrder: index, isPrimary: index === 0 })),
      mediaAngles: Object.values(mediaAngles).filter(Boolean), attributes, variants: variants.map((variant) => ({ sku: variant.sku || `${sku}-${variant.id}`, size: variant.size, color: variant.color, colorCode: variant.colorCode, stock: variant.stock, priceAdjustment: variant.priceAdjustment })),
    };
    setSaving(true);
    try {
      const response = await fetch(editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products", { method: editingProduct ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) { setApiMessage(data.error || "ذخیرهٔ محصول در دیتابیس انجام نشد."); return; }
      setApiMessage("محصول و مشخصات آن با موفقیت ذخیره شد.");
      if (editingProduct) setProducts(products.map((p) => p.id === editingProduct.id ? { ...p, title, categoryName, basePrice, salePrice, sku, images: finalImages, variants, sizeChartJson: sizeChart, fitProfile, mediaAngles, attributes } : p));
      else window.location.reload();
      setShowFormModal(false); setEditingProduct(null);
    } catch (error) { setApiMessage(error instanceof Error ? error.message : "ارتباط با سرور هنگام ذخیره قطع شد."); } finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setCategoryName(p.categoryName);
    setCategoryId(p.categoryId);
    setBasePrice(p.basePrice);
    setSalePrice(p.salePrice ?? p.basePrice);
    setSku(p.sku);
    setVariants(p.variants?.length ? p.variants : [{ id: p.id * 1000, productId: p.id, sku: `${p.sku}-01`, size: "", color: "", colorCode: "#000000", stock: 0, priceAdjustment: 0 }]);
            setImages(p.images || []);
    setMediaAngles(p.mediaAngles || {});
    setAttributes((p.attributes || []) as ProductAttributeDraft[]);
    setSizeChart(p.sizeChartJson?.length ? p.sizeChartJson : [{ size: "", ageRange: "", heightCm: "", chestCm: "", lengthCm: "" }]);
    setFitProfile(p.fitProfile ?? fitProfile);
    setShowFormModal(true);
  };

  const handleClone = async (id: number) => {
    if (!confirm("از این محصول یک پیش‌نویس کپی ساخته شود؟")) return;
    const response = await fetch(`/api/admin/products/${id}/clone`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) { setApiMessage(data.error || "کپی محصول انجام نشد."); return; }
    setApiMessage("کپی پیش‌نویس محصول ساخته شد.");
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.success) { setApiMessage(data.error || "حذف محصول انجام نشد."); return; }
    setProducts(products.filter((p) => p.id !== id));
    setApiMessage("محصول آرشیو شد.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">مدیریت کاتالوگ و محصولات 👕</h1>
          <p className="mt-1 text-xs text-stone-500">
            مدیریت کامل لیست ۳۰+ محصول، آپلود تصاویر Drag & Drop، قیمت، تخفیف و موجودی انبار
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setTitle("");
            setImages(["/images/products/boy-hoodie.svg"]);
            setMediaAngles({});
            setAttributes([]);
            setCategoryId(0);
            setVariants([{ id: Date.now(), productId: 0, sku: "KID-BOY-NEW-01", size: "", color: "", colorCode: "#000000", stock: 0, priceAdjustment: 0 }]);
            setSizeChart([{ size: "", ageRange: "", heightCm: "", chestCm: "", lengthCm: "" }]);
            setFitProfile({ garmentType: "top", measurementMethod: "garment", preferredBodyMeasurement: "height", easeCm: 7, stretch: "low", sizeSystem: "age", tryOnAnchors: { shoulder: 50, waist: 52, length: 68 } });
            setShowFormModal(true);
          }}
          className="flex items-center gap-1.5 rounded-2xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          <Plus className="size-4" />
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* جستجو و فیلتر */}
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <Search className="size-4 text-stone-400" />
        <input
          type="text"
          placeholder="جستجوی نام محصول، SKU یا دسته‌بندی..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* جدول محصولات */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">تصویر</th>
                <th className="p-3.5 font-bold">عنوان محصول</th>
                <th className="p-3.5 font-bold">SKU</th>
                <th className="p-3.5 font-bold">دسته</th>
                <th className="p-3.5 font-bold">قیمت پایه</th>
                <th className="p-3.5 font-bold">قیمت فروش</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition">
                  <td className="p-3">
                    <img src={p.images[0]} alt={p.title} className="size-12 rounded-xl object-cover" />
                  </td>
                  <td className="p-3 font-bold max-w-xs">{p.title}</td>
                  <td className="p-3 font-mono text-stone-500">{p.sku}</td>
                  <td className="p-3">
                    <span className="rounded-lg bg-violet-50 px-2 py-1 font-bold text-violet-700">
                      {p.categoryName}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{formatToman(p.basePrice)}</td>
                  <td className="p-3 font-extrabold text-emerald-700">
                    {formatToman(p.salePrice ?? p.basePrice)}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      فعال در سایت
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-violet-700"
                        title="ویرایش"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button onClick={() => void handleClone(p.id)} className="rounded-lg p-1.5 text-stone-600 hover:bg-sky-50 hover:text-sky-700" title="ساخت کپی"><Copy className="size-4" /></button>
                      <button
                        onClick={() => void handleDelete(p.id)}
                        className="rounded-lg p-1.5 text-stone-600 hover:bg-rose-50 hover:text-rose-600"
                        title="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال افزودن / ویرایش */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3">
              {editingProduct ? "ویرایش مشخصات و تصاویر محصول" : "افزودن محصول جدید به کاتالوگ"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700">عنوان محصول *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>

              {/* آپلود Drag & Drop تصاویر */}
              <DropzoneImageUploader images={images} onChange={setImages} />
              <ProductAngleMediaManager value={mediaAngles} onChange={setMediaAngles} />

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4" dir="rtl">
                <div className="flex items-center justify-between gap-3">
                  <div><h4 className="text-xs font-black text-sky-950">رنگ‌ها، سایزها و موجودی انبار</h4><p className="mt-1 text-[10px] text-sky-800">برای هر ترکیب رنگ/سایز یک کد کالا ثبت کنید.</p></div>
                  <button type="button" onClick={() => setVariants([...variants, { id: Date.now(), productId: 0, sku: `${sku}-${variants.length + 1}`, size: "", color: "", colorCode: "#000000", stock: 0, priceAdjustment: 0 }])} className="rounded-lg bg-sky-700 px-3 py-2 text-[10px] font-bold text-white">افزودن ترکیب</button>
                </div>
                <div className="mt-3 space-y-2">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="grid gap-2 sm:grid-cols-6">
                      {(["sku", "size", "color", "colorCode", "stock", "priceAdjustment"] as const).map((field) => (
                        <input key={field} required={field !== "priceAdjustment"} type={field === "stock" || field === "priceAdjustment" ? "number" : field === "colorCode" ? "color" : "text"} placeholder={{ sku: "کد کالا", size: "سایز", color: "رنگ", colorCode: "رنگ", stock: "موجودی", priceAdjustment: "اختلاف قیمت" }[field]} value={variant[field]} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, [field]: field === "stock" || field === "priceAdjustment" ? Number(e.target.value) : e.target.value } : item))} className="rounded-lg border border-sky-200 bg-white p-2 text-[10px] outline-none" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" dir="rtl">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-emerald-950">اندازه‌های واقعی لباس</h4>
                    <p className="mt-1 text-[10px] text-emerald-800">این جدول مستقیماً برای پیشنهاد سایز و دقت پرو استفاده می‌شود.</p>
                  </div>
                  <button type="button" onClick={() => setSizeChart([...sizeChart, { size: "", ageRange: "", heightCm: "", chestCm: "", lengthCm: "" }])} className="rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white">افزودن سایز</button>
                </div>
                <div className="mt-3 space-y-2">
                  {sizeChart.map((row, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
                      {(["size", "ageRange", "heightCm", "chestCm", "waistCm", "hipCm", "shoulderCm", "garmentLengthCm"] as const).map((field) => (
                        <input key={field} required={field !== "waistCm" && field !== "hipCm" && field !== "shoulderCm"} placeholder={{ size: "سایز", ageRange: "بازه سنی", heightCm: "قد کودک", chestCm: "سینه کودک", waistCm: "کمر", hipCm: "باسن", shoulderCm: "شانه", garmentLengthCm: "قد لباس" }[field]} value={row[field] ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))} className="rounded-lg border border-emerald-200 bg-white p-2 text-[10px] outline-none" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4" dir="rtl">
                <h4 className="text-xs font-black text-violet-950">پروفایل اختصاصی فیت و پرو محصول</h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <select value={fitProfile.garmentType} onChange={(e) => setFitProfile({ ...fitProfile, garmentType: e.target.value as NonNullable<Product["fitProfile"]>["garmentType"] })} className="rounded-lg border border-violet-200 bg-white p-2 text-xs">
                    <option value="top">بالاپوش</option><option value="bottom">شلوار/دامن</option><option value="dress">پیراهن</option><option value="outerwear">کاپشن</option><option value="set">ست</option><option value="baby">نوزادی</option>
                  </select>
                  <select value={fitProfile.measurementMethod} onChange={(e) => setFitProfile({ ...fitProfile, measurementMethod: e.target.value as NonNullable<Product["fitProfile"]>["measurementMethod"] })} className="rounded-lg border border-violet-200 bg-white p-2 text-xs">
                    <option value="garment">اندازه خود لباس</option><option value="body">اندازه بدن</option>
                  </select>
                  <select value={fitProfile.stretch} onChange={(e) => setFitProfile({ ...fitProfile, stretch: e.target.value as NonNullable<Product["fitProfile"]>["stretch"] })} className="rounded-lg border border-violet-200 bg-white p-2 text-xs">
                    <option value="none">بدون کشسانی</option><option value="low">کشسانی کم</option><option value="medium">کشسانی متوسط</option><option value="high">کشسانی زیاد</option>
                  </select>
                  <label className="text-[10px] font-bold">آزادی لباس (cm)<input type="number" min="0" max="30" value={fitProfile.easeCm} onChange={(e) => setFitProfile({ ...fitProfile, easeCm: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                  <label className="text-[10px] font-bold">لنگر شانه (%)<input type="number" min="0" max="100" value={fitProfile.tryOnAnchors.shoulder} onChange={(e) => setFitProfile({ ...fitProfile, tryOnAnchors: { ...fitProfile.tryOnAnchors, shoulder: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                  <label className="text-[10px] font-bold">لنگر کمر (%)<input type="number" min="0" max="100" value={fitProfile.tryOnAnchors.waist} onChange={(e) => setFitProfile({ ...fitProfile, tryOnAnchors: { ...fitProfile.tryOnAnchors, waist: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700">کد کالا (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700">دسته‌بندی *</label>
                  <select
                    value={categoryId || editingProduct?.categoryId || ""}
                    onChange={(e) => { const id = Number(e.target.value); setCategoryId(id); setCategoryName(categories.find((category) => category.id === id)?.name || ""); setAttributes([]); }}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                    required
                  >
                    <option value="">انتخاب دسته‌بندی</option>
                    {categories.filter((category) => !category.parentId).map((parent) => <optgroup key={parent.id} label={`${parent.icon || ""} ${parent.name}`}>
                      <option value={parent.id}>{parent.name}</option>
                      {categories.filter((category) => category.parentId === parent.id).map((child) => <option key={child.id} value={child.id}>↳ {child.name}</option>)}
                    </optgroup>)}
                  </select>
                </div>
              </div>

              <ProductSpecificationsEditor categoryId={categoryId || editingProduct?.categoryId || 0} value={attributes} onChange={setAttributes} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-700">قیمت پایه (تومان) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700">قیمت با تخفیف (تومان)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-violet-700 py-3 font-bold text-white shadow-md hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl bg-stone-100 px-5 py-3 font-bold text-stone-700 hover:bg-stone-200"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
