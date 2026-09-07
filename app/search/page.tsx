import Link from "next/link";
import { getProducts } from "../lib/catalog";
import ProductCard from "../components/ProductCard";
import CategoryFilterSidebar from "../components/CategoryFilterSidebar";
import { CatalogFilterParams, Gender } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    gender?: string;
    size?: string | string[];
    color?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    offer?: string;
    sort?: string;
  }>;
}

export const metadata = {
  title: "نتایج جستجو | مینی رویال",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

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
    search: query,
    gender: (resolvedParams.gender as Gender) || "all",
    sizes,
    colors,
    minPrice: resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined,
    isSpecialOffer: resolvedParams.offer === "true",
    sort: resolvedParams.sort as CatalogFilterParams["sort"],
  });

  return (
    <div className="mx-auto site-container px-4 py-8">
      {/* مسیر خرده‌نانی */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-violet-700">خانه</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">نتایج جستجو</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">
          نتایج جستجو برای: <span className="text-violet-700">«{query}»</span>
        </h1>
        <p className="mt-2 text-xs text-stone-500 sm:text-sm">
          تعداد {toPersianDigits(catalogData.total)} محصول با عبارت مورد نظر شما یافت شد.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* فیلتر کناری */}
        <div className="lg:col-span-1">
          <CategoryFilterSidebar
            categories={catalogData.categories}
            availableSizes={catalogData.availableSizes}
            availableColors={catalogData.availableColors}
          />
        </div>

        {/* لیست نتایج */}
        <div className="lg:col-span-3">
          {catalogData.products.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <span className="text-5xl">🔍</span>
              <h3 className="mt-4 text-lg font-black text-stone-900">
                نتیجه‌ای برای «{query}» پیدا نشد!
              </h3>
              <p className="mt-2 text-xs text-stone-500">
                پیشنهاد می‌کنیم املای کلمه را بررسی کنید یا از دسته‌بندی‌های محبوب زیر دیدن فرمایید.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {catalogData.categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="rounded-full bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
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
