import Link from "next/link";
import ProductCard from "./components/ProductCard";
import Hero3DSlideshow from "./components/Hero3DSlideshow";
import { getFeaturedProducts } from "./lib/catalog";
import { mockProducts } from "./lib/data/mockProducts";
import { getSuggestedSets } from "./lib/sets";
import SuggestedSets from "./components/SuggestedSets";
import { kidsCategories } from "./lib/kidsCategories";
import { Sparkles, ShieldCheck, Truck, RotateCcw, ArrowRight } from "lucide-react";

export const metadata = {
  title: "مینی رویال | فروشگاه پوشاک کودک و نوجوان با پرو آنلاین لباس",
  description: "خرید شیک‌ترین لباس‌های دخترانه، پسرانه و نوزاد با پرو آنلاین، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.",
};

const categories = [
  { slug: "pesaraneh", name: "پسرانه", icon: "🧢", image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1000&q=88" },
  { slug: "dokhtaraneh", name: "دخترانه", icon: "🎀", image: "https://images.unsplash.com/photo-1503919545889-aef636e3d3d5?auto=format&fit=crop&w=1000&q=88" },
  { slug: "nozad", name: "نوزاد", icon: "🍼", image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1000&q=88" },
  { slug: "set", name: "ست‌ها", icon: "✨", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=88" },
  { slug: "madreseh", name: "مدرسه", icon: "🎒", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1000&q=88" },
  { slug: "majlesi", name: "مجلسی", icon: "👗", image: "https://images.unsplash.com/photo-1503919545889-aef636e3d3d5?auto=format&fit=crop&w=1000&q=88" },
];

export default async function HomePage() {
  let featuredProducts = [];
  try {
    featuredProducts = await getFeaturedProducts(8);
  } catch (err) {
    featuredProducts = mockProducts.filter((p) => p.isFeatured).slice(0, 8);
  }

  return (
    <div className="space-y-12 pb-10">
      {/* اسلاید شو ۳ بعدی هیرو */}
      <Hero3DSlideshow />

      <SuggestedSets sets={getSuggestedSets(featuredProducts)} />

      <section className="mx-auto max-w-7xl px-4">
        <div className="fashion-surface overflow-hidden rounded-[2rem] p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-3 border-b border-stone-200/70 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="fashion-kicker text-[10px] font-black">Kids fashion edit</p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">همه دسته‌بندی‌های کودک و نوجوان</h2>
              <p className="mt-2 text-sm text-stone-500">از نوزادی تا نوجوانی؛ لباس، کفش و اکسسوری را سریع پیدا کنید.</p>
            </div>
            <Link href="/shop" className="text-xs font-black text-violet-700">مشاهده کاتالوگ کامل ←</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kidsCategories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200/70 bg-white transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                  <img src={category.imageUrl} alt={category.name} className="editorial-image size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-3">
                  <span className="text-lg">{category.icon}</span>
                  <p className="mt-1 text-xs font-black leading-5 text-stone-800 group-hover:text-violet-700">{category.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
              className="fashion-surface group relative overflow-hidden rounded-3xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl"
            >
              <div className="mx-auto size-16 overflow-hidden rounded-2xl shadow-md">
                <img
                  src={c.image}
                  alt={c.name}
                  className="editorial-image size-full object-cover transition-transform duration-500 group-hover:scale-110"
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
