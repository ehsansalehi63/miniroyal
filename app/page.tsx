import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import CinematicHero from "./components/CinematicHero";
import { getFeaturedProducts } from "./lib/catalog";
import { getSuggestedSets } from "./lib/sets";
import SuggestedSets from "./components/SuggestedSets";
import { kidsCategories } from "./lib/kidsCategories";
import { THUMB_IMAGES } from "./lib/imageCatalog";
import { DEFAULT_HOME_SLIDES } from "./lib/homeConfig";
import { blogPosts } from "./lib/blogPosts";
import { ShieldCheck, Truck, RotateCcw, Headset, ArrowLeft, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "مینی رویال | فروشگاه پوشاک کودک و نوجوان با پرو آنلاین لباس",
  description: "خرید شیک‌ترین لباس‌های دخترانه، پسرانه و نوزاد با پرو آنلاین، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.",
  alternates: { canonical: "/" },
};

/** دسته‌های اصلی همراه با تصویر و زیردسته‌های واقعی (از همان taxanomy کاتالوگ) */
const PRIMARY_GROUPS = [
  { parentSlug: "nozad", name: "نوزاد و سیسمونی", hint: "۰ تا ۲۴ ماه", image: THUMB_IMAGES.babySet },
  { parentSlug: "dokhtaraneh", name: "دخترانه", hint: "۲ تا ۱۴ سال", image: THUMB_IMAGES.girlDress },
  { parentSlug: "pesaraneh", name: "پسرانه", hint: "۲ تا ۱۴ سال", image: THUMB_IMAGES.boyHoodie },
  { parentSlug: "madreseh", name: "مدرسه و فصل سرما", hint: "کاپشن، پالتو و فرم", image: THUMB_IMAGES.jacket },
  { parentSlug: "set", name: "ست و اکسسوری", hint: "ست، کفش و کلاه", image: THUMB_IMAGES.editorial },
] as const;

const TRUST_ITEMS = [
  { icon: Truck, title: "ارسال سریع سراسری", text: "ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان" },
  { icon: RotateCcw, title: "۷ روز ضمانت تعویض", text: "بازگشت و تعویض آسان سایز" },
  { icon: ShieldCheck, title: "پارچهٔ ضدحساسیت", text: "پنبهٔ نرم و مناسب پوست کودک" },
  { icon: Headset, title: "مشاورهٔ سایز رایگان", text: "پشتیبانی واتساپ پیش از خرید" },
];

const REVIEWS = [
  {
    name: "مریم رضایی",
    city: "تهران",
    rating: 5,
    text: "سایزی که پرو آنلاین پیشنهاد داد دقیقاً همان بود که به بچه‌ام آمد. اولین بار است آنلاین لباس بچه می‌خرم و لازم نمی‌شود پس بفرستم.",
  },
  {
    name: "سحر کاظمی",
    city: "اصفهان",
    rating: 5,
    text: "پارچهٔ ست نوزادی واقعاً پنبه‌ای و نرم است؛ بعد از چند بار شست‌وشو نه رنگ داد نه آب رفت.",
  },
  {
    name: "امیر تهرانی",
    city: "شیراز",
    rating: 4,
    text: "کاپشن مدرسه کیفیت دوخت خوبی دارد و ارسال هم دو روزه رسید. فقط کاش رنگ‌بندی بیشتری داشت.",
  },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(8);

  // ویدیوی سینمایی هیرو: اگر فایل لوکال موجود باشد، همان پخش می‌شود.
  // چون صفحهٔ اصلی استاتیک prerender می‌شود، این بررسی هنگام build انجام می‌شود؛
  // بعد از افزودن فایل، یک `npm run build` کافی است.
  const videoDir = path.join(process.cwd(), "public", "video");
  const videoFile = ["hero.mp4", "hero.webm"].find((name) => fs.existsSync(path.join(videoDir, name)));
  const heroVideoSrc = videoFile ? `/video/${videoFile}` : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://miniroyal.shop/#organization",
        name: "مینی رویال",
        alternateName: "Mini Royal",
        url: "https://miniroyal.shop/",
        logo: "https://miniroyal.shop/images/brand/miniroyal-logo.webp",
        description: "بوتیک آنلاین پوشاک کودک و نوجوان با پرو آنلاین سایز و جدول سایز سانتی‌متری.",
        areaServed: "IR",
      },
      {
        "@type": "WebSite",
        "@id": "https://miniroyal.shop/#website",
        url: "https://miniroyal.shop/",
        name: "مینی رویال",
        inLanguage: "fa-IR",
        publisher: { "@id": "https://miniroyal.shop/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://miniroyal.shop/shop?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: "جدیدترین محصولات مینی رویال",
        itemListElement: featuredProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://miniroyal.shop/product/${product.slug}`,
          name: product.title,
        })),
      },
    ],
  };

  return (
    <div className="space-y-14 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <CinematicHero slides={DEFAULT_HOME_SLIDES} videoSrc={heroVideoSrc} />

      {/* نوار اعتماد */}
      <section aria-label="خدمات و تضمین‌های مینی رویال" className="mx-auto site-container px-4">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <li key={item.title} className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/85 p-4">
              <item.icon className="mt-0.5 size-5 shrink-0 text-violet-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-black text-stone-900">{item.title}</p>
                <p className="mt-1 text-[11px] leading-6 text-stone-500">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* دسته‌بندی‌ها: یک بخش واحد با زیردسته‌های واقعی */}
      <section aria-labelledby="categories-heading" className="mx-auto site-container px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <p className="fashion-kicker text-[10px] font-black">Kids fashion edit</p>
            <h2 id="categories-heading" className="mt-2 text-xl font-black text-stone-900 sm:text-2xl">
              دسته‌بندی‌های پوشاک کودک و نوجوان
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              از نوزادی تا نوجوانی؛ هر دسته با زیرمجموعهٔ دقیق و جدول سایز سانتی‌متری
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-black text-violet-700 hover:underline">
            کاتالوگ کامل
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PRIMARY_GROUPS.map((group) => {
            const children = kidsCategories.filter((category) => category.parentSlug === group.parentSlug);
            return (
              <article key={group.parentSlug} className="fashion-surface overflow-hidden rounded-3xl">
                <Link href={`/category/${group.parentSlug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                      src={group.image}
                      alt={`خرید ${group.name}`}
                      width={560}
                      height={420}
                      loading="lazy"
                      decoding="async"
                      className="editorial-image size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black text-stone-900 group-hover:text-violet-700">{group.name}</h3>
                    <p className="mt-1 text-[11px] text-stone-500">{group.hint}</p>
                  </div>
                </Link>
                <ul className="space-y-1.5 border-t border-stone-100 px-4 py-3">
                  {children.slice(0, 5).map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/category/${category.slug}`}
                        className="block truncate text-[11px] font-semibold text-stone-600 transition hover:text-violet-700"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <SuggestedSets sets={getSuggestedSets(featuredProducts)} />

      {/* محصولات ویژه */}
      <section aria-labelledby="featured-heading" className="mx-auto site-container px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h2 id="featured-heading" className="text-xl font-black text-stone-900 sm:text-2xl">
              جدیدترین محصولات مینی رویال
            </h2>
            <p className="mt-1 text-xs text-stone-500">پوشاک با ضمانت اصالت پارچه و پرو آنلاین سایز</p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline">
            دیدن کاتالوگ کامل
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* بنر پرو آنلاین */}
      <section aria-labelledby="tryon-heading" className="mx-auto site-container px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-violet-900 via-fuchsia-900 to-stone-900 p-8 text-white shadow-2xl sm:p-10">
          <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3 text-center md:text-right">
              <span className="rounded-full border border-violet-500/30 bg-violet-700/80 px-3.5 py-1 text-xs font-bold text-violet-200">
                پرو آنلاین سایز
              </span>
              <h2 id="tryon-heading" className="text-2xl font-black sm:text-3xl">
                نمی‌دانی چه سایزی برای فرزندت مناسب است؟
              </h2>
              <p className="max-w-xl text-xs leading-7 text-stone-300 sm:text-sm">
                قد و وزن فرزندت را وارد کن؛ پرو آنلاین سایز مناسب را بر اساس اندازه‌های واقعی و راهنمای هر لباس پیشنهاد می‌دهد.
              </p>
            </div>
            <Link
              href="/virtual-tryon"
              className="shrink-0 rounded-2xl bg-white px-8 py-4 text-xs font-black text-violet-900 shadow-xl transition hover:scale-105 hover:bg-amber-300 sm:text-sm"
            >
              شروع پرو آنلاین
            </Link>
          </div>
        </div>
      </section>

      {/* نظرات مشتریان */}
      <section aria-labelledby="reviews-heading" className="mx-auto site-container px-4">
        <div className="border-b border-stone-200 pb-4">
          <h2 id="reviews-heading" className="text-xl font-black text-stone-900 sm:text-2xl">
            تجربهٔ مشتری‌های مینی رویال
          </h2>
          <p className="mt-1 text-xs text-stone-500">بازخورد خانواده‌ها دربارهٔ سایز، کیفیت پارچه و ارسال</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.name} className="fashion-surface rounded-3xl p-5">
              <div className="flex items-center gap-1" aria-label={`امتیاز ${review.rating} از ۵`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden="true"
                    className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-xs leading-7 text-stone-700">«{review.text}»</blockquote>
              <figcaption className="mt-4 text-[11px] font-black text-stone-900">
                {review.name}
                <span className="mr-2 font-semibold text-stone-500">{review.city}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* مجلهٔ استایل */}
      <section aria-labelledby="blog-heading" className="mx-auto site-container px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h2 id="blog-heading" className="text-xl font-black text-stone-900 sm:text-2xl">
              مجلهٔ استایل کودک
            </h2>
            <p className="mt-1 text-xs text-stone-500">راهنمای سایز، پارچه و نگهداری لباس کودک</p>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline">
            همهٔ مقاله‌ها
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {blogPosts.slice(0, 3).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="fashion-surface group rounded-3xl p-5">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-800">
                {post.category}
              </span>
              <h3 className="mt-3 text-sm font-black leading-6 text-stone-900 group-hover:text-violet-700">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-[11px] leading-6 text-stone-500">{post.summary}</p>
              <p className="mt-3 text-[10px] font-bold text-stone-400">
                {post.date} · {post.readTime} مطالعه
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
