import { getProducts } from "../lib/catalog";
import VirtualTryonSelector from "../components/VirtualTryonSelector";
import { currentCustomer } from "../lib/customer-auth";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پرو آنلاین هوشمند و محاسبه‌گر دقیق سایز لباس کودک | مینی رویال",
  description: "ابزار هوش مصنوعی پرو آنلاین لباس کودک مینی رویال؛ اندازه‌های کودک را وارد کنید و پیش‌نمایش تن‌خور لباس و درصد تطابق سایز را به صورت دقیق مشاهده نمایید.",
  alternates: { canonical: "/virtual-tryon" },
  openGraph: {
    title: "پرو آنلاین هوشمند و محاسبه‌گر دقیق سایز لباس کودک | مینی رویال",
    description: "ابزار هوش مصنوعی پرو آنلاین لباس کودک مینی رویال؛ اندازه‌های کودک را وارد کنید و پیش‌نمایش تن‌خور لباس را مشاهده کنید.",
    url: "https://miniroyal.shop/virtual-tryon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "پرو آنلاین هوشمند و محاسبه‌گر دقیق سایز لباس کودک | مینی رویال",
    description: "ابزار هوش مصنوعی پرو آنلاین لباس کودک مینی رویال؛ اندازه‌های کودک را وارد کنید و پیش‌نمایش تن‌خور لباس را مشاهده کنید.",
  },
};

interface VirtualTryonPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function VirtualTryonPage({ searchParams }: VirtualTryonPageProps) {
  const customer = await currentCustomer();
  const { product: initialProductSlug } = await searchParams;
  const { products } = await getProducts({ sort: "recommended" });
  const tryOnProducts = products.filter(
    (product) =>
      product.status === "active" &&
      product.images.length > 0 &&
      product.variants.some((variant) => variant.stock > 0)
  );

  const tryonJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: "https://miniroyal.shop/" },
          { "@type": "ListItem", position: 2, name: "پرو آنلاین لباس", item: "https://miniroyal.shop/virtual-tryon" },
        ],
      },
      {
        "@type": "WebApplication",
        name: "پرو آنلاین لباس کودک مینی رویال",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "All",
        description: "سیستم هوش مصنوعی پیشنهاد سایز و پیش‌نمایش پرو آنلاین تن‌خور لباس کودک",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "IRR",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tryonJsonLd) }}
      />
      <div dir="rtl" className="text-center">
        <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-black text-amber-900">
          👗 پرو آنلاین لباس کودک
        </span>
        <h1 className="mt-4 text-3xl font-black text-stone-900 sm:text-4xl">
          اول محصول، بعد عکس کودک و پرو واقعی
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600">
          برای هر محصول، جدول اندازه و تصویر همان لباس در پیشنهاد سایز و پرو AI استفاده می‌شود.
        </p>
      </div>

      <div className="mt-10">
        <VirtualTryonSelector
          products={tryOnProducts}
          initialProductSlug={initialProductSlug}
          customer={customer}
        />
      </div>

      <div dir="rtl" className="mt-12 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">لباس دیگری می‌خواهید؟</h2>
        <p className="mt-2 text-xs text-stone-500">از کاتالوگ محصول دیگری انتخاب کنید و پرو آنلاین آن را اجرا کنید.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-stone-950 px-8 py-3.5 text-sm font-black text-white shadow-lg hover:bg-stone-800">
          ورود به فروشگاه
        </Link>
      </div>
    </div>
  );
}
