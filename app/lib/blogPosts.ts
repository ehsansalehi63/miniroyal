/**
 * فهرست مقالات مجلهٔ مینی رویال
 *
 * در یک فایل مشترک نگهداری می‌شود تا هم صفحهٔ بلاگ و هم بخش «مجلهٔ استایل»
 * در صفحهٔ اصلی از یک منبع بخوانند و عنوان‌ها هیچ‌وقت واگرا نشوند.
 */
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "راهنمای جامع انتخاب سایز لباس کودک بدون خطا",
    slug: "kids-size-guide-tips",
    category: "راهنمای سایز",
    summary: "چگونه قد، وزن و سن کودک را اندازه‌گیری کنیم تا هیچ‌وقت سایز اشتباه نخریم؟ راهنمای سانتی‌متری گام به گام.",
    date: "۱ شهریور ۱۴۰۵",
    author: "تیم هوش مصنوعی مینی رویال",
    readTime: "۴ دقیقه",
    image: "/images/models/hero-girl.svg",
  },
  {
    id: 2,
    title: "بهترین پارچه‌های پنبه‌ای برای پوست حساس نوزاد",
    slug: "best-cotton-fabrics-for-babies",
    category: "جنس پارچه",
    summary: "بررسی کامل پارچه‌های اینترلاک، دورس، وال نخی و پنبه ارگانیک خام. کدام پارچه مانع خارش پوست نوزاد می‌شود؟",
    date: "۲۵ مرداد ۱۴۰۵",
    author: "کارشناس نساجی مینی رویال",
    readTime: "۵ دقیقه",
    image: "/images/models/hero-baby.svg",
  },
  {
    id: 3,
    title: "ترندهای لباس کودک و نوجوان در پاییز و زمستان",
    slug: "kids-fashion-trends-autumn",
    category: "استایل کودک",
    summary: "بررسی محبوب‌ترین رنگ‌ها، هودی‌های اورسایز و ست‌های خانوادگی برای فصل سرما.",
    date: "۲۰ مرداد ۱۴۰۵",
    author: "تیم استایل مینی رویال",
    readTime: "۳ دقیقه",
    image: "/images/models/hero-boy.svg",
  },
  {
    id: 4,
    title: "روش‌های شست‌وشو و افزایش عمر لباس‌های کودک",
    slug: "washing-kids-clothing-guide",
    category: "مراقبت از لباس",
    summary: "نکات کلیدی برای ثبات رنگ، عدم آبرفتگی و جلوگیری از پرز دادن پارچه دورس و کتان.",
    date: "۱۵ مرداد ۱۴۰۵",
    author: "تیم کیفیت مینی رویال",
    readTime: "۴ دقیقه",
    image: "/images/models/hero-girl.svg",
  },
];
