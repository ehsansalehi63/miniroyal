import { getProducts } from "../lib/catalog";
import ProductCard from "../components/ProductCard";
import CategoryFilterSidebar from "../components/CategoryFilterSidebar";
import Link from "next/link";
import { CatalogFilterParams, Gender } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";
import ManagedBanners from "../components/ManagedBanners";

export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: Promise<{
    gender?: string;
    size?: string | string[];
    color?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    offer?: string;
    sort?: string;
    q?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;

  const sizes = Array.isArray(resolvedParams.size)
    ? resolvedParams.size
    : resolvedParams.size
    ? [resolvedParams.size]
    : [];

  const colors = Array.isArray(resolvedParams.color)
    ? resolvedParams.color
    : resolvedParams.color
    ? [resolvedParams.color]
    : [];

  const catalogData = await getProducts({
    gender: (resolvedParams.gender as Gender) || "all",
    sizes,
    colors,
    minPrice: resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined,
    isSpecialOffer: resolvedParams.offer === "true",
    sort: resolvedParams.sort as CatalogFilterParams["sort"],
    search: resolvedParams.q,
  });

  return (
    <div className="mx-auto site-container px-4 py-8">
      <ManagedBanners placement="shop_top" />
      {/* مسیر خرده‌نانی Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition">خانه</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">فروشگاه پوشاک کودک</span>
      </nav>

      <div className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">The Catalog</span>
        <h1 className="mt-1 text-2xl font-black text-stone-950 sm:text-3xl">
          کاتالوگ کامل پوشاک کودک و نوجوان
        </h1>
        <p className="mt-1.5 text-xs text-stone-600 sm:text-sm">
          نمایش {toPersianDigits(catalogData.total)} لباس نفیس با تضمین کیفیت پارچه و امکان پرو آنلاین سایز
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* نوار فیتلر کناری */}
        <div className="lg:col-span-1">
          <CategoryFilterSidebar
            categories={catalogData.categories}
            availableSizes={catalogData.availableSizes}
            availableColors={catalogData.availableColors}
          />
        </div>

        {/* شبکه محصولات */}
        <div className="lg:col-span-3">
          {catalogData.products.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-4 text-base font-black text-stone-900">
                هیچ لباسی با فیلترهای انتخابی یافت نشد
              </h3>
              <p className="mt-2 text-xs text-stone-500">
                پیشنهاد می‌کنیم برخی فیلترها را حذف کرده یا تغییر دهید.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-xl bg-stone-950 px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-stone-800"
              >
                مشاهده همه محصولات
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {catalogData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
