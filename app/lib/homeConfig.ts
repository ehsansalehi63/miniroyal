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
    title: "کالکشن نوزادی؛ لطافت ارگانیک (۰ تا ۲ سال)",
    subtitle: "سرهمی‌های بافت کشمیری و پشم مرینوس ارگانیک ضدحساسیت با استایل آرام مزون‌های پاریس.",
    ctaText: "مشاهده کالکشن نوزادی",
    ctaLink: "/category/nozad",
    badge: "نوزادی و سیسمونی (۰-۲ سال)",
    image: "/images/hero/hero-baby.jpg",
    thumb: "/images/hero/hero-baby.jpg",
    color: "from-stone-950 via-amber-950/70 to-stone-900",
    glow: "#d97706",
    particles: ["#fef3c7", "#f59e0b"],
  },
  {
    id: 2,
    title: "استایل اروپایی خردسال و کودک (۲ تا ۸ سال)",
    subtitle: "کت‌های کلاسیک بارانی میلان، دامن‌های تارتان و پیراهن‌های خوش‌دوخت برای بازی و روزمره شیک.",
    ctaText: "مشاهده کالکشن کودک",
    ctaLink: "/category/dokhtarane",
    badge: "کودک و خردسال (۲-۸ سال)",
    image: "/images/hero/hero-kids.jpg",
    thumb: "/images/hero/hero-kids.jpg",
    color: "from-amber-950/80 via-stone-950 to-stone-900",
    glow: "#b45309",
    particles: ["#fed7aa", "#d97706"],
  },
  {
    id: 3,
    title: "پوشاک مهمانی و جشن‌های اشرافی (۴ تا ۱۲ سال)",
    subtitle: "پیراهن‌های توری مزون‌دوز و کت‌وشلوارهای مخمل اشرافی دست‌دوز با پرو آنلاین هوشمند سایز.",
    ctaText: "کالکشن مجلسی و جشن",
    ctaLink: "/category/majlesi",
    badge: "لباس جشن و مجلس",
    image: "/images/hero/hero-party.jpg",
    thumb: "/images/hero/hero-party.jpg",
    color: "from-stone-950 via-stone-900 to-amber-950/60",
    glow: "#f59e0b",
    particles: ["#fef08a", "#ca8a04"],
  },
  {
    id: 4,
    title: "کالکشن نوجوان و تینیجر (۱۲ تا ۱۶ سال)",
    subtitle: "ترکیب استایل مدرن خیابان‌های پاریس با کژوال فاخر؛ هودی، پلیورهای اورسایز و شلوارهای آیکونیک.",
    ctaText: "کالکشن نوجوان (۱۲-۱۶ سال)",
    ctaLink: "/category/nojavanan",
    badge: "نوجوان (۱۲-۱۶ سال)",
    image: "/images/hero/hero-teen.jpg",
    thumb: "/images/hero/hero-teen.jpg",
    color: "from-stone-950 via-zinc-900 to-stone-900",
    glow: "#78716c",
    particles: ["#e7e5e4", "#d6d3d1"],
  },
];
