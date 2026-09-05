import { getProducts } from "../lib/catalog";
import ProductCard from "../components/ProductCard";
import CategoryFilterSidebar from "../components/CategoryFilterSidebar";
import Link from "next/link";
import { CatalogFilterParams, Gender } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";

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
      {/* مسیر خرده‌نانی Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-violet-700">خانه</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">فروشگاه پوشاک کودک</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900">
          کاتالوگ کامل پوشاک کودک و نوجوان
        </h1>
        <p className="mt-2 text-xs text-stone-500 sm:text-sm">
          نمایش {toPersianDigits(catalogData.total)} محصول با تضمین کیفیت و تعویض سایز
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
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <span className="text-5xl">🔍</span>
              <h3 className="mt-4 text-lg font-black text-stone-900">
                هیچ محصولی با فیلترهای انتخابی یافت نشد!
              </h3>
              <p className="mt-2 text-xs text-stone-500">
                لطفاً فیلترها را تغییر داده یا پاک کنید.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
              >
                حذف همه فیلترها
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
