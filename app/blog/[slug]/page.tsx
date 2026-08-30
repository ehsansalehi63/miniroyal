import { notFound } from "next/navigation";
import Link from "next/link";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const mockArticlesMap: Record<
  string,
  {
    title: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
    image: string;
    content: string;
  }
> = {
  "kids-size-guide-tips": {
    title: "راهنمای جامع انتخاب سایز لباس کودک بدون خطا",
    category: "راهنمای سایز",
    date: "۱ شهریور ۱۴۰۵",
    author: "تیم هوش مصنوعی مینی رویال",
    readTime: "۴ دقیقه",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop",
    content: `
خرید اینترنتی لباس برای کودکان همواره یکی از چالش‌برانگیزترین تجربه‌های والدین است. سرعت رشد بالای کودکان و تفاوت استاندارد سایزبندی در برندهای مختلف باعث می‌شود که در بیشتر موارد سایز خریده‌شده یا کوچک از آب درآید یا آن‌قدر گشاد باشد که قابل استفاده نباشد.

در این مقاله راهنمای گام به گامی آماده کرده‌ایم تا بدون اشتباه، دقیق‌ترین سایز را برای فرزندتان انتخاب کنید:

۱. بر اساس قد انتخاب کنید، نه سن!
سن تقویمی کودک تنها یک معیار تقریبی است. جثه کودکان در یک سن مشابه می‌تواند بسیار متفاوت باشد. همیشه قد (از کف پا تا بالای سر) و دور سینه مهم‌ترین شاخص تعیین سایز هستند.

۲. فرمول تعدیل وزن (Percentile):
اگر فرزند شما نسبت به قدش درشت‌تر است، همیشه یک سایز بالاتر از جدول پایه را انتخاب کنید.

۳. استفاده از ابزار پرو آنلاین مینی رویال:
با وارد کردن قد و وزن در سیستم Smart Fit مینی رویال، درصد اطمینان سایز به همراه پیشنهاد رشد آینده برای شما محاسبه می‌شود.
    `,
  },
  "best-cotton-fabrics-for-babies": {
    title: "بهترین پارچه‌های پنبه‌ای برای پوست حساس نوزاد",
    category: "جنس پارچه",
    date: "۲۵ مرداد ۱۴۰۵",
    author: "کارشناس نساجی مینی رویال",
    readTime: "۵ دقیقه",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop",
    content: `
پوست نوزادان تا ۵ برابر نازک‌تر و حساس‌تر از پوست بزرگسالان است. انتخاب پارچه نا‌مناسب می‌تواند به خارش، قرمزی و اگزمای نوزادی منجر شود.

بهترین بافت‌های پیشنهادی:
- پنبه ۱۰۰٪ ارگانیک خام بدون کلر
- پارچه اینترلاک دوطرفه نرم
- پارچه وال نخی برای تابستان

در مینی رویال کلیه محصولات نوزادی دارای گواهینامه سلامت بافت هستند.
    `,
  },
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = mockArticlesMap[slug];

  if (!article) {
    return { title: "مقاله یافت نشد | مینی رویال" };
  }

  return {
    title: `${article.title} | مجله مینی رویال`,
    description: article.content.substring(0, 150),
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = mockArticlesMap[slug];

  if (!article) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    image: article.image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "مینی رویال",
    },
    datePublished: "2026-08-25",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
          <Link href="/" className="hover:text-violet-700">خانه</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-violet-700">مجله</Link>
          <span>/</span>
          <span className="text-stone-900 font-bold">{article.title}</span>
        </nav>

        <span className="rounded-full bg-violet-100 px-3.5 py-1 text-xs font-bold text-violet-800">
          {article.category}
        </span>
        <h1 className="mt-3 text-3xl font-black text-stone-900 sm:text-4xl leading-tight">
          {article.title}
        </h1>

        <div className="mt-4 flex items-center justify-between border-b border-stone-100 pb-4 text-xs font-semibold text-stone-500">
          <span>نویسنده: {article.author}</span>
          <span>تاریخ انتشار: {article.date} | زمان مطالعه: {article.readTime}</span>
        </div>

        <div className="mt-6 aspect-video overflow-hidden rounded-3xl bg-stone-100 shadow-md">
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
        </div>

        <div className="prose prose-stone mt-8 max-w-none text-sm leading-8 text-stone-800 whitespace-pre-line">
          {article.content}
        </div>
      </article>
    </>
  );
}
