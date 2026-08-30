import Link from "next/link";
import { getFeaturedProducts } from "../lib/catalog";
import VirtualTryonBox from "../components/VirtualTryonBox";

export const metadata = {
  title: "پرو آنلاین و توصیه‌گر سایز | مینی رویال",
  description: "قبل از خرید، قد و وزن کودک را وارد کرده و سایز دقیق را مشاهده کنید.",
};

export default async function VirtualTryonPage() {
  const featured = await getFeaturedProducts(1);
  const sampleProduct = featured[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <span className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-800">
          👗 پرو آنلاین لباس کودک
        </span>
        <h1 className="mt-4 text-3xl font-black text-stone-900 sm:text-4xl">
          توصیه‌گر سایز هوشمند و آواتار ۲ بعدی
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-stone-600 sm:text-sm">
          با الگوریتم Smart Fit مینی رویال، درصد اطمینان سایز دقیق فرزندتان را محاسبه کنید.
        </p>
      </div>

      <div className="mt-10">
        <VirtualTryonBox product={sampleProduct} />
      </div>

      <div className="mt-12 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">آماده انتخاب لباس برای فرزندتان هستید؟</h2>
        <p className="mt-2 text-xs text-stone-500">
          وارد کاتالوگ محصولات شوید و پرو آنلاین را روی هر محصول دلخواه امتحان کنید.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-violet-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-800"
        >
          ورود به فروشگاه مینی رویال 🛍️
        </Link>
      </div>
    </div>
  );
}
