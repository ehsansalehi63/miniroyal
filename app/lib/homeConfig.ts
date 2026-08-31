import { REAL_IMAGES } from "./imageCatalog";

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
  {
    id: 1,
    title: "کالکشن تازه پاییز و زمستان",
    subtitle: "لایه‌های گرم و راحت برای استایل روزمره کودک",
    ctaText: "مشاهده کالکشن",
    ctaLink: "/shop",
    badge: "جدیدترین‌ها",
    image: REAL_IMAGES.heroWinter,
    color: "from-violet-950 via-indigo-950 to-slate-950",
  },
  {
    id: 2,
    title: "مهمانی کوچک، استایل بزرگ",
    subtitle: "لباس‌های مجلسی با تن‌خور راحت و جزئیات دوست‌داشتنی",
    ctaText: "خرید لباس مجلسی",
    ctaLink: "/category/dokhtaraneh",
    badge: "پیشنهاد استایلیست",
    image: REAL_IMAGES.heroParty,
    color: "from-rose-950 via-pink-950 to-stone-950",
  },
  {
    id: 3,
    title: "نرمی برای اولین روزها",
    subtitle: "ست‌های لطیف و کاربردی برای پوست حساس نوزاد",
    ctaText: "مشاهده نوزادی",
    ctaLink: "/category/nozad",
    badge: "انتخاب مادرها",
    image: REAL_IMAGES.heroBaby,
    color: "from-amber-950 via-stone-900 to-emerald-950",
  },
];
