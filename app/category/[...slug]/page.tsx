import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getProducts } from "../../lib/catalog";
import ProductCard from "../../components/ProductCard";
import CategoryFilterSidebar from "../../components/CategoryFilterSidebar";
import { CatalogFilterParams, Gender } from "../../lib/types/catalog";
import { toPersianDigits } from "../../lib/utils";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{
    gender?: string;
    size?: string | string[];
    color?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    offer?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categorySlug = slug[0];
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: "دسته‌بندی یافت نشد | مینی رویال" };
  }

  return {
    title: `خرید لباس ${category.name} | فروشگاه مینی رویال`,
    description: category.description || `خرید جدیدترین پوشاک ${category.name} با تضمین تعویض سایز و ارسال سریع.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const categorySlug = slug[0];
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

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
    categorySlug,
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
        <Link href="/shop" className="hover:text-violet-700">دسته‌بندی‌ها</Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">{category.name}</span>
      </nav>

      {/* بنر بالای دسته */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-violet-100 via-purple-50 to-amber-50 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="text-4xl sm:text-5xl">{category.icon || "👕"}</span>
          <div>
            <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">
              پوشاک {category.name}
            </h1>
            <p className="mt-2 text-xs text-stone-600 sm:text-sm">
              {category.description} — شامل {toPersianDigits(catalogData.total)} محصول باکیفیت.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* فیلتر کناری */}
        <div className="lg:col-span-1">
          <CategoryFilterSidebar
            categories={catalogData.categories}
            availableSizes={catalogData.availableSizes}
            availableColors={catalogData.availableColors}
            currentCategorySlug={categorySlug}
          />
        </div>

        {/* لیست محصولات */}
        <div className="lg:col-span-3">
          {catalogData.products.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <span className="text-5xl">📦</span>
              <h3 className="mt-4 text-lg font-black text-stone-900">
                در حال حاضر محصولی در این دسته‌بندی با فیلترهای انتخابی موجود نیست!
              </h3>
              <Link
                href={`/category/${categorySlug}`}
                className="mt-6 inline-block rounded-full bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
              >
                مشاهده همه محصولات {category.name}
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
