"use client";

import { useState } from "react";
import { mockProducts } from "../../lib/data/mockProducts";
import { Product } from "../../lib/types/catalog";
import { formatToman } from "../../lib/utils";
import DropzoneImageUploader from "../../components/DropzoneImageUploader";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("پسرانه");
  const [basePrice, setBasePrice] = useState(380000);
  const [salePrice, setSalePrice] = useState(295000);
  const [sku, setSku] = useState("KID-BOY-NEW");
  const [images, setImages] = useState<string[]>([
    "/images/products/boy-hoodie.svg",
  ]);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = images.length > 0 ? images : ["/images/products/boy-hoodie.svg"];

    if (editingProduct) {
      // Update existing
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? { ...p, title, categoryName, basePrice, salePrice, sku, images: finalImages }
            : p
        )
      );
    } else {
      // Create new
      const newProd: Product = {
        id: Date.now(),
        title,
        slug: `prod-${Date.now()}`,
        sku,
        shortDesc: "محصول جدید افزوده شده توسط مدیر سیستم",
        description: "توضیحات کامل محصول در پنل مدیریت ثبت شده است.",
        categoryId: 1,
        categorySlug: "pesaraneh",
        categoryName,
        gender: "boy",
        ageMinMonth: 24,
        ageMaxMonth: 96,
        basePrice,
        salePrice,
        isFeatured: false,
        isSpecialOffer: false,
        salesCount: 0,
        viewsCount: 0,
        ratingAvg: 5.0,
        ratingCount: 1,
        status: "active",
        fitType: "normal",
        images: finalImages,
        variants: [{ id: Date.now(), productId: Date.now(), sku: `${sku}-01`, size: "2-3 سال", color: "سفید", stock: 10, priceAdjustment: 0 }],
        publishedAt: new Date().toISOString().split("T")[0],
      };
      setProducts([newProd, ...products]);
    }

    setShowFormModal(false);
    setEditingProduct(null);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setCategoryName(p.categoryName);
    setBasePrice(p.basePrice);
    setSalePrice(p.salePrice ?? p.basePrice);
    setSku(p.sku);
    setImages(p.images || []);
    setShowFormModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("آیا از حذف این محصول اطمینان دارید؟")) {
      setProducts(products.filter((p) => p.id !== id));
    }
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
                      <button
                        onClick={() => handleDelete(p.id)}
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
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                  >
                    <option value="پسرانه">پسرانه</option>
                    <option value="دخترانه">دخترانه</option>
                    <option value="نوزاد">نوزاد</option>
                    <option value="لباس مدرسه">لباس مدرسه</option>
                    <option value="لباس مجلسی">لباس مجلسی</option>
                    <option value="ست‌ها و باکس‌ها">ست‌ها و باکس‌ها</option>
                  </select>
                </div>
              </div>

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
                  className="flex-1 rounded-xl bg-violet-700 py-3 font-bold text-white shadow-md hover:bg-violet-800"
                >
                  ذخیره تغییرات
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
