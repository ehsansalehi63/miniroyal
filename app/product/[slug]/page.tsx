import { notFound } from "next/navigation";
import Link from "next/link";
import ProductGallery from "../../components/ProductGallery";
import SizeChartTable from "../../components/SizeChartTable";
import SizeFitIndicator from "../../components/SizeFitIndicator";
import ReviewList from "../../components/ReviewList";
import VirtualTryonBox from "../../components/VirtualTryonBox";
import ProductCard from "../../components/ProductCard";
import ProductVariantsClient from "./ProductVariantsClient";
import { getProductBySlug, getRelatedProducts } from "../../lib/catalog";
import { calculateDiscountPercent, formatToman, toPersianDigits } from "../../lib/utils";
import { currentCustomer } from "../../lib/customer-auth";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tryon?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "محصول یافت نشد | مینی رویال" };
  }

  return {
    title: product.seoTitle || `${product.title} | مینی رویال`,
    description: product.seoDesc || product.shortDesc,
    openGraph: {
      title: product.title,
      description: product.shortDesc,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { tryon } = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);
  const customer = await currentCustomer();

  const discountPercent = calculateDiscountPercent(product.basePrice, product.salePrice);
  const currentPrice = product.salePrice ?? product.basePrice;

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.shortDesc,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brandName || "مینی رویال",
    },
    offers: {
      "@type": "Offer",
      url: `https://miniroyal.shop/product/${product.slug}`,
      priceCurrency: "IRR",
      price: currentPrice * 10, // Toman to Rial for Schema
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "مینی رویال",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.ratingAvg,
      reviewCount: product.ratingCount || 1,
    },
  };

  return (
    <>
      {/* اسکیما JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* مسیر خرده‌نانی */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500">
          <Link href="/" className="hover:text-violet-700">خانه</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-violet-700">فروشگاه</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`} className="hover:text-violet-700">
            {product.categoryName}
          </Link>
          <span>/</span>
          <span className="text-stone-900 font-bold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* بخش اصلی محصول */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* گالری تصاویر */}
          <div className="lg:col-span-5">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* مشخصات، انتخاب سایز و قیمت */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                <span>برند {product.brandName || "مینی رویال"}</span>
                <span>•</span>
                <span>کد کالا: {product.sku}</span>
              </div>
              <h1 className="mt-2 text-2xl font-black text-stone-900 sm:text-3xl leading-snug">
                {product.title}
              </h1>
              <p className="mt-3 text-xs leading-6 text-stone-600 sm:text-sm">
                {product.shortDesc}
              </p>
            </div>

            {/* نوار امتیاز و نظرات سایز */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-stone-700 border-y border-stone-100 py-3">
              <div className="flex items-center gap-1 text-amber-500">
                <span className="text-base">★</span>
                <span>{toPersianDigits(product.ratingAvg.toFixed(1))}</span>
                <span className="text-stone-400">({toPersianDigits(product.ratingCount)} نظر)</span>
              </div>
              <span>|</span>
              <span className="text-emerald-700">✓ تضمین اصالت و تعویض سایز مینی رویال</span>
            </div>

            {/* قیمت و تخفیف */}
            <div className="rounded-3xl bg-stone-50 p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-stone-900">
                  {formatToman(currentPrice)}
                </span>
                {product.salePrice && (
                  <span className="text-sm text-stone-400 line-through">
                    {formatToman(product.basePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">
                    %{toPersianDigits(discountPercent)} تخفیف
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                🚚 ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان
              </p>
            </div>

            {/* انتخاب متغیرها (سایز × رنگ) */}
            <ProductVariantsClient product={product} />

            {/* نشانگر فیت سایز جمعی */}
            <SizeFitIndicator reviews={product.reviews} />
          </div>
        </div>

        {/* بخش پرو آنلاین هوشمند */}
        <div className="mt-12" id="tryon-section">
          {customer ? <VirtualTryonBox product={product} /> : (
            <div dir="rtl" className="rounded-3xl border border-violet-200 bg-violet-50 p-8 text-center">
              <h2 className="text-xl font-black text-stone-950">برای پرو آنلاین وارد شوید</h2>
              <p className="mt-2 text-sm text-stone-600">ثبت‌نام و ورود مشتری برای استفاده از این قابلیت الزامی است.</p>
              <Link href={`/account?next=%2Fproduct%2F${product.slug}%23tryon-section`} className="mt-5 inline-flex rounded-full bg-violet-700 px-6 py-3 text-sm font-black text-white">ورود یا ثبت‌نام</Link>
            </div>
          )}
        </div>

        {/* جدول سایز سانتی‌متری */}
        <div className="mt-10">
          <SizeChartTable sizeChart={product.sizeChartJson} />
        </div>

        {/* توضیحات محصول، جنس و راهنمای شست‌وشو */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-black text-stone-900">توضیحات کامل و ویژگی‌ها</h3>
            <div className="mt-4 space-y-4 text-xs leading-7 text-stone-700 sm:text-sm sm:leading-8">
              <p>{product.description}</p>

              {product.features && product.features.length > 0 && (
                <div className="mt-4 rounded-2xl bg-violet-50/50 p-4 border border-violet-100">
                  <h4 className="font-bold text-stone-900">ویژگی‌های برجسته این لباس:</h4>
                  <ul className="mt-2 space-y-2 list-disc list-inside text-stone-800">
                    {product.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
              <h4 className="font-black text-stone-900 text-sm">🧵 جنس و شست‌وشو</h4>
              <div className="mt-3 space-y-3 text-xs text-stone-700">
                {product.fabricMaterial && (
                  <div>
                    <strong className="text-stone-900">جنس پارچه: </strong>
                    {product.fabricMaterial}
                  </div>
                )}
                {product.washCare && (
                  <div>
                    <strong className="text-stone-900">دستور شست‌وشو: </strong>
                    {product.washCare}
                  </div>
                )}
              </div>
            </div>

            {/* FAQ محصول */}
            {product.faqJson && product.faqJson.length > 0 && (
              <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                <h4 className="font-black text-stone-900 text-sm">❓ سؤالات متداول درباره این لباس</h4>
                <div className="mt-3 space-y-3">
                  {product.faqJson.map((faq, idx) => (
                    <div key={idx} className="rounded-xl bg-stone-50 p-3 text-xs">
                      <strong className="block font-bold text-stone-900">{faq.question}</strong>
                      <p className="mt-1 text-stone-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* لیست نظرات */}
        <div className="mt-12 rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <ReviewList productId={product.id} reviews={product.reviews} />
        </div>

        {/* محصولات مرتبط */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-6 text-2xl font-black text-stone-900">
              محصولات مرتبط و ست‌های پیشنهادی
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
