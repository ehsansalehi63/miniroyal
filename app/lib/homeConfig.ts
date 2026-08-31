export interface HomeSlide {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
  image: string;
  color: string;
}

export const DEFAULT_HOME_SLIDES: HomeSlide[] = [
  { id: 1, title: "مجموعه جدید پاییز و زمستان", subtitle: "لباس‌های گرم و راحت برای روزهای سرد", ctaText: "مشاهده کالکشن", ctaLink: "/shop", badge: "جدیدترین‌ها", image: "/images/products/hero-slide1.svg", color: "from-violet-900 via-indigo-950 to-slate-950" },
  { id: 2, title: "لباس‌های مجلسی دخترانه", subtitle: "طراحی شیک با تن‌خور راحت و پارچه باکیفیت", ctaText: "خرید لباس مجلسی", ctaLink: "/category/dokhtaraneh", badge: "پیشنهاد ویژه", image: "/images/products/hero-slide2.svg", color: "from-rose-900 via-pink-950 to-stone-950" },
  { id: 3, title: "ست‌های لطیف نوزادی", subtitle: "الیاف نرم و مناسب پوست حساس نوزاد", ctaText: "مشاهده نوزادی", ctaLink: "/category/nozad", badge: "ارگانیک", image: "/images/products/hero-slide3.svg", color: "from-amber-950 via-stone-900 to-emerald-950" },
];
