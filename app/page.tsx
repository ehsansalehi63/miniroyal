import Link from "next/link";
import ProductCard from "./components/ProductCard";
import Hero3DSlideshow from "./components/Hero3DSlideshow";
import { getFeaturedProducts } from "./lib/catalog";
import { Sparkles, ShieldCheck, Truck, RotateCcw, ArrowRight, Heart, Award, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "مینی رویال | فروشگاه پوشاک کودک و نوجوان با پرو آنلاین لباس",
  description: "خرید شیک‌ترین لباس‌های دخترانه، پسرانه و نوزاد با پرو آنلاین، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.",
};

const categories = [
  { slug: "pesaraneh", name: "پسرانه", icon: "🧢", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop" },
  { slug: "dokhtaraneh", name: "دخترانه", icon: "🎀", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&auto=format&fit=crop" },
  { slug: "nozad", name: "نوزاد", icon: "🍼", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop" },
  { slug: "set", name: "ست‌ها", icon: "✨", image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop" },
  { slug: "madreseh", name: "مدرسه", icon: "🎒", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop" },
  { slug: "majlesi", name: "مجلسی", icon: "👗", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop" },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(8);

  return (
    <div className="space-y-12">
      {/* اسلاید شو ۳ بعدی هیرو */}
      <Hero3DSlideshow />

      {/* مزایای رقابتی و تضمین کیفیت */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-white p-5 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-md">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">پرو آنلاین ۲ بعدی</h3>
              <p className="mt-0.5 text-xs text-stone-500">تضمین سایز دقیق بر اساس قد و وزن</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50/70 to-white p-5 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-fuchsia-600 text-white shadow-md">
              <Truck className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">ارسال رایگان سراسری</h3>
              <p className="mt-0.5 text-xs text-stone-500">برای خریدهای بالای ۵۰۰ هزار تومان</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">پارچه ۱۰۰٪ پنبه ارگانیک</h3>
              <p className="mt-0.5 text-xs text-stone-500">ضد حساسیت و کاملاً نرم برای پوست کودک</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-md">
              <RotateCcw className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">۷ روز ضمانت تعویض</h3>
              <p className="mt-0.5 text-xs text-stone-500">بازگشت و تعویض آسان بدون قید و شرط</p>
            </div>
          </div>
        </div>
      </section>

      {/* شبکه دسته‌بندی‌ها */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-stone-900 sm:text-2xl">
              دسته‌بندی‌های محبوب لباس کودک 🛍️
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              انتخاب سریع بر اساس رده سنی و استایل دلخواه
            </p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-violet-700 hover:underline flex items-center gap-1">
            <span>مشاهده همه</span>
            <ArrowRight className="size-3.5 rotate-180" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-violet-300"
            >
              <div className="mx-auto size-16 overflow-hidden rounded-2xl shadow-md">
                <img
                  src={c.image}
                  alt={c.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="mt-3 block text-xs font-black text-stone-900 group-hover:text-violet-700">
                {c.icon} {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* محصولات ویژه‌ترین کاتالوگ */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-stone-900 sm:text-2xl">
              جدیدترین محصولات مینی رویال 👑
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              پوشاک باکیفیت با ضمانت اصالت پارچه و پرو آنلاین
            </p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-violet-700 hover:underline">
            دیدن کاتالوگ کامل ←
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* بنر دعوت به پرو آنلاین */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-fuchsia-900 to-stone-900 p-8 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-right">
              <span className="rounded-full bg-violet-700/80 px-3.5 py-1 text-xs font-bold text-violet-200 border border-violet-500/30">
                👗 هوش مصنوعی اندازه کودک
              </span>
              <h3 className="text-2xl font-black sm:text-3xl">نمی‌دونی چه سایزی برای فرزندت مناسبه؟</h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                قد و وزن فرزندت را در سیستم پرو آنلاین مینی رویال وارد کن؛ سایز دقیق با درصد اطمینان محاسبه می‌شه!
              </p>
            </div>
            <Link
              href="/virtual-tryon"
              className="shrink-0 rounded-2xl bg-white px-8 py-4 text-xs sm:text-sm font-black text-violet-900 shadow-xl transition hover:scale-105 hover:bg-stone-100"
            >
              شروع پرو آنلاین هوشمند ←
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
