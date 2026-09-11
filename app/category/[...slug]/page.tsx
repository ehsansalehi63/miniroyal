import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getProducts } from "../../lib/catalog";
import ProductCard from "../../components/ProductCard";
import CategoryFilterSidebar from "../../components/CategoryFilterSidebar";
import { CatalogFilterParams, Gender } from "../../lib/types/catalog";
import { toPersianDigits } from "../../lib/utils";
import ManagedBanners from "../../components/ManagedBanners";
import { Sparkles, ShieldCheck, Shirt, Ruler, Truck, CheckCircle2 } from "lucide-react";

import type { Metadata } from "next";

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

function getDepartmentFamily(categorySlug: string, categoryName: string) {
  const s = (categorySlug || "").toLowerCase();
  const n = categoryName || "";

  if (s.includes("dokhtar") || n.includes("دختر")) {
    return {
      id: "girls",
      departmentBadge: "🎀 دپارتمان تخصصی دخترانه و پرنسسی مینی رویال",
      headline: "کالکشن تخصصی دخترانه و پرنسسی",
      tagline: "پیراهن‌های پف‌دار، سارافون، بلوز و دامن‌های لطیف با پارچه‌های ۱۰۰٪ ارگانیک و ضدحساسیت",
      gradient: "from-[#240d1a] via-[#1c0a14] to-[#0e070c]",
      accentBorder: "border-pink-500/40",
      accentText: "text-pink-300",
      badgeBg: "bg-pink-500/15 border-pink-400/30 text-pink-300",
      glowColor: "from-pink-500/25 via-rose-500/15 to-transparent",
      pillActive: "bg-pink-500 text-white shadow-lg shadow-pink-500/40 border-pink-400",
      features: [
        { icon: "👗", title: "پرو آنلاین اختصاصی", desc: "تست تن‌خور روی تمام مدل‌های دخترانه" },
        { icon: "🌸", title: "الیاف ارگانیک و لطیف", desc: "ضد حساسیت و سازگار با پوست لطیف کودکان" },
        { icon: "✨", title: "تضمین تعویض سایز", desc: "امکان تغییر سایز و قد لباس تا ۷ روز" },
        { icon: "🚀", title: "ارسال سریع با تیپاکس", desc: "بسته‌بندی اختصاصی بوتیک مینی رویال" },
      ],
      quickLinks: [
        { name: "همه دخترانه", slug: "dokhtaraneh", icon: "🎀" },
        { name: "پیراهن و سارافون", slug: "pirahan-dokhtaraneh", icon: "👗" },
        { name: "بلوز و شومیز", slug: "bluz-dokhtaraneh", icon: "🌸" },
        { name: "دامن و شلوار", slug: "daman-shalvar-dokhtaraneh", icon: "🩰" },
        { name: "لباس مجلسی دخترانه", slug: "majlesi-dokhtaraneh", icon: "✨" },
        { name: "لباس نوجوان دخترانه", slug: "lebas-nojavanan-dokhtar", icon: "💜" },
      ],
    };
  }

  if (s.includes("pesar") || n.includes("پسر")) {
    return {
      id: "boys",
      departmentBadge: "🧢 دپارتمان تخصصی پسرانه و اسپرت مینی رویال",
      headline: "کالکشن تخصصی پسرانه و اسپرت",
      tagline: "تیشرت، پولوشرت، پیراهن کتان، شلوار جین و ست‌های بادوام برای ماجراجویی‌های روزمره",
      gradient: "from-[#0c1930] via-[#091326] to-[#060b17]",
      accentBorder: "border-sky-500/40",
      accentText: "text-sky-300",
      badgeBg: "bg-sky-500/15 border-sky-400/30 text-sky-300",
      glowColor: "from-sky-500/25 via-blue-500/15 to-transparent",
      pillActive: "bg-sky-400 text-stone-950 shadow-lg shadow-sky-400/40 border-sky-300 font-black",
      features: [
        { icon: "⚡", title: "دوخت دوبل و مقاوم", desc: "مقاومت بسیار بالا در بازی و شست‌وشوی مکرر" },
        { icon: "👕", title: "پرو آنلاین هوشمند", desc: "مشاهده تن‌خور دیجیتالی قبل از ثبت سفارش" },
        { icon: "📐", title: "سایزبندی دقیق سانتیمتری", desc: "ابعاد واقعی سرشانه، قد و دور سینه" },
        { icon: "🚀", title: "ارسال سریع با تیپاکس", desc: "بیمه کامل مرسولات و ارسال سراسری" },
      ],
      quickLinks: [
        { name: "همه پسرانه", slug: "pesaraneh", icon: "🧢" },
        { name: "تیشرت و پولوشرت", slug: "tshirt-pesaraneh", icon: "👕" },
        { name: "پیراهن پسرانه", slug: "pirahan-pesaraneh", icon: "🧥" },
        { name: "شلوار و شلوارک", slug: "shalvar-pesaraneh", icon: "👖" },
        { name: "هودی و سویشرت", slug: "hoodie-sweatshirt", icon: "🧶" },
        { name: "لباس نوجوان پسرانه", slug: "lebas-nojavanan-pesar", icon: "💙" },
      ],
    };
  }

  if (s.includes("nozad") || s.includes("bodi") || s.includes("sarhami") || s.includes("bimarestani") || n.includes("نوزاد") || n.includes("سیسمونی")) {
    return {
      id: "baby",
      departmentBadge: "🍼 دپارتمان تخصصی نوزادی و سیسمونی (۰ تا ۲۴ ماه)",
      headline: "کالکشن نوزادی و سیسمونی ارگانیک",
      tagline: "سرهمی، بادی، ست‌های بیمارستانی و پاپوش با دوخت مسطح، دکمه‌های پرسی بدون نیکل و الیاف ۱۰۰٪ پنبه",
      gradient: "from-[#241c12] via-[#1a140d] to-[#0d0a07]",
      accentBorder: "border-amber-400/45",
      accentText: "text-amber-300",
      badgeBg: "bg-amber-400/15 border-amber-400/30 text-amber-300",
      glowColor: "from-amber-400/25 via-yellow-500/15 to-transparent",
      pillActive: "bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/40 border-amber-300 font-black",
      features: [
        { icon: "🌱", title: "۱۰۰٪ نخ‌پنبه ارگانیک", desc: "الیاف تنفس‌پذیر و استاندارد بهداشتی کودک" },
        { icon: "🧸", title: "دکمه‌های بدون نیکل", desc: "تعویض آسان پوشک بدون ایجاد حساسیت پوست" },
        { icon: "🧺", title: "دوخت مسطح و بدون زبری", desc: "حداکثر راحتی و خواب آرام نوزاد" },
        { icon: "🚀", title: "بسته‌بندی ویژه سیسمونی", desc: "ارسال سریع و مناسب کادو و سیسمونی" },
      ],
      quickLinks: [
        { name: "همه نوزادی", slug: "nozad", icon: "🍼" },
        { name: "سرهمی نوزاد", slug: "sarhami-nozad", icon: "🧸" },
        { name: "بادی و لباس زیر", slug: "bodi-nozad", icon: "🤍" },
        { name: "ست بیمارستانی", slug: "set-bimarestani", icon: "🧺" },
        { name: "کلاه و پیشبند", slug: "kolah-pishband-nozad", icon: "🧢" },
        { name: "اکسسوری نوزاد", slug: "aksessori-nozad", icon: "🧸" },
      ],
    };
  }

  if (s.includes("majlesi") || n.includes("مجلسی")) {
    return {
      id: "formal",
      departmentBadge: "👑 کالکشن سلطنتی و مجلسی مینی رویال",
      headline: "کالکشن لباس مجلسی و جشن‌های کودک",
      tagline: "پیراهن‌های ژپون‌دار پرنسسی، کت و شلوارهای شیک اروپایی برای درخشش کودکان در جشن‌ها و مجالس خاص",
      gradient: "from-[#1f1912] via-[#16120d] to-[#090705]",
      accentBorder: "border-amber-400/50",
      accentText: "text-amber-300",
      badgeBg: "bg-amber-400/20 border-amber-400/40 text-amber-200",
      glowColor: "from-amber-400/30 via-yellow-600/15 to-transparent",
      pillActive: "bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 shadow-lg shadow-amber-400/40 border-amber-300 font-black",
      features: [
        { icon: "✨", title: "دوخت مزونی لوکس", desc: "آستردوزی تمام نخ ضد خارش و ایستایی فوق‌العاده" },
        { icon: "💎", title: "پرو آنلاین هوشمند", desc: "مشاهده تن‌خور پیراهن و کت روی کودک پیش از خرید" },
        { icon: "📏", title: "مشاوره رایگان سایز", desc: "بررسی دقیق دور سینه و قد برای مراسم" },
        { icon: "🚀", title: "ارسال اولویت‌دار جشن", desc: "تحویل فوری با تیپاکس برای زمان‌بندی جشن‌ها" },
      ],
      quickLinks: [
        { name: "همه لباس‌های مجلسی", slug: "majlesi", icon: "👑" },
        { name: "مجلسی دخترانه", slug: "majlesi-dokhtaraneh", icon: "✨" },
        { name: "پیراهن دخترانه", slug: "pirahan-dokhtaraneh", icon: "👗" },
        { name: "پیراهن پسرانه", slug: "pirahan-pesaraneh", icon: "🧥" },
      ],
    };
  }

  if (s.includes("madreseh") || s.includes("kapshan") || n.includes("مدرسه") || n.includes("کاپشن") || n.includes("پالتو")) {
    return {
      id: "school_winter",
      departmentBadge: "🎒 کالکشن فرم مدرسه، پاییزه و کاپشن‌های گرم",
      headline: "کالکشن لباس مدرسه، کاپشن و پاییزه",
      tagline: "فرم‌های راحت و استاندارد مدرسه، کاپشن‌های عایق حرارتی و ضدآب برای فصول سرد سال",
      gradient: "from-[#0f1f17] via-[#0b1711] to-[#070e0a]",
      accentBorder: "border-emerald-500/40",
      accentText: "text-emerald-300",
      badgeBg: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
      glowColor: "from-emerald-500/25 via-teal-500/15 to-transparent",
      pillActive: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-emerald-400 font-bold",
      features: [
        { icon: "🧣", title: "عایق حرارتی و ضدباد", desc: "گرمای مطبوع و محافظت در برابر باد و باران" },
        { icon: "🎒", title: "پارچه کتان و ترگال درجه یک", desc: "مقاوم در برابر شستشوی هر روزه مدرسه" },
        { icon: "📏", title: "آزادی کامل در حرکت", desc: "دوخت ارگونومیک برای بازی و فعالیت کلاسی" },
        { icon: "🚀", title: "ارسال سریع با تیپاکس", desc: "تحویل مطمئن با بسته‌بندی مقاوم" },
      ],
      quickLinks: [
        { name: "لباس فرم مدرسه", slug: "lebas-madreseh", icon: "🎒" },
        { name: "کاپشن و پالتو", slug: "kapshan-palto-koodak", icon: "🧣" },
        { name: "هودی و سویشرت", slug: "hoodie-sweatshirt", icon: "🧶" },
        { name: "کیف و کوله‌پشتی", slug: "kif-koodak", icon: "🎒" },
      ],
    };
  }

  // Fallback for general categories
  return {
    id: "general",
    departmentBadge: `✨ دپارتمان تخصصی ${categoryName} مینی رویال`,
    headline: `کالکشن اختصاصی پوشاک ${categoryName}`,
    tagline: `مجموعه‌ای دست‌چین و باکیفیت از شیک‌ترین مدل‌های ${categoryName} با استانداردهای بوتیک مینی رویال`,
    gradient: "from-[#1b1714] via-[#14110e] to-[#0a0807]",
    accentBorder: "border-amber-400/35",
    accentText: "text-amber-300",
    badgeBg: "bg-amber-400/15 border-amber-400/30 text-amber-300",
    glowColor: "from-amber-400/20 via-stone-700/15 to-transparent",
    pillActive: "bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/40 border-amber-300 font-black",
    features: [
      { icon: "👑", title: "اصالت و ضمانت کیفیت", desc: "تولید شده از بهترین الیاف نخ‌پنبه و ضدحساسیت" },
      { icon: "✨", title: "پرو آنلاین هوشمند", desc: "امکان تست دیجیتالی سایز بر اساس قد و وزن" },
      { icon: "📐", title: "جدول سایز استاندارد", desc: "اندازه‌گیری میلی‌متری سرشانه، آستین و قد" },
      { icon: "🚀", title: "ارسال سریع با تیپاکس", desc: "بسته‌بندی ایمن و تحویل سریع به تمام شهرها" },
    ],
    quickLinks: [
      { name: "دخترانه", slug: "dokhtaraneh", icon: "🎀" },
      { name: "پسرانه", slug: "pesaraneh", icon: "🧢" },
      { name: "نوزادی", slug: "nozad", icon: "🍼" },
      { name: "لباس مجلسی", slug: "majlesi", icon: "👑" },
      { name: "مدرسه و پاییزه", slug: "madreseh", icon: "🎒" },
    ],
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categorySlug = slug[0];
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: "دسته‌بندی یافت نشد | مینی رویال" };
  }

  const title = `خرید پوشاک ${category.name} | بوتیک آنلاین مینی رویال`;
  const description = category.description || `خرید جدیدترین مدل‌های پوشاک ${category.name} با پرو آنلاین هوشمند، جدول سایز و تضمین کیفیت و تعویض سایز.`;
  const canonicalUrl = `/category/${categorySlug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: `https://miniroyal.shop${canonicalUrl}`,
      type: "website",
      images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.imageUrl ? [category.imageUrl] : undefined,
    },
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

  const department = getDepartmentFamily(categorySlug, category.name);

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: "https://miniroyal.shop/" },
          { "@type": "ListItem", position: 2, name: "دسته‌بندی‌ها", item: "https://miniroyal.shop/shop" },
          { "@type": "ListItem", position: 3, name: category.name, item: `https://miniroyal.shop/category/${categorySlug}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `پوشاک ${category.name} | مینی رویال`,
        description: category.description || `خرید جدیدترین پوشاک ${category.name}`,
        url: `https://miniroyal.shop/category/${categorySlug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: catalogData.products.length,
          itemListElement: catalogData.products.slice(0, 16).map((prod, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://miniroyal.shop/product/${prod.slug}`,
            name: prod.title,
          })),
        },
      },
    ],
  };

  return (
    <div className="mx-auto site-container px-3 sm:px-4 py-4 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <ManagedBanners placement="category_top" />

      {/* ── بنر تخصصی و اختصاصی دپارتمان دسته ───────────────────────── */}
      <section
        aria-label={`دپارتمان تخصصی پوشاک ${category.name}`}
        className={`relative mb-8 overflow-hidden rounded-3xl sm:rounded-[2.5rem] border ${department.accentBorder} bg-gradient-to-br ${department.gradient} p-5 sm:p-8 lg:p-10 text-white shadow-2xl transition-all`}
      >
        {/* هاله نور پس‌زمینه با طیف اختصاصی این دسته */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-24 -left-24 size-80 sm:size-96 rounded-full bg-gradient-to-br ${department.glowColor} blur-3xl opacity-70`}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 size-80 sm:size-96 rounded-full bg-gradient-to-tr from-amber-500/15 to-transparent blur-3xl opacity-50"
        />

        {/* نوار مسیر خرده‌نانی درون بنر */}
        <nav
          aria-label="مسیر صفحه"
          className="relative z-10 mb-4 sm:mb-6 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-bold text-stone-300"
        >
          <Link href="/" className="hover:text-amber-300 transition">خانه</Link>
          <span className="text-stone-500">/</span>
          <Link href="/shop" className="hover:text-amber-300 transition">دسته‌بندی‌ها</Link>
          <span className="text-stone-500">/</span>
          <span className={`${department.accentText} font-black`}>{category.name}</span>
        </nav>

        {/* ردیف سربرگ دسته: آیکون استودیویی، عنوان و دکمه پرو آنلاین */}
        <div className="relative z-10 flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
            {/* جعبه آیکون شیشه‌ای با انعکاس نور */}
            <div className="grid size-16 sm:size-20 lg:size-24 shrink-0 place-items-center rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 text-3xl sm:text-4xl lg:text-5xl shadow-xl backdrop-blur-md">
              <span className="transition-transform duration-300 hover:scale-110 select-none">
                {category.icon || "👕"}
              </span>
            </div>

            <div>
              {/* بج اختصاصی دپارتمان */}
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-black backdrop-blur-md ${department.badgeBg}`}>
                <span>{department.departmentBadge}</span>
              </div>

              {/* عنوان بزرگ دسته */}
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                پوشاک {category.name}
              </h1>

              {/* توضیحات اختصاصی و متناسب با دسته */}
              <p className="mt-2 max-w-2xl text-xs leading-6 text-stone-300 sm:text-sm sm:leading-7">
                {category.description || department.tagline}
              </p>
            </div>
          </div>

          {/* اکشن‌های سریع: دکمه پرو آنلاین و دکمه راهنما */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 lg:pt-0">
            <Link
              href={`/virtual-tryon?category=${encodeURIComponent(category.slug)}`}
              className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-400/25 transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
            >
              <Sparkles className="size-4 text-stone-950" />
              <span>پرو آنلاین لباس‌های {category.name}</span>
            </Link>

            <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 sm:py-3 text-xs font-black text-stone-200 backdrop-blur-md text-center">
              <span>{toPersianDigits(catalogData.total)} مدل انتخابی</span>
            </div>
          </div>
        </div>

        {/* ── تب‌ها و زیردسته‌های سریع (Pill Navigation) ─────────────── */}
        {department.quickLinks && department.quickLinks.length > 0 && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
            <div className="mb-2 flex items-center justify-between text-xs text-stone-300">
              <span className="font-bold flex items-center gap-1.5 text-stone-200">
                <span>زیرمجموعه‌های مرتبط این دسته:</span>
              </span>
              <span className="text-[11px] text-stone-400 hidden sm:inline">برای مشاهده مدل‌ها انتخاب کنید</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {department.quickLinks.map((link) => {
                const isActive = link.slug === categorySlug;
                return (
                  <Link
                    key={link.slug}
                    href={`/category/${link.slug}`}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl sm:rounded-2xl px-3.5 py-2 text-xs transition-all backdrop-blur-md ${
                      isActive
                        ? department.pillActive
                        : "border border-white/10 bg-white/10 text-stone-200 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.name}</span>
                    {isActive && <CheckCircle2 className="size-3.5 ml-0.5 text-inherit" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ۴ نشان اختصاصی و تضمین کیفیت دپارتمان ─────────────────── */}
        <div className="relative z-10 mt-5 pt-5 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {department.features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 backdrop-blur-sm"
            >
              <span className="text-xl sm:text-2xl shrink-0 mt-0.5">{feat.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{feat.title}</p>
                <p className="text-[10px] sm:text-[11px] text-stone-300 mt-0.5 leading-snug line-clamp-2">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── بدنه اصلی: سایدبار فیلترها و گرید محصولات ────────────────── */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-4">
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
          {/* نوار وضعیت تعداد و تضمین بالای گرید */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-800">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>
                نمایش <span className="font-black text-stone-950">{toPersianDigits(catalogData.products.length)}</span> محصول در دسته‌بندی <span className="font-black text-amber-800">{category.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <Truck className="size-3.5 shrink-0" />
              <span>ارسال با تیپاکس + تعویض رایگان سایز</span>
            </div>
          </div>

          {catalogData.products.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-14 text-center shadow-xs">
              <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-amber-50 border border-amber-200 text-3xl">
                📦
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-black text-stone-900">
                محصولی با فیلترهای انتخابی در دسته‌بندی {category.name} یافت نشد!
              </h3>
              <p className="mt-2 text-xs text-stone-500 max-w-md mx-auto">
                می‌توانید فیلترها را حذف کرده یا از زیردسته‌های دیگر این کالکشن دیدن فرمایید.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/category/${categorySlug}`}
                  className="rounded-full bg-stone-950 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-800 transition"
                >
                  مشاهده همه محصولات {category.name}
                </Link>
                <Link
                  href="/shop"
                  className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                >
                  مشاهده تمام دسته‌بندی‌ها
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
              {catalogData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* راهنمای اختصاصی خرید و تضمین دپارتمان در پایین صفحه */}
          <div className="mt-12 rounded-3xl border border-stone-200/90 bg-gradient-to-l from-white via-[#fffdfa] to-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-400/20 text-amber-900 font-bold">
                <Ruler className="size-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900">
                  راهنمای خرید و انتخاب سایز پوشاک {category.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  خرید آنلاین بدون نگرانی از مغایرت سایز و کیفیت پارچه در بوتیک مینی رویال
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-stone-600">
              <div className="rounded-2xl border border-stone-100 bg-white p-4">
                <div className="flex items-center gap-2 font-black text-stone-900 mb-1.5">
                  <Sparkles className="size-4 text-amber-600" />
                  <span>پرو آنلاین سه‌بعدی</span>
                </div>
                <p>
                  عکس کودک خود را بارگذاری کنید یا قد و وزن او را وارد نمایید تا هوش مصنوعی مینی رویال بهترین سایز را به شما پیشنهاد دهد.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-100 bg-white p-4">
                <div className="flex items-center gap-2 font-black text-stone-900 mb-1.5">
                  <Shirt className="size-4 text-amber-600" />
                  <span>اصالت و لطافت پارچه</span>
                </div>
                <p>
                  کلیه البسه دسته‌بندی {category.name} دارای کنترل کیفیت دقیق دوخت، عدم پرزدهی و پارچه‌های ضد حساسیت پوست کودکان هستند.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-100 bg-white p-4">
                <div className="flex items-center gap-2 font-black text-stone-900 mb-1.5">
                  <ShieldCheck className="size-4 text-amber-600" />
                  <span>۷ روز ضمانت تعویض</span>
                </div>
                <p>
                  در صورت هرگونه مغایرت سایز، بدون هیچ دغدغه‌ای ظرف ۷ روز کاری محصول برای شما تعویض خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
