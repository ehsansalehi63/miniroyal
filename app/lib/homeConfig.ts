import { REAL_IMAGES, THUMB_IMAGES } from "./imageCatalog";

export interface HomeSlide {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
  image: string;
  /** نسخهٔ سبک همان تصویر — برای بازتاب کف و مواردی که کیفیت کامل لازم نیست */
  thumb: string;
  /** Tailwind gradient classes for the slide backdrop */
  color: string;
  /** Radial glow accent used behind the 3D model */
  glow: string;
  /** Palette for floating particles: [from, to] hex colors */
  particles: [string, string];
}

export const DEFAULT_HOME_SLIDES: HomeSlide[] = [
  {
    id: 1,
    title: "استایل امضادار برای هر روز",
    subtitle: "پوشاک و اکسسوری کودک و نوجوان؛ از لباس‌های روزمره تا لایه‌های خاص فصل، با انتخاب سایز دقیق.",
    ctaText: "کشف کالکشن",
    ctaLink: "/shop",
    badge: "جدیدترین‌ها",
    image: REAL_IMAGES.heroWinter,
    thumb: THUMB_IMAGES.heroWinter,
    color: "from-violet-950 via-indigo-950 to-slate-950",
    glow: "#8b5cf6",
    particles: ["#c4b5fd", "#fbbf24"],
  },
  {
    id: 2,
    title: "جزئیات کوچک، استایل بزرگ",
    subtitle: "لباس‌های مجلسی، اکسسوری‌های هماهنگ و ست‌های چشم‌نواز برای لحظه‌هایی که ماندگار می‌شوند.",
    ctaText: "خرید استایل مجلسی",
    ctaLink: "/category/majlesi",
    badge: "پیشنهاد استایلیست",
    image: REAL_IMAGES.heroParty,
    thumb: THUMB_IMAGES.heroParty,
    color: "from-rose-950 via-pink-950 to-stone-950",
    glow: "#f472b6",
    particles: ["#f9a8d4", "#fda4af"],
  },
  {
    id: 3,
    title: "از نوزادی تا نوجوانی",
    subtitle: "پارچه‌های لطیف، فرم‌های راحت و انتخاب‌های کامل برای کمدی که با کودک رشد می‌کند.",
    ctaText: "دیدن مجموعه کامل",
    ctaLink: "/category/nozad",
    badge: "انتخاب مادرها",
    image: REAL_IMAGES.heroBaby,
    thumb: THUMB_IMAGES.heroBaby,
    color: "from-amber-950 via-stone-900 to-emerald-950",
    glow: "#34d399",
    particles: ["#a7f3d0", "#fcd34d"],
  },
];
