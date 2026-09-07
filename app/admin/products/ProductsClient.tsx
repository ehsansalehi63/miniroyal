"use client";

import { useEffect, useState } from "react";
import { Category, Product, SizeChartRow, Variant } from "../../lib/types/catalog";
import { formatToman, toPersianDigits, calculateDiscountPercent } from "../../lib/utils";
import DropzoneImageUploader from "../../components/DropzoneImageUploader";
import ProductAngleMediaManager from "../../components/ProductAngleMediaManager";
import ProductSpecificationsEditor, { ProductAttributeDraft } from "../../components/ProductSpecificationsEditor";
import ProductLivePreviewCard from "../../components/ProductLivePreviewCard";
import type { ProductMediaAngle, ProductAngleMedia } from "../../lib/types/catalog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Zap,
  SlidersHorizontal,
  Check,
  X,
  Eye,
  Sparkles,
  Tag,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "low_stock" | "sale" | "featured" | "draft">("all");
  const [showAddModal, setShowFormModal] = useState(false);
  const [entryMode, setEntryMode] = useState<"quick" | "advanced">("quick");
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
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("پسرانه");
  const [basePrice, setBasePrice] = useState(380000);
  const [salePrice, setSalePrice] = useState(295000);
  const [quickStock, setQuickStock] = useState(10);
  const [productStatus, setProductStatus] = useState<Product["status"]>("active");
  const [isFeatured, setIsFeatured] = useState(true);
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [sku, setSku] = useState("ROYAL-1001");
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

  // Inline Quick Edit state
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [quickEditBasePrice, setQuickEditBasePrice] = useState(0);
  const [quickEditSalePrice, setQuickEditSalePrice] = useState(0);
  const [quickEditStatus, setQuickEditStatus] = useState<Product["status"]>("active");
  const [quickEditVariants, setQuickEditVariants] = useState<Variant[]>([]);
  const [quickEditSimpleStock, setQuickEditSimpleStock] = useState(0);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditMsg, setQuickEditMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/products?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "دریافت محصولات از دیتابیس انجام نشد.");
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(
            data.products.map((product: Product & { short_desc?: string; category_name?: string; size_chart_json?: SizeChartRow[] }) => ({
              ...product,
              title: String(product.title || "محصول بدون عنوان"),
              sku: String(product.sku || "بدون SKU"),
              shortDesc: product.shortDesc || product.short_desc || "",
              categoryName: String(product.categoryName || product.category_name || "بدون دسته‌بندی"),
              images: Array.isArray(product.images)
                ? (product.images as Array<string | { url: string }>).map((image) => (typeof image === "string" ? image : image.url)).filter(Boolean)
                : [],
              variants: Array.isArray(product.variants) ? product.variants : [],
              sizeChartJson: product.sizeChartJson || product.size_chart_json || [],
            }))
          );
        }
      })
      .catch((error: unknown) => setApiMessage(error instanceof Error ? error.message : "دریافت محصولات انجام نشد."))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "دریافت دسته‌بندی‌ها انجام نشد.");
        setCategories(data.categories || []);
      })
      .catch((error: unknown) => setApiMessage(error instanceof Error ? error.message : "دریافت دسته‌بندی‌ها انجام نشد."));
  }, []);

  useEffect(() => {
    const query = title.trim() || sku.trim();
    if (!showAddModal || query.length < 2) {
      setSimilarProducts([]);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(query)}&includeArchived=1&limit=5`, { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => setSimilarProducts(Array.isArray(data.products) ? data.products.filter((item: Product) => item.id !== editingProduct?.id) : []))
        .catch(() => setSimilarProducts([]));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [title, sku, showAddModal, editingProduct?.id]);

  const categoryKey = `${categoryName} ${categories.find((category) => category.id === (categoryId || editingProduct?.categoryId))?.slug || ""}`.toLowerCase();
  const isAccessoryCategory = /اکسسوری|کلاه|عینک|زیور|جوراب|کیف|کفش|پیشبند|دستکش|aksessori|kolah|eynak|zivar|jorab|kif|kafsh/.test(categoryKey);
  const isBottomCategory = /شلوار|دامن|شلوارک|shalvar|daman/.test(categoryKey);

  // Counts for quick filter tabs
  const allCount = products.length;
  const lowStockCount = products.filter(
    (p) => !p.variants?.length || p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) <= 3
  ).length;
  const saleCount = products.filter((p) => p.salePrice && p.salePrice < p.basePrice).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const draftCount = products.filter((p) => p.status === "draft").length;

  const filtered = products.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      String(p.title || "").toLowerCase().includes(query) ||
      String(p.sku || "").toLowerCase().includes(query) ||
      String(p.categoryName || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === "low_stock") {
      const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      return totalStock <= 3;
    }
    if (activeFilter === "sale") {
      return p.salePrice && p.salePrice < p.basePrice;
    }
    if (activeFilter === "featured") {
      return p.isFeatured;
    }
    if (activeFilter === "draft") {
      return p.status === "draft";
    }
    return true;
  });

  const autoGenerateSku = () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    setSku(`ROYAL-${code}`);
  };

  const addPresetSizes = () => {
    const presets = ["۲ سال", "۳ سال", "۴ سال", "۵ سال"];
    const baseCode = sku.trim() || "ROYAL";
    const newVariants = presets.map((s, idx) => ({
      id: Date.now() + idx,
      productId: editingProduct?.id || 0,
      sku: `${baseCode}-${idx + 1}`,
      size: s,
      color: "تک‌رنگ",
      colorCode: "#000000",
      stock: 5,
      priceAdjustment: 0,
    }));
    setVariants(newVariants);
  };

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

    // In Quick Add mode: if no variants configured yet, build a standard one from quickStock
    let finalVariants = variants.filter((variant) => variant.sku?.trim() || variant.size?.trim() || variant.color?.trim());
    if (!finalVariants.length && quickStock > 0) {
      finalVariants = [
        {
          id: Date.now(),
          productId: editingProduct?.id || 0,
          sku: `${sku.trim() || "ROYAL"}-STD`,
          size: "تک‌سایز",
          color: "پیش‌فرض",
          colorCode: "#000000",
          stock: quickStock,
          priceAdjustment: 0,
        },
      ];
    }

    const payload = {
      title: title.trim(),
      sku: sku.trim() || `ROYAL-${Date.now().toString().slice(-5)}`,
      categoryId: categoryId || editingProduct?.categoryId || categories[0]?.id || 1,
      categoryName,
      basePrice,
      salePrice: salePrice && salePrice > 0 ? salePrice : null,
      shortDesc: editingProduct?.shortDesc || "محصول جدید فروشگاه مینی رویال",
      description: editingProduct?.description || "توضیحات کامل محصول در پنل مدیریت ثبت شده است.",
      gender: editingProduct?.gender || "unisex",
      ageMinMonth: editingProduct?.ageMinMonth || 12,
      ageMaxMonth: editingProduct?.ageMaxMonth || 96,
      status: productStatus,
      isFeatured,
      isSpecialOffer,
      fitType: editingProduct?.fitType || "normal",
      sizeChartJson: sizeChart.filter((row) => Object.values(row).some((value) => String(value ?? "").trim())),
      fitProfile,
      images: finalImages.map((url, index) => ({ url, alt: title, sortOrder: index, isPrimary: index === 0 })),
      mediaAngles: Object.values(mediaAngles).filter(Boolean),
      attributes,
      variants: finalVariants.map((variant) => ({
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode,
        stock: variant.stock,
        priceAdjustment: variant.priceAdjustment,
      })),
    };

    setSaving(true);
    try {
      setSaveStage("در حال ذخیره محصول، تصاویر و مشخصات در سرور...");
      const response = await fetch(editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setApiMessage(data.error || `ذخیره محصول ناموفق بود (HTTP ${response.status}).`);
        setDuplicateProduct(data.duplicate || null);
        setSaveStage("");
        return;
      }
      setApiMessage("محصول با موفقیت ذخیره شد.");
      setSaveStage("ذخیره انجام شد؛ در حال تازه‌سازی فهرست...");
      const refreshResponse = await fetch("/api/admin/products?limit=100", { cache: "no-store", signal: AbortSignal.timeout(30_000) });
      const refreshed = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && Array.isArray(refreshed.products)) setProducts(refreshed.products);
      setShowFormModal(false);
      setEditingProduct(null);
    } catch (error) {
      setApiMessage(
        error instanceof Error && error.name === "TimeoutError"
          ? "ذخیره بیش از ۶۰ ثانیه طول کشید. تصویرها را کوچک‌تر کنید یا دوباره تلاش کنید."
          : error instanceof Error
          ? error.message
          : "ارتباط با سرور هنگام ذخیره قطع شد."
      );
      setSaveStage("");
    } finally {
      setSaving(false);
    }
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
    const totalCurrentStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    setQuickStock(totalCurrentStock || 5);
    setImages(
      Array.isArray(p.images)
        ? p.images.map((image) => (typeof image === "string" ? image : String((image as { url?: unknown }).url || ""))).filter(Boolean)
        : []
    );
    setMediaAngles(p.mediaAngles || {});
    setAttributes((p.attributes || []) as ProductAttributeDraft[]);
    setSizeChart(p.sizeChartJson?.length ? p.sizeChartJson : []);
    setFitProfile(p.fitProfile ?? fitProfile);
    setEntryMode("advanced"); // Editing existing product defaults to advanced
    setShowFormModal(true);
  };

  const handleClone = async (id: number) => {
    if (!confirm("از این محصول یک پیش‌نویس کپی ساخته شود؟")) return;
    const response = await fetch(`/api/admin/products/${id}/clone`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setApiMessage(data.error || "کپی محصول انجام نشد.");
      return;
    }
    setApiMessage("کپی پیش‌نویس محصول ساخته شد.");
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setApiMessage(data.error || "حذف محصول انجام نشد.");
      return;
    }
    const refreshResponse = await fetch("/api/admin/products?limit=100", { cache: "no-store" });
    const refreshed = await refreshResponse.json().catch(() => ({}));
    if (refreshResponse.ok && Array.isArray(refreshed.products)) setProducts(refreshed.products);
    setApiMessage("محصول در دیتابیس آرشیو شد و از فهرست مدیریت حذف شد.");
  };

  // Inline Quick Edit Handlers
  const handleOpenQuickEdit = (p: Product) => {
    if (quickEditId === p.id) {
      setQuickEditId(null);
      return;
    }
    setQuickEditId(p.id);
    setQuickEditBasePrice(p.basePrice);
    setQuickEditSalePrice(p.salePrice ?? p.basePrice);
    setQuickEditStatus(p.status);
    const variantsCopy = p.variants?.length ? JSON.parse(JSON.stringify(p.variants)) : [];
    setQuickEditVariants(variantsCopy);
    const totalCurrentStock = variantsCopy.reduce((sum: number, v: Variant) => sum + (v.stock || 0), 0);
    setQuickEditSimpleStock(totalCurrentStock);
    setQuickEditMsg("");
  };

  const handleSaveQuickEdit = async (p: Product) => {
    setQuickEditSaving(true);
    setQuickEditMsg("");
    try {
      let updatedVariants = quickEditVariants;
      if (!updatedVariants.length && quickEditSimpleStock >= 0) {
        updatedVariants = [
          {
            id: Date.now(),
            productId: p.id,
            sku: `${p.sku}-STD`,
            size: "تک‌سایز",
            color: "پیش‌فرض",
            colorCode: "#000000",
            stock: quickEditSimpleStock,
            priceAdjustment: 0,
          },
        ];
      }

      const response = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePrice: quickEditBasePrice,
          salePrice: quickEditSalePrice && quickEditSalePrice > 0 ? quickEditSalePrice : null,
          status: quickEditStatus,
          variants: updatedVariants,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setQuickEditMsg(data.error || "ذخیره سریع ناموفق بود.");
        return;
      }

      // Update local state smoothly
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? {
                ...item,
                basePrice: quickEditBasePrice,
                salePrice: quickEditSalePrice && quickEditSalePrice > 0 ? quickEditSalePrice : undefined,
                status: quickEditStatus,
                variants: updatedVariants,
              }
            : item
        )
      );

      setQuickEditMsg("✅ تغییرات با موفقیت ذخیره شد.");
      setTimeout(() => {
        setQuickEditId(null);
        setQuickEditMsg("");
      }, 1000);
    } catch (error) {
      setQuickEditMsg(error instanceof Error ? error.message : "خطا در ذخیره سریع.");
    } finally {
      setQuickEditSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">مدیریت کاتالوگ و محصولات 👕</h1>
          <p className="mt-1 text-xs text-stone-500">
            ثبت سریع کالا در ۳۰ ثانیه، ویرایش آنی قیمت/انبار درون جدول، فشرده‌سازی WebP و پیش‌نمایش زنده
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
            setCategoryId(categories[0]?.id || 1);
            setCategoryName(categories[0]?.name || "پسرانه");
            setVariants([]);
            setQuickStock(10);
            setSizeChart([]);
            setBasePrice(350000);
            setSalePrice(290000);
            autoGenerateSku();
            setFitProfile({ garmentType: "top", measurementMethod: "garment", preferredBodyMeasurement: "height", easeCm: 7, stretch: "low", sizeSystem: "age", tryOnAnchors: { shoulder: 50, waist: 52, length: 68 } });
            setEntryMode("quick"); // New product starts in Quick Mode
            setShowFormModal(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md hover:bg-amber-400 transition active:scale-95"
        >
          <Zap className="size-4" />
          <span>+ ثبت سریع محصول جدید (۳۰ ثانیه)</span>
        </button>
      </div>

      {apiMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3 text-xs shadow-sm">
          <span className="font-bold text-stone-800">{apiMessage}</span>
          <button onClick={() => setApiMessage("")} className="text-stone-400 hover:text-stone-600">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* نوار جستجو و فیلترهای سریع */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
          <Search className="size-4 text-stone-400" />
          <input
            type="text"
            placeholder="جستجوی نام محصول، کد SKU یا دسته‌بندی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-stone-400 hover:text-stone-600 text-xs">
              پاک‌کردن
            </button>
          )}
        </div>

        {/* زبانه فیلترهای سریع (Quick Filters) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition ${
              activeFilter === "all" ? "bg-stone-950 text-white shadow-sm" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>همه محصولات</span>
            <span className="rounded-md bg-stone-800/20 px-1.5 py-0.5 text-[10px]">{toPersianDigits(allCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("low_stock")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition ${
              activeFilter === "low_stock" ? "bg-rose-600 text-white shadow-sm" : "bg-white border border-stone-200 text-rose-700 hover:bg-rose-50"
            }`}
          >
            <AlertTriangle className="size-3.5" />
            <span>کم‌موجود / ناموجود</span>
            <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-black">{toPersianDigits(lowStockCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("sale")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition ${
              activeFilter === "sale" ? "bg-amber-600 text-white shadow-sm" : "bg-white border border-stone-200 text-amber-800 hover:bg-amber-50"
            }`}
          >
            <Tag className="size-3.5" />
            <span>دارای تخفیف</span>
            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px]">{toPersianDigits(saleCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("featured")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition ${
              activeFilter === "featured" ? "bg-sky-600 text-white shadow-sm" : "bg-white border border-stone-200 text-sky-700 hover:bg-sky-50"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>ویژه صفحه اصلی</span>
            <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px]">{toPersianDigits(featuredCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("draft")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition ${
              activeFilter === "draft" ? "bg-stone-700 text-white shadow-sm" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>پیش‌نویس‌ها</span>
            <span className="rounded-md bg-stone-400/20 px-1.5 py-0.5 text-[10px]">{toPersianDigits(draftCount)}</span>
          </button>
        </div>
      </div>

      {/* جدول محصولات با قابلیت ویرایش سریع درجا */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">تصویر</th>
                <th className="p-3.5 font-bold">عنوان محصول و کد کالا</th>
                <th className="p-3.5 font-bold">دسته</th>
                <th className="p-3.5 font-bold">موجودی انبار</th>
                <th className="p-3.5 font-bold">قیمت پایه</th>
                <th className="p-3.5 font-bold">قیمت با تخفیف</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                const isQuickEditing = quickEditId === p.id;
                const discount = calculateDiscountPercent(p.basePrice, p.salePrice ?? p.basePrice);

                return (
                  <div key={p.id} className="contents">
                    <tr className={`transition ${isQuickEditing ? "bg-amber-50/50" : "hover:bg-stone-50"}`}>
                      <td className="p-3">
                        <img
                          src={p.images[0] || "/images/products/boy-hoodie.svg"}
                          alt={p.title}
                          className="size-12 rounded-xl object-cover border border-stone-200"
                        />
                      </td>
                      <td className="p-3 font-bold max-w-xs">
                        <div className="line-clamp-1">{p.title}</div>
                        <span className="font-mono text-[10px] text-stone-400">{p.sku}</span>
                      </td>
                      <td className="p-3">
                        <span className="rounded-lg bg-amber-50 px-2 py-1 font-bold text-amber-800">
                          {p.categoryName}
                        </span>
                      </td>
                      <td className="p-3">
                        {totalStock <= 0 ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
                            ناموجود
                          </span>
                        ) : totalStock <= 3 ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800">
                            ⚠️ فقط {toPersianDigits(totalStock)} عدد
                          </span>
                        ) : (
                          <span className="font-bold text-stone-700">
                            {toPersianDigits(totalStock)} عدد
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-stone-600">{formatToman(p.basePrice)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-emerald-700">
                            {formatToman(p.salePrice ?? p.basePrice)}
                          </span>
                          {discount > 0 && (
                            <span className="rounded bg-rose-600 px-1 text-[9px] font-black text-white">
                              {toPersianDigits(discount)}٪
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {p.status === "active" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            فعال در سایت
                          </span>
                        ) : p.status === "draft" ? (
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-600">
                            پیش‌نویس
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* دکمه ویرایش سریع قیمت و موجودی */}
                          <button
                            onClick={() => handleOpenQuickEdit(p)}
                            className={`rounded-lg p-1.5 transition ${
                              isQuickEditing
                                ? "bg-amber-500 text-stone-950 font-black shadow-sm"
                                : "text-amber-700 bg-amber-50 hover:bg-amber-100"
                            }`}
                            title="ویرایش سریع قیمت و موجودی"
                          >
                            <Zap className="size-4" />
                          </button>

                          {/* دکمه ویرایش کامل */}
                          <button
                            onClick={() => handleEdit(p)}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-amber-800 transition"
                            title="ویرایش کامل کالا"
                          >
                            <Edit className="size-4" />
                          </button>

                          {/* کپی */}
                          <button
                            onClick={() => void handleClone(p.id)}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-sky-50 hover:text-sky-700 transition"
                            title="ساخت کپی"
                          >
                            <Copy className="size-4" />
                          </button>

                          {/* حذف */}
                          <button
                            onClick={() => void handleDelete(p.id)}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="حذف / آرشیو"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* کادر ویرایش سریع درون جدول (Inline Quick Editor) */}
                    {isQuickEditing && (
                      <tr className="bg-amber-50/70 border-y-2 border-amber-300">
                        <td colSpan={8} className="p-4">
                          <div className="rounded-2xl bg-white p-4 shadow-sm border border-amber-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                              <div className="flex items-center gap-2">
                                <Zap className="size-4 text-amber-600" />
                                <span className="text-xs font-black text-stone-900">
                                  ویرایش سریع قیمت و موجودی: {p.title}
                                </span>
                              </div>
                              <button onClick={() => setQuickEditId(null)} className="text-stone-400 hover:text-stone-600">
                                <X className="size-4" />
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700">قیمت پایه (تومان)</label>
                                <input
                                  type="number"
                                  value={quickEditBasePrice}
                                  onChange={(e) => setQuickEditBasePrice(Number(e.target.value))}
                                  className="mt-1 w-full rounded-xl border border-stone-200 p-2 text-xs font-bold outline-none focus:border-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-stone-700">قیمت فروش با تخفیف (تومان)</label>
                                <input
                                  type="number"
                                  value={quickEditSalePrice}
                                  onChange={(e) => setQuickEditSalePrice(Number(e.target.value))}
                                  className="mt-1 w-full rounded-xl border border-stone-200 p-2 text-xs font-bold text-emerald-700 outline-none focus:border-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-stone-700">وضعیت انتشار</label>
                                <select
                                  value={quickEditStatus}
                                  onChange={(e) => setQuickEditStatus(e.target.value as Product["status"])}
                                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2 text-xs font-bold outline-none focus:border-amber-500"
                                >
                                  <option value="active">فعال و قابل خرید در سایت</option>
                                  <option value="draft">پیش‌نویس (مخفی)</option>
                                  <option value="archived">بایگانی‌شده</option>
                                </select>
                              </div>

                              <div>
                                {quickEditVariants.length === 0 ? (
                                  <div>
                                    <label className="block text-[11px] font-bold text-stone-700">موجودی ساده انبار (عدد)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={quickEditSimpleStock}
                                      onChange={(e) => setQuickEditSimpleStock(Number(e.target.value))}
                                      className="mt-1 w-full rounded-xl border border-stone-200 p-2 text-xs font-bold outline-none focus:border-amber-500"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[11px] font-bold text-stone-700">مجموع تنوع‌ها</label>
                                    <span className="mt-1 block rounded-xl bg-stone-50 p-2 text-xs font-bold text-stone-600">
                                      {toPersianDigits(quickEditVariants.length)} سایز/رنگ مجزا
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* اگر ترکیب‌های سایز دارد، فیلد موجودی هر کدام */}
                            {quickEditVariants.length > 0 && (
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                <span className="block text-[11px] font-black text-stone-800 mb-2">
                                  موجودی هر سایز و رنگ:
                                </span>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  {quickEditVariants.map((v, vIndex) => (
                                    <div key={v.id || vIndex} className="flex items-center justify-between rounded-lg bg-white p-2 border border-stone-200">
                                      <span className="text-[10px] font-bold text-stone-700">
                                        {v.size || "تک‌سایز"} - {v.color || "تک‌رنگ"}
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={v.stock}
                                        onChange={(e) => {
                                          const next = [...quickEditVariants];
                                          next[vIndex] = { ...v, stock: Number(e.target.value) };
                                          setQuickEditVariants(next);
                                        }}
                                        className="w-16 rounded-md border border-stone-300 p-1 text-center text-xs font-bold outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {quickEditMsg && (
                              <div className="text-xs font-bold text-emerald-700">
                                {quickEditMsg}
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={quickEditSaving}
                                onClick={() => void handleSaveQuickEdit(p)}
                                className="flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2 text-xs font-black text-white hover:bg-stone-800 transition disabled:opacity-50"
                              >
                                {quickEditSaving ? "در حال ذخیره..." : "ذخیره آنی"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickEditId(null)}
                                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                              >
                                بستن
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال افزودن / ویرایش با ۲ حالت (ثبت سریع و پیشرفته) + پیش‌نمایش زنده */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-y-auto max-h-[92vh] rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            {/* هدر مدال و سوئیچ حالت ثبت سریع / پیشرفته */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  {editingProduct ? "ویرایش محصول و کاتالوگ" : "افزودن محصول جدید به فروشگاه"}
                </h3>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {entryMode === "quick"
                    ? "⚡ حالت ثبت سریع: فقط فیلدهای کلیدی جهت انتشار در ۳۰ ثانیه"
                    : "🛠️ حالت پیشرفته: دسترسی به تمام جداول سایز سانتیمتری، زوایای پرو و صفات اختصاصی"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl bg-stone-100 p-1">
                  <button
                    type="button"
                    onClick={() => setEntryMode("quick")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      entryMode === "quick" ? "bg-amber-500 text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Zap className="size-3.5" />
                    <span>ثبت سریع (۳۰ ثانیه)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode("advanced")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      entryMode === "advanced" ? "bg-stone-950 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span>مشخصات کامل و AI</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* گرید فرم اصلی و کارت پیش‌نمایش زنده */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* فرم اصلی */}
              <div className="lg:col-span-8 space-y-4">
                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  {/* عنوان محصول */}
                  <div>
                    <label className="block font-bold text-stone-700">عنوان محصول *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: هودی پاییزه پنبه‌ای طرح مینیون"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* دسته‌بندی */}
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4">
                    <label className="block text-sm font-black text-amber-950">۱) انتخاب دسته‌بندی محصول *</label>
                    <p className="mt-1 text-[11px] leading-5 text-amber-900">
                      دسته‌بندی اصلی یا زیر‌دسته مرتبط را انتخاب کنید.
                    </p>
                    <select
                      value={categoryId || editingProduct?.categoryId || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setCategoryId(id);
                        setCategoryName(categories.find((category) => category.id === id)?.name || "");
                        setAttributes([]);
                        setSizeChart([]);
                      }}
                      className="mt-3 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm outline-none focus:border-amber-600 font-bold"
                      required
                    >
                      <option value="">انتخاب دسته‌بندی اصلی یا زیر‌دسته</option>
                      {categories
                        .filter((category) => !category.parentId)
                        .map((parent) => (
                          <optgroup key={parent.id} label={`${parent.icon || ""} ${parent.name}`}>
                            <option value={parent.id}>{parent.name} (دسته اصلی)</option>
                            {categories
                              .filter((category) => category.parentId === parent.id)
                              .map((child) => (
                                <option key={child.id} value={child.id}>
                                  ↳ {child.name}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>

                  {/* بررسی محصول مشابه */}
                  {similarProducts.length > 0 && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                      <h4 className="text-xs font-black text-orange-950">محصول مشابه پیدا شد</h4>
                      <p className="mt-1 text-[10px] text-orange-800">
                        قبل از ثبت محصول جدید، بررسی کنید این مورد همان محصول قبلی نباشد.
                      </p>
                      <div className="mt-2 space-y-2">
                        {similarProducts.map((item) => (
                          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-white p-2">
                            <div>
                              <p className="text-[11px] font-black">{item.title}</p>
                              <p className="text-[10px] text-stone-500">
                                SKU: {item.sku} — وضعیت: {item.status === "active" ? "فعال" : item.status}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-bold text-white"
                            >
                              ویرایش همین محصول
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* آپلود هوشمند تصاویر با فشرده‌سازی WebP */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      تصاویر محصول (فشرده‌سازی خودکار WebP فعال است) *
                    </label>
                    <DropzoneImageUploader images={images} onChange={setImages} />
                  </div>

                  {/* قیمت و تخفیف */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-bold text-stone-700">قیمت اصلی (تومان) *</label>
                      <input
                        type="number"
                        required
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700">قیمت با تخفیف (تومان)</label>
                      <input
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500 font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  {/* کد کالا SKU با دکمه تولید خودکار */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-stone-700">کد کالا (SKU) *</label>
                      <button
                        type="button"
                        onClick={autoGenerateSku}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800"
                      >
                        <Sparkles className="size-3" />
                        <span>تولید خودکار کد SKU</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* بخش موجودی و سایز در حالت ثبت سریع */}
                  {entryMode === "quick" && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-amber-950">موجودی و سایزبندی کالا</h4>
                          <p className="text-[10px] text-amber-800">
                            می‌توانید یک موجودی کلی وارد کنید یا با ۱ کلیک سایزهای استاندارد را بسازید.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addPresetSizes}
                          className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-700"
                        >
                          <Plus className="size-3" />
                          <span>سایزهای آماده (۲ تا ۵ سال)</span>
                        </button>
                      </div>

                      {variants.length === 0 ? (
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700">
                            تعداد موجودی کلی انبار (عدد)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={quickStock}
                            onChange={(e) => setQuickStock(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs font-bold outline-none focus:border-amber-500"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-700">
                              تنوع‌های ثبت‌شده ({variants.length} مورد):
                            </span>
                            <button
                              type="button"
                              onClick={() => setVariants([])}
                              className="text-[10px] text-rose-600 font-bold"
                            >
                              تبدیل به محصول تک‌سایز
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {variants.map((v, i) => (
                              <div key={v.id || i} className="flex items-center justify-between rounded-xl bg-white p-2 border border-stone-200">
                                <span className="text-xs font-bold text-stone-800">{v.size} ({v.color})</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-stone-500">موجودی:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.stock}
                                    onChange={(e) => {
                                      const next = [...variants];
                                      next[i] = { ...v, stock: Number(e.target.value) };
                                      setVariants(next);
                                    }}
                                    className="w-14 rounded-lg border border-stone-300 p-1 text-center text-xs font-bold"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* اگر در حالت پیشرفته هستیم، امکانات تخصصی نمایش داده می‌شود */}
                  {entryMode === "advanced" && (
                    <div className="space-y-4">
                      {/* زوایای عکس هوش مصنوعی */}
                      <ProductAngleMediaManager value={mediaAngles} onChange={setMediaAngles} />

                      {/* ماتریکس کامل تنوع و انبار */}
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-black text-sky-950">ترکیب محصول و موجودی انبار</h4>
                            <p className="mt-1 text-[11px] leading-5 text-sky-800">
                              اگر محصول چند رنگ یا چند سایز دارد، برای هر ترکیب یک ردیف بسازید.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setVariants([
                                ...variants,
                                {
                                  id: Date.now(),
                                  productId: 0,
                                  sku: `${sku}-${variants.length + 1}`,
                                  size: "",
                                  color: "",
                                  colorCode: "#000000",
                                  stock: 0,
                                  priceAdjustment: 0,
                                },
                              ])
                            }
                            className="rounded-lg bg-sky-700 px-3 py-2 text-[10px] font-bold text-white"
                          >
                            + افزودن ترکیب جدید
                          </button>
                        </div>
                        <div className="mt-3 space-y-3">
                          {variants.map((variant, index) => (
                            <div key={variant.id} className="rounded-xl border border-sky-200 bg-white p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-black text-sky-900">ترکیب شماره {index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                  className="text-[10px] font-bold text-rose-600"
                                >
                                  حذف این ترکیب
                                </button>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="text-[10px] font-bold text-stone-700">
                                  کد کالا / SKU
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, sku: e.target.value } : item)))}
                                    className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none"
                                  />
                                </label>
                                <label className="text-[10px] font-bold text-stone-700">
                                  سایز
                                  <input
                                    type="text"
                                    value={variant.size}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, size: e.target.value } : item)))}
                                    className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none"
                                  />
                                </label>
                                <label className="text-[10px] font-bold text-stone-700">
                                  نام رنگ
                                  <input
                                    type="text"
                                    value={variant.color}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, color: e.target.value } : item)))}
                                    className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none"
                                  />
                                </label>
                                <label className="text-[10px] font-bold text-stone-700">
                                  کد رنگ
                                  <input
                                    type="color"
                                    value={variant.colorCode || "#000000"}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, colorCode: e.target.value } : item)))}
                                    className="mt-1 h-9 w-full rounded-lg border border-sky-200 bg-white p-1"
                                  />
                                </label>
                                <label className="text-[10px] font-bold text-stone-700">
                                  موجودی قابل فروش
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.stock}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, stock: Number(e.target.value) } : item)))}
                                    className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none"
                                  />
                                </label>
                                <label className="text-[10px] font-bold text-stone-700">
                                  تغییر قیمت این ترکیب
                                  <input
                                    type="number"
                                    value={variant.priceAdjustment}
                                    onChange={(e) => setVariants(variants.map((item, i) => (i === index ? { ...item, priceAdjustment: Number(e.target.value) } : item)))}
                                    className="mt-1 w-full rounded-lg border border-sky-200 p-2 text-xs outline-none"
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* جدول اندازه‌های واقعی بر حسب سانتی‌متر */}
                      {!isAccessoryCategory && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-black text-emerald-950">اندازه‌های واقعی لباس (سانتی‌متر)</h4>
                              <p className="mt-1 text-[11px] leading-5 text-emerald-800">
                                این جدول برای محاسبه پیشنهاد سایز هوشمند به خریدار استفاده می‌شود.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSizeChart([...sizeChart, { size: "", ageRange: "", heightCm: "", chestCm: "", lengthCm: "" }])}
                              className="rounded-lg bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white"
                            >
                              + افزودن ردیف اندازه
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {sizeChart.map((row, index) => (
                              <div key={index} className="rounded-xl border border-emerald-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-[11px] font-black text-emerald-900">ردیف {index + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSizeChart(sizeChart.filter((_, i) => i !== index))}
                                    className="text-[10px] font-bold text-rose-600"
                                  >
                                    حذف
                                  </button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <label className="text-[10px] font-bold text-stone-700">
                                    سایز
                                    <input
                                      value={row.size ?? ""}
                                      onChange={(e) => setSizeChart(sizeChart.map((item, i) => (i === index ? { ...item, size: e.target.value } : item)))}
                                      className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none"
                                    />
                                  </label>
                                  <label className="text-[10px] font-bold text-stone-700">
                                    بازه سنی
                                    <input
                                      value={row.ageRange ?? ""}
                                      onChange={(e) => setSizeChart(sizeChart.map((item, i) => (i === index ? { ...item, ageRange: e.target.value } : item)))}
                                      className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none"
                                    />
                                  </label>
                                  <label className="text-[10px] font-bold text-stone-700">
                                    قد کودک (cm)
                                    <input
                                      value={row.heightCm ?? ""}
                                      onChange={(e) => setSizeChart(sizeChart.map((item, i) => (i === index ? { ...item, heightCm: e.target.value } : item)))}
                                      className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none"
                                    />
                                  </label>
                                  {!isBottomCategory && (
                                    <label className="text-[10px] font-bold text-stone-700">
                                      دور سینه (cm)
                                      <input
                                        value={row.chestCm ?? ""}
                                        onChange={(e) => setSizeChart(sizeChart.map((item, i) => (i === index ? { ...item, chestCm: e.target.value } : item)))}
                                        className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none"
                                      />
                                    </label>
                                  )}
                                  <label className="text-[10px] font-bold text-stone-700">
                                    قد لباس (cm)
                                    <input
                                      value={row.garmentLengthCm ?? row.lengthCm ?? ""}
                                      onChange={(e) => setSizeChart(sizeChart.map((item, i) => (i === index ? { ...item, garmentLengthCm: e.target.value, lengthCm: e.target.value } : item)))}
                                      className="mt-1 w-full rounded-lg border border-emerald-200 p-2 text-xs outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* مشخصات و صفات فنی دسته‌بندی */}
                      <ProductSpecificationsEditor
                        categoryId={categoryId || editingProduct?.categoryId || 0}
                        categoryName={categoryName}
                        categorySlug={categories.find((category) => category.id === (categoryId || editingProduct?.categoryId))?.slug}
                        value={attributes}
                        onChange={setAttributes}
                      />
                    </div>
                  )}

                  {/* تنظیمات نمایش در سایت */}
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <h4 className="text-xs font-black text-stone-900 mb-2">تنظیمات انتشار و ویترین</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700">وضعیت کالا</label>
                        <select
                          value={productStatus}
                          onChange={(e) => setProductStatus(e.target.value as Product["status"])}
                          className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs font-bold"
                        >
                          <option value="active">فعال و قابل مشاهده در فروشگاه</option>
                          <option value="draft">پیش‌نویس (فقط مدیر)</option>
                          <option value="archived">بایگانی</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="size-4 accent-amber-600 rounded"
                        />
                        <span className="text-xs font-bold text-stone-800">نمایش در صفحه اصلی</span>
                      </label>

                      <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSpecialOffer}
                          onChange={(e) => setIsSpecialOffer(e.target.checked)}
                          className="size-4 accent-amber-600 rounded"
                        />
                        <span className="text-xs font-bold text-stone-800">پیشنهاد ویژه و تخفیف</span>
                      </label>
                    </div>
                  </div>

                  {saveStage && <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] font-bold text-sky-800">{saveStage}</p>}

                  {/* دکمه‌های ثبت و انصراف */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-2xl bg-stone-950 py-3 text-xs font-black text-white shadow-md hover:bg-stone-800 transition disabled:opacity-50"
                    >
                      {saving ? "در حال ذخیره محصول..." : editingProduct ? "ذخیره تغییرات" : "انتشار محصول در فروشگاه"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      disabled={saving}
                      className="rounded-2xl bg-stone-100 px-6 py-3 text-xs font-bold text-stone-700 hover:bg-stone-200 transition"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>

              {/* ستون کناری: پیش‌نمایش زنده کارت محصول در فروشگاه */}
              <div className="lg:col-span-4">
                <div className="sticky top-4 space-y-4">
                  <ProductLivePreviewCard
                    title={title}
                    categoryName={categoryName}
                    basePrice={basePrice}
                    salePrice={salePrice}
                    image={images[0]}
                    isFeatured={isFeatured}
                    isSpecialOffer={isSpecialOffer}
                    status={productStatus}
                    totalStock={variants.length ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : quickStock}
                  />

                  {/* راهنما در حالت ثبت سریع */}
                  {entryMode === "quick" && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">
                      💡 <strong>نکته کاربردی:</strong> برای ثبت جداول سانتی‌متری، زوایای پرو مجازی و مشخصات فنی، در بالای این پنجره روی <strong>«مشخصات کامل و AI»</strong> کلیک کنید.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
