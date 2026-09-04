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
    video?: string;
    content: string;
  }
> = {
  "kids-size-guide-tips": {
    title: "راهنمای جامع انتخاب سایز لباس کودک بدون خطا",
    category: "راهنمای سایز",
    date: "۱ شهریور ۱۴۰۵",
    author: "تیم هوش مصنوعی مینی رویال",
    readTime: "۴ دقیقه",
    image: "/images/models/hero-girl.svg",
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
    image: "/images/models/hero-baby.svg",
    content: `
پوست نوزادان تا ۵ برابر نازک‌تر و حساس‌تر از پوست بزرگسالان است. انتخاب پارچه نا‌مناسب می‌تواند به خارش، قرمزی و اگزمای نوزادی منجر شود.

بهترین بافت‌های پیشنهادی:
- پنبه ۱۰۰٪ ارگانیک خام بدون کلر
- پارچه اینترلاک دوطرفه نرم
- پارچه وال نخی برای تابستان

در مینی رویال کلیه محصولات نوزادی دارای گواهینامه سلامت بافت هستند.
    `,
  },
  "kids-fashion-trends-autumn": {
    title: "ترندهای لباس کودک و نوجوان در پاییز و زمستان",
    category: "استایل کودک",
    date: "۲۰ مرداد ۱۴۰۵",
    author: "تیم استایل مینی رویال",
    readTime: "۳ دقیقه",
    image: "/images/models/hero-boy.svg",
    content: `
فصل پاییز و زمستان فرصت خوبی برای ساختن استایل‌های گرم، راحت و کاربردی برای کودکان و نوجوانان است. امسال رنگ‌های خاکی، زیتونی، سرمه‌ای و زرشکی در کنار پارچه‌های نرم و لایه‌های سبک محبوبیت بیشتری دارند.

هودی و سویشرت را می‌توان با شلوار راحتی یا جین هماهنگ کرد و برای روزهای سردتر، یک کاپشن سبک روی آن پوشید. انتخاب لباس‌های قابل لایه‌پوشی باعث می‌شود کودک در فضای داخل و بیرون احساس راحتی داشته باشد.

برای انتخاب سایز، قد و اندازه‌های واقعی کودک را با راهنمای همان محصول مقایسه کنید و در صورت تردید، از بخش پرو آنلاین کمک بگیرید.
    `,
  },
  "washing-kids-clothing-guide": {
    title: "روش‌های شست‌وشو و افزایش عمر لباس‌های کودک",
    category: "مراقبت از لباس",
    date: "۱۵ مرداد ۱۴۰۵",
    author: "تیم کیفیت مینی رویال",
    readTime: "۴ دقیقه",
    image: "/images/models/hero-girl.svg",
    content: `
برای افزایش عمر لباس کودک، همیشه برچسب شست‌وشو را بررسی کنید و لباس‌های رنگی و سفید را جداگانه بشویید. آب ولرم و شوینده ملایم معمولاً برای بیشتر لباس‌های کودک انتخاب مناسب‌تری است.

لباس‌های نخی و دورس را با دور ملایم ماشین لباس‌شویی بشویید و برای جلوگیری از آبرفتگی، از خشک‌کن با حرارت بالا استفاده نکنید. لباس را پس از شست‌وشو در سایه و دور از نور مستقیم خشک کنید تا رنگ آن پایدارتر بماند.

لکه‌ها را هرچه سریع‌تر و بدون ساییدن شدید پاک کنید تا بافت پارچه آسیب نبیند.
    `,
  },
  "kids-style-signature-everyday": {
    title: "استایل امضادار برای هر روز؛ انتخابی با عشق برای کوچولوی شما",
    category: "استایل کودک",
    date: "۱۳ شهریور ۱۴۰۵",
    author: "تیم استایل مینی رویال",
    readTime: "۴ دقیقه",
    image: "/images/hero-poster.webp",
    video: "/video/hero.mp4",
    content: `
لباس کودک فقط بخشی از کمد نیست؛ همراه لحظه‌های بازی، خنده، مهمانی، مدرسه و خاطره‌های شیرین کودکی است. در مینی رویال تلاش کرده‌ایم انتخاب لباس کودک و نوجوان را برای خانواده‌ها ساده‌تر، دقیق‌تر و لذت‌بخش‌تر کنیم؛ از لباس‌های لطیف نوزادی تا استایل‌های شیک دخترانه و پسرانه برای نوجوانان.

در فروشگاه مینی رویال می‌توانید مجموعه‌ای متنوع از پوشاک و اکسسوری کودک و نوجوان را ببینید؛ محصولاتی برای استفاده روزمره، مهمانی، فصل سرما، مدرسه و ساختن ست‌های هماهنگ. دسته‌بندی‌های سایت از نوزاد و سیسمونی تا لباس دخترانه، لباس پسرانه، کاپشن و پالتو، لباس مدرسه، کفش و اکسسوری طراحی شده‌اند تا رسیدن به انتخاب مناسب، بدون جست‌وجوی طولانی انجام شود.

یکی از دغدغه‌های مهم هنگام خرید اینترنتی لباس کودک، انتخاب سایز مناسب است. سن به‌تنهایی همیشه معیار دقیقی نیست؛ به همین دلیل در مینی رویال می‌توانید از پرو آنلاین سایز و جدول سایز سانتی‌متری استفاده کنید. کافی است اندازه‌های واقعی کودک و راهنمای هر لباس را بررسی کنید تا انتخاب شما با اطمینان بیشتری انجام شود.

در مینی رویال، از لباس‌های نوزادی و ست‌های سیسمونی تا لباس‌های دخترانه و پسرانه ۲ تا ۱۴ سال، انتخاب‌های مختلفی در دسترس است. برای روزهای خنک می‌توانید سراغ هودی، سویشرت، ژاکت، کاپشن و پالتو بروید؛ برای مهمانی‌ها، لباس‌های مجلسی و سارافون‌های دخترانه را بررسی کنید؛ و برای استفاده روزمره، ست‌های راحت و کاربردی کودک و نوجوان را ببینید.

ارسال سریع سراسری، مشاوره خرید و سایز، و ضمانت ۷ روزه تعویض نیز برای این طراحی شده‌اند که خرید لباس کودک آنلاین با آرامش بیشتری انجام شود. اگر درباره سایز یا انتخاب محصول مطمئن نیستید، می‌توانید پیش از خرید از مشاوره مینی رویال استفاده کنید.

از اولین لباس‌های نوزادی تا استایل‌های نوجوانی، هر مرحله از رشد کودک داستان و نیاز خودش را دارد. کشف کالکشن مینی رویال را شروع کنید و اگر درباره سایز تردید دارید، از پرو آنلاین سایز کمک بگیرید؛ چون کوچولوی شما شایسته لباسی است که هم زیبا باشد، هم راحت و هم متناسب با دنیای پرتحرک او.
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
          {article.video ? (
            <video className="h-full w-full object-cover" controls playsInline preload="metadata" poster={article.image}>
              <source src={article.video} type="video/mp4" />
            </video>
          ) : (
            <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="prose prose-stone mt-8 max-w-none text-sm leading-8 text-stone-800 whitespace-pre-line">
          {article.content}
        </div>
      </article>
    </>
  );
}
