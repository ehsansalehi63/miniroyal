import { getProducts } from "../lib/catalog";
import VirtualTryonSelector from "../components/VirtualTryonSelector";
import { currentCustomer } from "../lib/customer-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "پرو آنلاین و پیشنهاد سایز | مینی رویال",
  description: "محصول را انتخاب کنید، اندازه‌های کودک را وارد کنید و پرو آنلاین لباس را امتحان کنید.",
};

interface VirtualTryonPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function VirtualTryonPage({ searchParams }: VirtualTryonPageProps) {
  const customer = await currentCustomer();
  const { product: initialProductSlug } = await searchParams;
  if (!customer) {
    return (
      <main dir="rtl" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-stone-950">ورود به پرو آنلاین</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">برای حفظ حریم خصوصی تصاویر و مدیریت سهمیه، ابتدا در حساب مشتری عضو شوید و وارد شوید.</p>
        <Link href={`/account?next=${encodeURIComponent(`/virtual-tryon${initialProductSlug ? `?product=${initialProductSlug}` : ""}`)}`} className="mt-7 inline-flex rounded-full bg-violet-700 px-7 py-3 font-black text-white">ورود یا ثبت‌نام</Link>
      </main>
    );
  }
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
        <VirtualTryonSelector products={tryOnProducts} initialProductSlug={initialProductSlug} />
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
