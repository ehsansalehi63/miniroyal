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
  const [saveStage, setSaveStage] = useState("");
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [duplicateProduct, setDuplicateProduct] = useState<Partial<Product> | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("پسرانه");
  const [basePrice, setBasePrice] = useState(380000);
  const [salePrice, setSalePrice] = useState(295000);
  const [productStatus, setProductStatus] = useState<Product["status"]>("active");
  const [isFeatured, setIsFeatured] = useState(true);
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [sku, setSku] = useState("KID-BOY-NEW");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<string[]>([
    "/images/products/boy-hoodie.svg",
  ]);
  const [mediaAngles, setMediaAngles] = useState<Partial<Record<ProductMediaAngle, ProductAngleMedia>>>({});
  const [sizeChart, setSizeChart] = useState<SizeChartRow[]>([]);
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

  useEffect(() => {
    const query = title.trim() || sku.trim();
    if (!showAddModal || query.length < 2) { setSimilarProducts([]); return; }
    const timer = window.setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(query)}&includeArchived=1&limit=5`, { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => setSimilarProducts(Array.isArray(data.products) ? data.products.filter((item: Product) => item.id !== editingProduct?.id) : []))
        .catch(() => setSimilarProducts([]));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [title, sku, showAddModal, editingProduct?.id]);

  const filtered = products.filter(
    (p) =>
      String(p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.categoryName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categoryKey = `${categoryName} ${categories.find((category) => category.id === (categoryId || editingProduct?.categoryId))?.slug || ""}`.toLowerCase();
  const isAccessoryCategory = /اکسسوری|کلاه|عینک|زیور|جوراب|کیف|کفش|پیشبند|دستکش|aksessori|kolah|eynak|zivar|jorab|kif|kafsh/.test(categoryKey);
  const isBottomCategory = /شلوار|دامن|شلوارک|shalvar|daman/.test(categoryKey);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiMessage("");
    setDuplicateProduct(null);
    setSaveStage("در حال آماده‌سازی اطلاعات محصول...");
    const existingSku = !editingProduct && similarProducts.find((item) => String(item.sku || "").trim().toLowerCase() === sku.trim().toLowerCase());
    if (existingSku) {
      setDuplicateProduct(existingSku);
      setApiMessage("این کد محصول قبلاً ثبت شده است؛ محصول قبلی را ویرایش کنید یا کد دیگری وارد کنید.");
      setSaveStage("");
      return;
    }
    const finalImages = images.length > 0 ? images : ["/images/products/boy-hoodie.svg"];
    const payload = {
      title, sku, categoryId: categoryId || editingProduct?.categoryId || categories[0]?.id || 0, categoryName, basePrice, salePrice,
      shortDesc: editingProduct?.shortDesc || "محصول جدید افزوده شده توسط مدیر سیستم",
      description: editingProduct?.description || "توضیحات کامل محصول در پنل مدیریت ثبت شده است.",
      gender: editingProduct?.gender || "boy", ageMinMonth: editingProduct?.ageMinMonth || 24, ageMaxMonth: editingProduct?.ageMaxMonth || 96,
      status: productStatus, isFeatured, isSpecialOffer, fitType: editingProduct?.fitType || "normal", sizeChartJson: sizeChart.filter((row) => Object.values(row).some((value) => String(value ?? "").trim())), fitProfile, images: finalImages.map((url, index) => ({ url, alt: title, sortOrder: index, isPrimary: index === 0 })),
      mediaAngles: Object.values(mediaAngles).filter(Boolean), attributes, variants: variants.filter((variant) => variant.sku.trim() || variant.size.trim() || variant.color.trim()).map((variant) => ({ sku: variant.sku, size: variant.size, color: variant.color, colorCode: variant.colorCode, stock: variant.stock, priceAdjustment: variant.priceAdjustment })),
    };
    setSaving(true);
    try {
      setSaveStage("در حال ذخیره محصول، تصاویر و مشخصات در سرور...");
      const response = await fetch(editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products", { method: editingProduct ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(60_000) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) { setApiMessage(data.error || `ذخیره محصول ناموفق بود (HTTP ${response.status}).`); setDuplicateProduct(data.duplicate || null); setSaveStage(""); return; }
      setApiMessage("محصول و مشخصات آن با موفقیت ذخیره شد.");
      setSaveStage("ذخیره انجام شد؛ در حال تازه‌سازی فهرست محصولات...");
      const refreshResponse = await fetch("/api/admin/products?limit=100", { cache: "no-store", signal: AbortSignal.timeout(30_000) });
      const refreshed = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && Array.isArray(refreshed.products)) setProducts(refreshed.products);
      setShowFormModal(false); setEditingProduct(null);
    } catch (error) { setApiMessage(error instanceof Error && error.name === "TimeoutError" ? "ذخیره بیش از ۶۰ ثانیه طول کشید. تصویرها را کوچک‌تر کنید یا دوباره تلاش کنید." : error instanceof Error ? error.message : "ارتباط با سرور هنگام ذخیره قطع شد."); setSaveStage(""); } finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setCategoryName(p.categoryName);
    setCategoryId(p.categoryId);
    setBasePrice(p.basePrice);
    setSalePrice(p.salePrice ?? p.basePrice);
    setProductStatus(p.status);
    setIsFeatured(p.isFeatured);
    setIsSpecialOffer(p.isSpecialOffer);
    setSku(p.sku);
    setVariants(p.variants?.length ? p.variants : []);
    setImages(Array.isArray(p.images) ? p.images.map((image) => typeof image === "string" ? image : String((image as { url?: unknown }).url || "")).filter(Boolean) : []);
    setMediaAngles(p.mediaAngles || {});
    setAttributes((p.attributes || []) as ProductAttributeDraft[]);
    setSizeChart(p.sizeChartJson?.length ? p.sizeChartJson : []);
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
    const refreshResponse = await fetch("/api/admin/products?limit=100", { cache: "no-store" });
    const refreshed = await refreshResponse.json().catch(() => ({}));
    if (refreshResponse.ok && Array.isArray(refreshed.products)) setProducts(refreshed.products);
    setApiMessage("محصول در دیتابیس آرشیو شد و از فهرست مدیریت حذف شد.");
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
            setProductStatus("active");
            setIsFeatured(true);
            setIsSpecialOffer(false);
            setImages(["/images/products/boy-hoodie.svg"]);
            setMediaAngles({});
            setAttributes([]);
            setCategoryId(0);
            setVariants([]);
            setSizeChart([]);
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

              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4" dir="rtl">
                <label className="block text-sm font-black text-violet-950">۱) ابتدا دسته‌بندی محصول را انتخاب کنید *</label>
                <p className="mt-1 text-[11px] leading-5 text-violet-800">بعد از انتخاب دسته‌بندی، مشخصات پیشنهادی همان کالا نمایش داده می‌شود؛ مثلاً برای اکسسوری فیلدهای دور سینه و کمر نشان داده نمی‌شود.</p>
                <select value={categoryId || editingProduct?.categoryId || ""} onChange={(e) => { const id = Number(e.target.value); setCategoryId(id); setCategoryName(categories.find((category) => category.id === id)?.name || ""); setAttributes([]); setSizeChart([]); }} className="mt-3 w-full rounded-xl border border-violet-300 bg-white p-3 text-sm outline-none focus:border-violet-600" required>
                  <option value="">انتخاب دسته‌بندی اصلی یا زیر‌دسته</option>
                  {categories.filter((category) => !category.parentId).map((parent) => <optgroup key={parent.id} label={`${parent.icon || ""} ${parent.name}`}>
                    <option value={parent.id}>{parent.name} (دسته اصلی)</option>
                    {categories.filter((category) => category.parentId === parent.id).map((child) => <option key={child.id} value={child.id}>↳ {child.name}</option>)}
                  </optgroup>)}
                </select>
                {categoryId > 0 && <p className="mt-2 text-[10px] font-bold text-violet-700">دسته انتخاب‌شده: {categoryName} — مشخصات پیشنهادی در ادامه فرم آماده می‌شود.</p>}
              </div>

              {similarProducts.length > 0 && <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4" dir="rtl"><h4 className="text-xs font-black text-orange-950">محصول مشابه پیدا شد</h4><p className="mt-1 text-[10px] text-orange-800">قبل از ثبت محصول جدید، بررسی کنید این مورد همان محصول قبلی نباشد.</p><div className="mt-2 space-y-2">{similarProducts.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-white p-2"><div><p className="text-[11px] font-black">{item.title}</p><p className="text-[10px] text-stone-500">SKU: {item.sku} — وضعیت: {item.status === "active" ? "فعال" : item.status === "draft" ? "پیش‌نویس" : item.status}</p></div><button type="button" onClick={() => handleEdit(item)} className="rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-bold text-white">ویرایش / تغییر موجودی</button></div>)}</div></div>}

              {/* آپلود Drag & Drop تصاویر */}
              <DropzoneImageUploader images={images} onChange={setImages} />
              <ProductAngleMediaManager value={mediaAngles} onChange={setMediaAngles} />

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4" dir="rtl">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h4 className="text-sm font-black text-sky-950">ترکیب محصول و موجودی انبار <span className="font-normal text-sky-700">(اختیاری)</span></h4><p className="mt-1 text-[11px] leading-5 text-sky-800">اگر محصول چند رنگ یا چند سایز دارد، برای هر ترکیب یک ردیف بسازید. اگر محصول بدون ترکیب است، این بخش را خالی بگذارید.</p></div>
                  <button type="button" onClick={() => setVariants([...variants, { id: Date.now(), productId: 0, sku: `${sku}-${variants.length + 1}`, size: "", color: "", colorCode: "#000000", stock: 0, priceAdjustment: 0 }])} className="rounded-lg bg-sky-700 px-3 py-2 text-[10px] font-bold text-white">+ افزودن ترکیب جدید</button>
                </div>
                <div className="mt-3 space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="rounded-xl border border-sky-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-black text-sky-900">ترکیب شماره {index + 1}</span><button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="text-[10px] font-bold text-rose-600">حذف این ترکیب</button></div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="text-[10px] font-bold text-stone-700">کد کالا / SKU<p className="font-normal text-stone-400">کد یکتای این ترکیب، مثل KID-01-RED-M</p><input type="text" value={variant.sku} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, sku: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none" /></label>
                        <label className="text-[10px] font-bold text-stone-700">سایز<p className="font-normal text-stone-400">مثال: ۴ سال، ۹۰، M یا XL</p><input type="text" value={variant.size} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, size: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none" /></label>
                        <label className="text-[10px] font-bold text-stone-700">نام رنگ<p className="font-normal text-stone-400">مثال: قرمز، سرمه‌ای یا سفید</p><input type="text" value={variant.color} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, color: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none" /></label>
                        <label className="text-[10px] font-bold text-stone-700">کد رنگ<p className="font-normal text-stone-400">برای نمایش رنگ در فروشگاه</p><input type="color" value={variant.colorCode || "#000000"} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, colorCode: e.target.value } : item))} className="mt-1 h-9 w-full rounded-lg border border-sky-200 bg-white p-1" /></label>
                        <label className="text-[10px] font-bold text-stone-700">موجودی قابل فروش<p className="font-normal text-stone-400">تعداد موجود از همین ترکیب؛ عدد صفر یعنی ناموجود</p><input type="number" min="0" value={variant.stock} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, stock: Number(e.target.value) } : item))} className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none" /></label>
                        <label className="text-[10px] font-bold text-stone-700">تغییر قیمت این ترکیب<p className="font-normal text-stone-400">اختلاف با قیمت پایه؛ اگر ندارد صفر بگذارید</p><input type="number" value={variant.priceAdjustment} onChange={(e) => setVariants(variants.map((item, i) => i === index ? { ...item, priceAdjustment: Number(e.target.value) } : item))} className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none" /></label>
                      </div>
                    </div>
                  ))}
                  {!variants.length && <p className="rounded-xl border border-dashed border-sky-300 p-4 text-center text-[11px] text-sky-700">هنوز ترکیبی ثبت نشده است. برای محصول تک‌حالته می‌توانید این بخش را خالی بگذارید.</p>}
                </div>
              </div>

              {!isAccessoryCategory && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" dir="rtl">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h4 className="text-sm font-black text-emerald-950">اندازه‌های واقعی لباس <span className="font-normal text-emerald-700">(اختیاری)</span></h4><p className="mt-1 text-[11px] leading-5 text-emerald-800">این جدول اندازه‌ای است که با متر از لباس یا بدن گرفته‌اید، نه شماره سایز فروشگاه. واحد همه فیلدها سانتی‌متر است و برای پیشنهاد سایز و پرو استفاده می‌شود.</p></div>
                  <button type="button" onClick={() => setSizeChart([...sizeChart, { size: "", ageRange: "", heightCm: "", chestCm: "", lengthCm: "" }])} className="rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white">+ افزودن ردیف اندازه</button>
                </div>
                <div className="mt-3 space-y-3">
                  {sizeChart.map((row, index) => (
                    <div key={index} className="rounded-xl border border-emerald-200 bg-white p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-black text-emerald-900">ردیف اندازه {index + 1}</span><button type="button" onClick={() => setSizeChart(sizeChart.filter((_, i) => i !== index))} className="text-[10px] font-bold text-rose-600">حذف این ردیف</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="text-[10px] font-bold text-stone-700">نام سایز<p className="font-normal text-stone-400">مثال: ۴ سال یا M</p><input value={row.size ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, size: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                      <label className="text-[10px] font-bold text-stone-700">بازه سنی<p className="font-normal text-stone-400">مثال: ۳ تا ۴ سال</p><input value={row.ageRange ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, ageRange: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                      <label className="text-[10px] font-bold text-stone-700">قد کودک (cm)<p className="font-normal text-stone-400">قد کودک، مثال: ۹۸ تا ۱۰۴</p><input value={row.heightCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, heightCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                      {!isBottomCategory && <label className="text-[10px] font-bold text-stone-700">دور سینه کودک (cm)<p className="font-normal text-stone-400">محیط سینه، نه عرض یک‌طرف لباس</p><input value={row.chestCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, chestCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>}
                      <label className="text-[10px] font-bold text-stone-700">دور کمر (cm)<p className="font-normal text-stone-400">محیط کامل کمر</p><input value={row.waistCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, waistCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                      <label className="text-[10px] font-bold text-stone-700">دور باسن (cm)<p className="font-normal text-stone-400">محیط کامل باسن</p><input value={row.hipCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, hipCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                      {!isBottomCategory && <label className="text-[10px] font-bold text-stone-700">عرض شانه (cm)<p className="font-normal text-stone-400">فاصله دو سر شانه</p><input value={row.shoulderCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, shoulderCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>}
                      <label className="text-[10px] font-bold text-stone-700">قد لباس (cm)<p className="font-normal text-stone-400">از سرشانه تا پایین لباس</p><input value={row.garmentLengthCm ?? row.lengthCm ?? ""} onChange={(e) => setSizeChart(sizeChart.map((item, i) => i === index ? { ...item, garmentLengthCm: e.target.value, lengthCm: e.target.value } : item))} className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none" /></label>
                    </div></div>
                  ))}
                  {!sizeChart.length && <p className="rounded-xl border border-dashed border-emerald-300 p-4 text-center text-[11px] text-emerald-700">هنوز جدول اندازه‌ای ثبت نشده است. برای ثبت ساده محصول می‌توانید این بخش را خالی بگذارید.</p>}
                </div>
              </div>}

              {!isAccessoryCategory && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4" dir="rtl">
                <h4 className="text-sm font-black text-violet-950">پروفایل فیت و پرو محصول <span className="font-normal text-violet-700">(اختیاری)</span></h4>
                <p className="mt-1 text-[11px] leading-5 text-violet-800">این تنظیمات به سیستم می‌گوید لباس چه نوعی است، اندازه‌گیری از کجا انجام شده و لباس چقدر آزاد یا کشسان است. اگر فقط می‌خواهید محصول را ثبت کنید، می‌توانید مقادیر پیش‌فرض را دست‌نخورده بگذارید.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-[10px] font-bold text-stone-700">نوع لباس<p className="font-normal text-stone-500">برای انتخاب الگوی مناسب پرو</p><select value={fitProfile.garmentType} onChange={(e) => setFitProfile({ ...fitProfile, garmentType: e.target.value as NonNullable<Product["fitProfile"]>["garmentType"] })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs"><option value="top">بالاپوش؛ تی‌شرت، هودی و بلوز</option><option value="bottom">پایین‌پوش؛ شلوار و دامن</option><option value="dress">پیراهن</option><option value="outerwear">لباس رویی؛ کاپشن و پالتو</option><option value="set">ست چندتکه</option><option value="baby">لباس نوزادی</option></select></label>
                  <label className="text-[10px] font-bold text-stone-700">مبنای اندازه‌گیری<p className="font-normal text-stone-500">اعداد جدول اندازه مربوط به چیست؟</p><select value={fitProfile.measurementMethod} onChange={(e) => setFitProfile({ ...fitProfile, measurementMethod: e.target.value as NonNullable<Product["fitProfile"]>["measurementMethod"] })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs"><option value="garment">اندازه خود لباس؛ متر روی لباس</option><option value="body">اندازه بدن کودک</option></select></label>
                  <label className="text-[10px] font-bold text-stone-700">میزان کشسانی پارچه<p className="font-normal text-stone-500">پارچه چقدر کش می‌آید؟</p><select value={fitProfile.stretch} onChange={(e) => setFitProfile({ ...fitProfile, stretch: e.target.value as NonNullable<Product["fitProfile"]>["stretch"] })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs"><option value="none">بدون کشسانی</option><option value="low">کم؛ کمی کش می‌آید</option><option value="medium">متوسط؛ قابل‌کشش</option><option value="high">زیاد؛ کشسان</option></select></label>
                  <label className="text-[10px] font-bold text-stone-700">آزادی لباس (cm)<p className="font-normal text-stone-500">چند سانتی‌متر از بدن آزادتر باشد؟</p><input type="number" min="0" max="30" value={fitProfile.easeCm} onChange={(e) => setFitProfile({ ...fitProfile, easeCm: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                  <label className="text-[10px] font-bold text-stone-700">لنگر شانه (%)<p className="font-normal text-stone-500">جای شانه در تصویر پرو؛ معمولاً ۵۰</p><input type="number" min="0" max="100" value={fitProfile.tryOnAnchors.shoulder} onChange={(e) => setFitProfile({ ...fitProfile, tryOnAnchors: { ...fitProfile.tryOnAnchors, shoulder: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                  <label className="text-[10px] font-bold text-stone-700">لنگر کمر (%)<p className="font-normal text-stone-500">جای کمر در تصویر پرو؛ معمولاً ۵۲</p><input type="number" min="0" max="100" value={fitProfile.tryOnAnchors.waist} onChange={(e) => setFitProfile({ ...fitProfile, tryOnAnchors: { ...fitProfile.tryOnAnchors, waist: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border border-violet-200 bg-white p-2 text-xs" /></label>
                </div>
              </div>}

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

              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4" dir="rtl">
                <h4 className="text-sm font-black text-amber-950">نمایش و جایگاه محصول در سایت</h4>
                <p className="mt-1 text-[11px] leading-5 text-amber-800">محصول فعال بلافاصله در فروشگاه و صفحه اختصاصی خودش قابل مشاهده است. گزینه‌های زیر تعیین می‌کنند محصول در کدام بخش‌های صفحه اصلی هم نمایش داده شود.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-[10px] font-bold text-stone-700">وضعیت انتشار<p className="font-normal text-stone-500">برای نمایش در سایت باید «فعال» باشد.</p><select value={productStatus} onChange={(e) => setProductStatus(e.target.value as Product["status"])} className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs"><option value="active">فعال و قابل نمایش در سایت</option><option value="draft">پیش‌نویس؛ فقط مدیر می‌بیند</option><option value="review">در انتظار بررسی</option><option value="archived">بایگانی‌شده</option></select></label>
                  <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-white p-3 text-[11px] font-bold"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="mt-1 size-4 accent-violet-700" /><span>نمایش در صفحه اصلی<p className="mt-1 font-normal text-stone-500">در بخش «جدیدترین محصولات» صفحه اصلی نمایش داده شود.</p></span></label>
                  <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-white p-3 text-[11px] font-bold"><input type="checkbox" checked={isSpecialOffer} onChange={(e) => setIsSpecialOffer(e.target.checked)} className="mt-1 size-4 accent-violet-700" /><span>حراج / پیشنهاد ویژه<p className="mt-1 font-normal text-stone-500">برای بخش تخفیف و پیشنهادهای ویژه علامت‌گذاری شود.</p></span></label>
                </div>
              </div>

              <ProductSpecificationsEditor categoryId={categoryId || editingProduct?.categoryId || 0} categoryName={categoryName} categorySlug={categories.find((category) => category.id === (categoryId || editingProduct?.categoryId))?.slug} value={attributes} onChange={setAttributes} />

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

              {duplicateProduct && <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3" dir="rtl"><p className="text-xs font-black text-rose-900">این کد محصول قبلاً ثبت شده است.</p><p className="mt-1 text-[10px] text-rose-800">{duplicateProduct.title} — SKU: {duplicateProduct.sku}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { const match = products.find((item) => item.id === duplicateProduct.id); if (match) handleEdit(match); }} className="rounded-lg bg-rose-700 px-3 py-2 text-[10px] font-bold text-white">ویرایش همین محصول</button><button type="button" onClick={() => setDuplicateProduct(null)} className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-rose-700">ثبت با کد دیگر</button></div></div>}
              {saveStage && <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] font-bold text-sky-800">{saveStage}</p>}
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
                  disabled={saving}
                  className="rounded-xl bg-stone-100 px-5 py-3 font-bold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
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
