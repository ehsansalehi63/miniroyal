import Link from "next/link";
import { getProducts } from "../lib/catalog";
import VirtualTryonSelector from "../components/VirtualTryonSelector";

export const metadata = {
  title: "پرو آنلاین و پیشنهاد سایز | مینی رویال",
  description: "محصول را انتخاب کنید، اندازه‌های کودک را وارد کنید و پرو آنلاین لباس را امتحان کنید.",
};

export default async function VirtualTryonPage() {
  const { products } = await getProducts({ sort: "recommended" });
  const tryOnProducts = products.filter(
    (product) =>
      product.status === "active" &&
      product.images.length > 0 &&
      product.variants.some((variant) => variant.stock > 0)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div dir="rtl" className="text-center">
        <span className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-800">
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
        <VirtualTryonSelector products={tryOnProducts} />
      </div>

      <div dir="rtl" className="mt-12 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">لباس دیگری می‌خواهید؟</h2>
        <p className="mt-2 text-xs text-stone-500">از کاتالوگ محصول دیگری انتخاب کنید و پرو آنلاین آن را اجرا کنید.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-violet-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-violet-800">
          ورود به فروشگاه
        </Link>
      </div>
    </div>
  );
}
