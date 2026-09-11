"use client";

import { useEffect, useState } from "react";
import {
  Award,
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileCheck2,
  FileText,
  Film,
  Languages,
  Layers,
  Globe2,
  GraduationCap,
  Headset,
  MapPin,
  Menu,
  MessageSquareText,
  MonitorSmartphone,
  Palette,
  Printer,
  QrCode,
  Rocket,
  ScanSearch,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tractor,
  TrendingUp,
  Users,
  Video,
  View,
  Wrench,
  X,
  Zap,
} from "lucide-react";

/* ── داده‌ها ─────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#executive", label: "چکیده مدیریتی" },
  { href: "#gap", label: "ضرورت بازطراحی" },
  { href: "#demo", label: "دموی طراحی" },
  { href: "#sitemap", label: "نقشه سایت" },
  { href: "#features", label: "امکانات پورتال" },
  { href: "#compare", label: "مزیت رقابتی" },
  { href: "#i18n-seo", label: "چهارزبانه و سئو" },
  { href: "#timeline", label: "زمان‌بندی" },
  { href: "#security", label: "امنیت و عملکرد" },
  { href: "#next", label: "گام بعدی" },
];

const HERO_STATS = [
  { value: "۴۰+", label: "سال سابقه تولید", icon: Award },
  { value: "۵۰٬۰۰۰+", label: "دستگاه تولیدشده", icon: Tractor },
  { value: "۴", label: "زبانه رسمی پورتال", icon: Languages },
  { value: "۸", label: "هفته تا لانچ جهانی", icon: Rocket },
];

const CURRENT_PAIN_POINTS = [
  {
    icon: MonitorSmartphone,
    title: "طراحی قدیمی و غیرریسپانسیو",
    text: "ظاهر قدیمی سایت، شأن برند ۴۰ ساله را منتقل نمی‌کند و در موبایل — که بیش از ۷۰٪ ترافیک از آن می‌آید — تجربه ضعیفی می‌سازد.",
  },
  {
    icon: Zap,
    title: "سرعت لود پایین",
    text: "نبود فشرده‌سازی تصاویر و بهینه‌سازی، نرخ پرش را بالا برده و مستقیماً رتبه گوگل و نرخ تبدیل را تخریب می‌کند.",
  },
  {
    icon: Search,
    title: "سئوی ضعیف و ناقص",
    text: "بدون متا دیسکریپشن، بدون اسکیما، alt ناقص تصاویر و عدم اتصال به Search Console و Analytics؛ یعنی نامرئی بودن در گوگل.",
  },
  {
    icon: Boxes,
    title: "صفحه محصولات بدون مشخصات فنی",
    text: "بدون دسته‌بندی حرفه‌ای، بدون جدول مشخصات فنی، بدون ویدئو و بدون دانلود کاتالوگ PDF؛ مشتری برای جزئیات مجبور به تماس است.",
  },
  {
    icon: FileText,
    title: "فقدان ابزار فروش آنلاین",
    text: "بدون استعلام قیمت و پیش‌فاکتور آنلاین؛ فرایندی که رقبا خودکار کرده‌اند هنوز در دلتادشت دستی و تلفنی انجام می‌شود.",
  },
  {
    icon: Languages,
    title: "نسخه چندزبانه ناقص",
    text: "ظرفیت صادراتی به عراق، اقلیم کردستان و حاشیه خلیج فارس وجود دارد اما سایت چندزبانه استاندارد با RTL/LTR درست ندارد.",
  },
];

const COMPETITOR_MOVES = [
  { name: "کشت گستر آذربایجان", move: "استعلام قیمت و پیش‌فاکتور آنلاین فعال", level: "برتری فروش" },
  { name: "پارس کاوه", move: "مشاوره انتخاب دستگاه + خرید آنلاین قطعات", level: "برتری خدمات" },
  { name: "فامکو", move: "پرداخت اقساطی و شرایط فروش منعطف", level: "برتری پرداخت" },
  { name: "Hardi دانمارک", move: "کاتالوگ سه‌بعدی قطعات و پیکربندی آنلاین", level: "استاندارد جهانی" },
  { name: "Amazone آلمان", move: "ویدئوی عملکرد مزرعه + دیتاشیت کامل هر مدل", level: "استاندارد جهانی" },
  { name: "John Deere آمریکا", move: "شبکه نمایندگی دیجیتال و اصالت‌سنجی قطعه", level: "استاندارد جهانی" },
];

const PRODUCT_CATEGORIES = [
  { name: "سمپاش‌های توربولاینر", desc: "کششی و سوارشونده باغی", count: "۱۲ مدل", icon: Tractor },
  { name: "سمپاش‌های زراعی", desc: "بوم‌دار مزرعه‌ای", count: "۸ مدل", icon: ScanSearch },
  { name: "ادوات خاک‌ورزی", desc: "گاوآهن، دیسک و رتیواتور", count: "۱۵ مدل", icon: Layers },
  { name: "کودپاش و بذرکار", desc: "دقیق‌کار و خطی‌کار", count: "۹ مدل", icon: Boxes },
  { name: "تریلر و تانکر", desc: "کشاورزی و آب‌رسان", count: "۶ مدل", icon: ShoppingCart },
  { name: "قطعات یدکی اصلی", desc: "نازل، پمپ و فیلتر", count: "۲۰۰+ قلم", icon: Wrench },
];

const SITEMAP = [
  {
    title: "صفحه اصلی سینمایی",
    pages: ["هیرو توربولاینر + ویدئو", "دسته‌بندی محصولات", "شمارنده‌های اعتماد", "آخرین اخبار و نمایشگاه‌ها"],
  },
  {
    title: "کاتالوگ محصولات",
    pages: ["فیلتر چندبعدی هوشمند", "صفحه محصول + مشخصات فنی", "گالری ۳۶۰ درجه و ویدئو", "دانلود کاتالوگ PDF"],
  },
  {
    title: "فروش و خدمات B2B",
    pages: ["کانفیگوراتور + پیش‌فاکتور آنی", "مشاور هوشمند انتخاب دستگاه", "استعلام قطعات یدکی", "اصالت‌سنجی گارانتی"],
  },
  {
    title: "شبکه و شرکت",
    pages: ["نقشه تعاملی نمایندگی‌ها", "پرتال نمایندگان (ورود)", "درباره ما + کارخانه", "تماس + فرم CRM"],
  },
];

const FEATURES = [
  {
    icon: Settings2,
    tag: "کاتالوگ هوشمند",
    title: "Smart Catalog با فیلتر چندبعدی",
    text: "فیلتر بر اساس نوع دستگاه، توان تراکتور (اسب بخار)، ظرفیت مخزن، عرض کار و نوع اتصال؛ هر محصول با جدول مشخصات فنی کامل، ویدئوی عملکرد در مزرعه، گالری ۳۶۰ درجه و دکمه دانلود کاتالوگ PDF اختصاصی همان مدل.",
    bullets: ["مشخصات فنی استاندارد + مقایسه مدل‌ها", "گالری ۳۶۰ درجه و هات‌اسپات قطعات", "ویدئوی تست مزرعه‌ای هر دستگاه"],
    accent: "emerald",
  },
  {
    icon: FileCheck2,
    tag: "موتور پیش‌فاکتور آنی",
    title: "Instant Quotation Engine",
    text: "مشتری دستگاه را پیکربندی می‌کند (مدل، آپشن‌ها، تعداد)، حدود قیمت را می‌بیند و در کمتر از ۶۰ ثانیه یک پیش‌فاکتور PDF رسمی با سربرگ دلتادشت، مهر دیجیتال و QR Code اعتبارسنجی دریافت می‌کند.",
    bullets: ["PDF رسمی با QR اعتبارسنجی", "اتصال خودکار به CRM و پیامک", "پنل پیگیری استعلام‌ها برای فروش"],
    accent: "amber",
  },
  {
    icon: BrainCircuit,
    tag: "هوش انتخاب دستگاه",
    title: "Smart Product Advisor",
    text: "ویزارد ۴ مرحله‌ای: نوع کشت، هکتار زمین، توان تراکتور و بودجه. موتور پیشنهادگر بر اساس دیتابیس فنی، مناسب‌ترین مدل‌ها را با دلیل فنی رتبه‌بندی و پیشنهاد می‌دهد؛ دقیقاً ابزار مشاوره‌ای که پارس کاوه دارد — اما بهتر و فارسی.",
    bullets: ["پیشنهاد مدل بر اساس توان و هکتار", "مقایسه جانبی ۳ مدل پیشنهادی", "اتصال مستقیم به درخواست پیش‌فاکتور"],
    accent: "emerald",
  },
  {
    icon: Users,
    tag: "شبکه نمایندگان",
    title: "Dealer Network Portal",
    text: "پنل اختصاصی نمایندگان در ایران، عراق و اقلیم کردستان: ثبت سفارش عمده، استعلام موجودی قطعات، مشاهده قیمت همکاری، دانلود متریال تبلیغاتی و پیگیری وضعیت ارسال — با سطح دسترسی چندنقشی.",
    bullets: ["قیمت همکاری و ثبت سفارش عمده", "استعلام لحظه‌ای موجودی قطعات", "نقشه عمومی «نمایندگی نزدیک من»"],
    accent: "amber",
  },
  {
    icon: BadgeCheck,
    tag: "اعتماد و اصالت",
    title: "اصالت‌سنجی گارانتی با شماره شاسی",
    text: "خریدار شماره شاسی دستگاه را وارد می‌کند و وضعیت گارانتی، تاریخ تولید و اصالت دستگاه را استعلام می‌گیرد؛ هم ضدجعل، هم بانک اطلاعاتی ارزشمند از دستگاه‌های فعال در مزارع کشور.",
    bullets: ["استعلام آنی با شماره شاسی", "ثبت درخواست خدمات پس از فروش", "بانک داده نصب‌شده‌ها برای بازاریابی"],
    accent: "emerald",
  },
  {
    icon: Boxes,
    tag: "بانک قطعات",
    title: "کاتالوگ انفجاری قطعات (Exploded View)",
    text: "نمای سه‌بعدی انفجاری هر دستگاه با شماره فنی قطعات؛ کشاورز روی قطعه کلیک می‌کند، قیمت و موجودی را می‌بیند و مستقیم سفارش می‌دهد — قابلیتی در سطح Hardi و Amazone که هیچ رقیب داخلی ندارد.",
    bullets: ["نمای انفجاری تعاملی هر مدل", "شماره فنی + قیمت + موجودی", "سفارش مستقیم قطعه از روی نقشه"],
    accent: "amber",
  },
];

const COMPARE_ROWS = [
  { feature: "طراحی مدرن و سینمایی بر پایه هویت برند", delta: 3, domestic: 1, foreign: 3 },
  { feature: "استعلام قیمت و پیش‌فاکتور آنلاین (آنی + QR)", delta: 3, domestic: 1, foreign: 2 },
  { feature: "مشخصات فنی کامل + کاتالوگ PDF هر محصول", delta: 3, domestic: 1, foreign: 3 },
  { feature: "گالری ۳۶۰ درجه و ویدئوی عملکرد مزرعه", delta: 3, domestic: 0, foreign: 1 },
  { feature: "مشاور هوشمند انتخاب دستگاه (توان/هکتار)", delta: 3, domestic: 1, foreign: 2 },
  { feature: "کاتالوگ انفجاری قطعات + سفارش آنلاین قطعه", delta: 3, domestic: 0, foreign: 2 },
  { feature: "چهارزبانه واقعی (FA/EN/AR/KU) با RTL استاندارد", delta: 3, domestic: 1, foreign: 2 },
  { feature: "اصالت‌سنجی گارانتی با شماره شاسی", delta: 3, domestic: 0, foreign: 3 },
  { feature: "پرتال نمایندگان B2B با قیمت همکاری", delta: 3, domestic: 1, foreign: 3 },
  { feature: "سئو تکنیکال + Core Web Vitals استاندارد جهانی", delta: 3, domestic: 0, foreign: 3 },
];

const TIMELINE = [
  {
    phase: "فاز ۱",
    weeks: "هفته ۱–۲",
    title: "معماری، وایرفریم و هویت بصری",
    color: "emerald",
    items: ["معماری اطلاعات و نقشه نهایی سایت", "وایرفریم کامل + پروتوتایپ فیگما", "تأیید هویت بصری و دموی هیرو"],
  },
  {
    phase: "فاز ۲",
    weeks: "هفته ۳–۴",
    title: "توسعه فرانت‌اند و چندزبانه",
    color: "amber",
    items: ["کدنویسی اختصاصی با انیمیشن تعاملی", "ماژول ۴ زبانه با RTL/LTR خودکار", "کاتالوگ محصولات + فیلتر هوشمند"],
  },
  {
    phase: "فاز ۳",
    weeks: "هفته ۵–۶",
    title: "موتور فروش B2B و پرتال‌ها",
    color: "emerald",
    items: ["کانفیگوراتور + پیش‌فاکتور PDF", "بانک قطعات + نمای انفجاری", "پرتال نمایندگان + اتصال CRM/پیامک"],
  },
  {
    phase: "فاز ۴",
    weeks: "هفته ۷",
    title: "محتوا، سئو و امنیت",
    color: "amber",
    items: ["بارگذاری ۵۰+ محصول و مدیا", "اسکیما، hreflang و Core Web Vitals", "تست نفوذ و هاردنینگ امنیتی"],
  },
  {
    phase: "فاز ۵",
    weeks: "هفته ۸",
    title: "تست نهایی و لانچ جهانی",
    color: "emerald",
    items: ["تست استرس و چندمرورگری", "آموزش تیم دلتادشت + مستندات", "انتشار رسمی + جشن لانچ 🎉"],
  },
];

const SEO_ITEMS = [
  { icon: FileText, title: "اسکیمای کامل", text: "Product، Organization، FAQPage و Breadcrumb برای ریچ‌اسنیپت گوگل" },
  { icon: Globe2, title: "hreflang چهارزبانه", text: "سیگنال صحیح زبان/منطقه برای fa، en، ar و ku" },
  { icon: Zap, title: "LCP زیر ۱٫۵ ثانیه", text: "PageSpeed بالای ۹۰ در موبایل و دسکتاپ" },
  { icon: BarChart3, title: "Analytics + Search Console", text: "اتصال کامل + داشبورد KPI ماهانه" },
  { icon: TrendingUp, title: "+۳۰٪ ترافیک ارگانیک", text: "هدف سال اول با تقویم محتوای صنعتی" },
  { icon: ShoppingCart, title: "+۱۵٪ نرخ تبدیل", text: "هدف ۶ ماهه با قیف پیش‌فاکتور آنلاین" },
];

const SECURITY_ITEMS = [
  "گواهی SSL و هاردنینگ کامل سرور",
  "تست نفوذ پیش از لانچ + WAF",
  "بکاپ خودکار روزانه + هفتگی",
  "فرم‌های ضداسپم با اعتبارسنجی سمت سرور",
  "نقش‌بندی دسترسی پنل مدیریت",
  "مانیتورینگ آپتایم ۲۴/۷ پس از لانچ",
  "بهینه‌سازی تصاویر WebP/AVIF خودکار",
  "کش چندلایه + CDN برای سرعت جهانی",
];

const MEDIA_NEEDS = [
  { icon: Film, title: "تصاویر کارخانه و خط تولید", text: "حداقل ۲۰ فریم حرفه‌ای از سالن‌ها، مونتاژ و انبار" },
  { icon: Tractor, title: "عکس استودیویی محصولات", text: "هر مدل از ۴ زاویه + نمای ۳۶۰ برای گالری" },
  { icon: Video, title: "ویدئوی عملکرد مزرعه‌ای", text: "۲ تا ۵ دقیقه تست واقعی هر خانواده محصول" },
  { icon: FileText, title: "کاتالوگ‌های فنی فعلی", text: "دیتاشیت‌ها، جداول مشخصات و دفترچه‌ها (PDF/Excel)" },
  { icon: Award, title: "گواهینامه‌ها و افتخارات", text: "اسکن باکیفیت گواهی مکانیزاسیون و تقدیرنامه‌ها" },
  { icon: MapPin, title: "فهرست نمایندگی‌ها", text: "نام، شهر، تلفن و مختصات نقشه هر نماینده" },
];

const FAQS = [
  {
    q: "چرا ۸ هفته؟ آیا کیفیت فدای سرعت نمی‌شود؟",
    a: "خیر. زمان‌بندی فشرده با موازی‌سازی فازهاست: هم‌زمان با توسعه فرانت‌اند، بانک محتوای محصولات آماده می‌شود و موتور پیش‌فاکتور روی API مستقل توسعه می‌یابد. خروجی هر فاز قابل تحویل و تست است و در پایان هفته ۸، محصول کامل و تست‌شده لانچ می‌شود.",
  },
  {
    q: "پیش‌فاکتور آنلاین دقیقاً چه چیزی صادر می‌کند؟",
    a: "یک PDF رسمی با سربرگ دلتادشت شامل مشخصات پیکربندی‌شده دستگاه، آپشن‌ها، قیمت حدودی، شرایط پرداخت، مهر دیجیتال و QR Code یکتا که اصالت و اعتبار آن در سایت قابل استعلام است.",
  },
  {
    q: "نسخه کردی و عربی چه مزیتی برای صادرات دارد؟",
    a: "بازار عراق و اقلیم کردستان یکی از بزرگ‌ترین بازارهای هدف ادوات ایرانی است. نسخه عربی و کردی سورانی با محتوای بومی‌سازی‌شده (نه ترجمه ماشینی) نرخ تبدیل بازدیدکننده منطقه را چند برابر می‌کند و در سئوی محلی آن کشورها رتبه می‌گیرد.",
  },
  {
    q: "بعد از لانچ چه پشتیبانی داریم؟",
    a: "آموزش کامل تیم دلتادشت (مدیریت محصولات، پیگیری استعلام‌ها، انتشار خبر)، مستندات تصویری، دوره تضمین رفع باگ، مانیتورینگ آپتایم و بسته نگهداری ماهانه اختیاری برای توسعه مستمر.",
  },
];

/* ── کامپوننت‌های کوچک ─────────────────────────────────────── */

function SectionHeading({
  kicker,
  title,
  desc,
  light,
}: {
  kicker: string;
  title: string;
  desc?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black tracking-wide ${
          light
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
            : "border-emerald-700/30 bg-emerald-50 text-emerald-800"
        }`}
      >
        <Sparkles className="size-3.5" />
        {kicker}
      </p>
      <h2
        className={`mt-4 text-2xl font-black leading-10 sm:text-3xl sm:leading-[3.2rem] ${
          light ? "text-white" : "text-stone-950"
        }`}
      >
        {title}
      </h2>
      {desc ? (
        <p className={`mt-3 text-sm leading-8 ${light ? "text-stone-300" : "text-stone-600"}`}>
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function ScoreCell({ level, highlight }: { level: number; highlight?: boolean }) {
  if (level === 3)
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
          highlight ? "bg-amber-400 text-stone-950" : "bg-emerald-600 text-white"
        }`}
      >
        <CheckCircle2 className="size-3.5" /> کامل
      </span>
    );
  if (level === 2)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-black text-sky-800">
        <Check className="size-3.5" /> خوب
      </span>
    );
  if (level === 1)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-black text-stone-600">
        ناقص
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-500">
      <X className="size-3.5" /> ندارد
    </span>
  );
}

/* ── ویوی اصلی ─────────────────────────────────────────────── */

export default function ProposalView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [langTab, setLangTab] = useState("FA");

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
      setShowTop(el.scrollTop > 800);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B0F0E] font-sans text-stone-900 antialiased">
      {/* نوار پیشرفت مطالعه */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-white/10 print:hidden">
        <div
          className="h-full bg-gradient-to-l from-emerald-400 via-amber-400 to-amber-500 transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── هدر شیشه‌ای دموی سایت ─────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F0E]/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-lg shadow-emerald-900/50">
              <Tractor className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black text-white">دلتا دشت</span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-amber-400">
                DELTADASHT
              </span>
            </span>
          </div>

          {/* زبانه‌های ۴ زبانه */}
          <div className="mr-2 hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {["FA", "EN", "AR", "KU"].map((l) => (
              <button
                key={l}
                onClick={() => setLangTab(l)}
                className={`rounded-full px-3 py-1 text-[11px] font-black transition ${
                  langTab === l
                    ? "bg-amber-400 text-stone-950 shadow"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <nav className="mr-auto hidden items-center gap-1 lg:flex">
            {NAV_LINKS.slice(1, 7).map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-[11px] font-bold text-stone-300 transition hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href="#next"
            className="mr-auto hidden items-center gap-1.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110 sm:inline-flex lg:mr-2"
          >
            درخواست پیش‌فاکتور آنلاین
            <ArrowLeft className="size-4" />
          </a>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-white/15 text-white lg:hidden"
            aria-label="منوی بخش‌ها"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#0B0F0E]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-white/5 px-3 py-2.5 text-xs font-bold text-stone-200 transition hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <a
              href="#next"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-amber-400 to-amber-500 px-4 py-3 text-xs font-black text-stone-950"
            >
              درخواست پیش‌فاکتور آنلاین
              <ArrowLeft className="size-4" />
            </a>
          </nav>
        )}
      </header>

      {/* ── کاور سینمایی ─────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        <img
          src="/deltadasht/hero-turboliner.jpg"
          alt="سمپاش توربولاینر دلتا دشت — دموی هیرو سینمایی پورتال جدید"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0E] via-[#0B0F0E]/55 to-[#0B0F0E]/30" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0B0F0E]/80 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/40 px-4 py-1.5 text-[11px] font-black text-amber-300 backdrop-blur">
              <FileCheck2 className="size-3.5" />
              کاتالوگ رسمی پروپوزال • نسخه ارائه به کارفرما • شهریور ۱۴۰۵
            </p>
            <h1 className="mt-5 text-3xl font-black leading-[3.4rem] text-white sm:text-5xl sm:leading-[4.6rem]">
              پورتال جدید
              <span className="bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {" "}
                دلتا دشت{" "}
              </span>
              <br />
              رتبه یک دیجیتال ادوات کشاورزی
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-stone-200 sm:text-base sm:leading-9">
              طرح اجرایی بازطراحی کامل deltadasht.com در استاندارد لیدرهای جهانی: هویت بصری
              سینمایی سبز زمردی–کهربایی، کاتالوگ هوشمند محصولات، پیش‌فاکتور آنلاین با QR
              اعتبارسنجی، نسخه چهارزبانه و سئوی سطح جهانی — آماده لانچ در{" "}
              <strong className="text-amber-300">۸ هفته</strong>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#next"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-amber-400 to-amber-500 px-7 py-3.5 text-sm font-black text-stone-950 shadow-xl shadow-amber-500/30 transition hover:scale-[1.02] hover:brightness-110"
              >
                درخواست پیش‌فاکتور آنلاین
                <ArrowLeft className="size-4" />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                <View className="size-4" />
                مشاهده دموی طراحی
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-xs font-bold text-stone-300 transition hover:bg-white/10 hover:text-white print:hidden"
              >
                <Printer className="size-4" />
                چاپ کاتالوگ
              </button>
            </div>
          </div>

          {/* شمارنده‌های اعتماد */}
          <dl className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-xl"
              >
                <s.icon className="mx-auto size-6 text-amber-400" />
                <dd className="mt-2 text-3xl font-black text-white">{s.value}</dd>
                <dt className="mt-1 text-[11px] font-bold text-stone-300">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── چکیده مدیریتی ────────────────────────────────── */}
      <section id="executive" className="scroll-mt-24 bg-[#0B0F0E] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            light
            kicker="EXECUTIVE SUMMARY • چکیده ارائه"
            title="چرا این پروپوزال؟ چرا همین حالا؟"
            desc="تحلیل ۱۴ صفحه‌ای سایت فعلی نشان می‌دهد برندی با ۴۰ سال سابقه و گواهی رسمی کیفیت، در فضای دیجیتال از رقبای داخلی و جهانی عقب مانده است. این کاتالوگ، نقشه راه بازگشت به صدر است."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-red-400/20 bg-gradient-to-b from-red-950/40 to-transparent p-6">
              <p className="text-xs font-black text-red-300">وضعیت امروز</p>
              <p className="mt-2 text-4xl font-black text-white">عقب‌ماندگی</p>
              <p className="mt-3 text-xs leading-7 text-stone-300">
                سایت قدیمی، بدون پیش‌فاکتور آنلاین، بدون مشخصات فنی و نامرئی در گوگل — هر
                روز یعنی واگذاری مشتری به کشت گستر و پارس کاوه.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-500/15 to-transparent p-6">
              <p className="text-xs font-black text-amber-300">راه‌حل پیشنهادی</p>
              <p className="mt-2 text-4xl font-black text-white">پورتال جهانی</p>
              <p className="mt-3 text-xs leading-7 text-stone-300">
                پورتال سینمایی ۴ زبانه با کاتالوگ هوشمند، موتور پیش‌فاکتور آنی، پرتال
                نمایندگان و سئوی بین‌المللی — هم‌تراز Hardi و Amazone.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/15 to-transparent p-6">
              <p className="text-xs font-black text-emerald-300">نتیجه هدف</p>
              <p className="mt-2 text-4xl font-black text-white">رتبه یک</p>
              <p className="mt-3 text-xs leading-7 text-stone-300">
                رتبه یک دیجیتال ادوات کشاورزی ایران و منطقه: ‎+۳۰٪ ترافیک ارگانیک در سال
                اول و ‎+۱۵٪ نرخ تبدیل در ۶ ماه.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ضرورت بازطراحی ───────────────────────────────── */}
      <section id="gap" className="scroll-mt-24 bg-stone-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker="GAP ANALYSIS • تحلیل شکاف"
            title="ضرورت بازطراحی: ۶ زخم باز سایت فعلی"
            desc="یافته‌های کلیدی سند «بررسی و تحلیل جامع سایت دلتا دشت» (صص ۲–۶) — مشکلاتی که مستقیماً فروش و اعتبار برند را تهدید می‌کنند."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CURRENT_PAIN_POINTS.map((p, i) => (
              <article
                key={p.title}
                className="group rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                    <p.icon className="size-6" />
                  </span>
                  <span className="text-4xl font-black text-stone-100 transition group-hover:text-red-100">
                    {["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶"][i]}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-black text-stone-950">{p.title}</h3>
                <p className="mt-2 text-xs leading-7 text-stone-600">{p.text}</p>
              </article>
            ))}
          </div>

          {/* تحرکات رقبا */}
          <div className="mt-12 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-950 px-6 py-4">
              <TrendingUp className="size-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                رقبا خواب نیستند — تحرکاتی که همین امروز مشتری می‌رباید
              </h3>
            </div>
            <ul className="grid gap-px bg-stone-100 sm:grid-cols-2 lg:grid-cols-3">
              {COMPETITOR_MOVES.map((c) => (
                <li key={c.name} className="bg-white p-5">
                  <p className="text-[10px] font-black text-amber-700">{c.level}</p>
                  <p className="mt-1 text-sm font-black text-stone-950">{c.name}</p>
                  <p className="mt-1 text-xs leading-6 text-stone-600">{c.move}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── دموی طراحی و هویت بصری ────────────────────────── */}
      <section id="demo" className="scroll-mt-24 bg-[#0B0F0E] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            light
            kicker="VISUAL IDENTITY • هویت بصری"
            title="دموی طراحی: سینمایی، پرقدرت، متمایز"
            desc="صفحه اصلی تاریک و سینمایی با سمپاش توربولاینر در مرکز، هدر شیشه‌ای شناور، دکمه‌های کهربایی و لایه‌های آماری اعتمادساز — هویتی که در نگاه اول، ۴۰ سال اقتدار صنعتی را فریاد می‌زند."
          />

          {/* پالت رنگی */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="flex h-32 items-end justify-between bg-[#0F4C3A] p-4">
                <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur" dir="ltr">
                  #0F4C3A
                </span>
              </div>
              <div className="bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-black text-white">سبز زمردی عمیق</p>
                <p className="mt-1 text-[11px] leading-6 text-stone-400">
                  رنگ هویتی غالب؛ نماد کشاورزی، رشد و کیفیت صنعتی
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="flex h-32 items-end justify-between bg-[#F59E0B] p-4">
                <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur" dir="ltr">
                  #F59E0B
                </span>
              </div>
              <div className="bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-black text-white">کهربایی صنعتی</p>
                <p className="mt-1 text-[11px] leading-6 text-stone-400">
                  دکمه‌های اقدام (CTA) و تاکیدهای انرژیک؛ حس قدرت و فوریت
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="flex h-32 items-end justify-between bg-[#141311] p-4">
                <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur" dir="ltr">
                  #141311
                </span>
              </div>
              <div className="bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-black text-white">دودی پریمیوم</p>
                <p className="mt-1 text-[11px] leading-6 text-stone-400">
                  پس‌زمینه تیره سینمایی؛ حس های‌تک و متمایز از رقبا
                </p>
              </div>
            </div>
          </div>

          {/* گالری دمو */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <figure className="group overflow-hidden rounded-3xl border border-white/10">
              <div className="relative overflow-hidden">
                <img
                  src="/deltadasht/field-operation.jpg"
                  alt="عملیات مزرعه‌ای سمپاش توربولاینر در باغ"
                  className="aspect-video w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur">
                  اسلایدر ویدئویی عملیات مزرعه
                </span>
              </div>
              <figcaption className="bg-white/5 p-4 text-[11px] leading-6 text-stone-300 backdrop-blur">
                سکشن «در مزرعه»: ویدئوی واقعی پاشش در باغ با نور طلایی — اثبات عملکرد، نه
                فقط ادعا.
              </figcaption>
            </figure>
            <figure className="group overflow-hidden rounded-3xl border border-white/10">
              <div className="relative overflow-hidden">
                <img
                  src="/deltadasht/factory.jpg"
                  alt="کارخانه و خط تولید ادوات کشاورزی دلتا دشت"
                  className="aspect-video w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur">
                  تور مجازی کارخانه
                </span>
              </div>
              <figcaption className="bg-white/5 p-4 text-[11px] leading-6 text-stone-300 backdrop-blur">
                سکشن «قدرت تولید»: خط مونتاژ مدرن و تور ۳۶۰ درجه کارخانه — اعتمادسازی
                B2B برای خریداران عمده و صادراتی.
              </figcaption>
            </figure>
          </div>

          {/* تایپوگرافی و تعامل */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <Palette className="size-6 text-amber-400" />
              <h3 className="mt-3 text-sm font-black text-white">تایپوگرافی فارسی مدرن</h3>
              <p className="mt-2 text-xs leading-7 text-stone-300">
                ایران‌یکان پرو / دانیک با وزن‌های ۴۰۰ تا ۹۰۰؛ خوانایی عالی در دسکتاپ و
                موبایل. نمونه:
              </p>
              <p className="mt-3 rounded-2xl bg-black/40 p-4 text-2xl font-black leading-10 text-white">
                قدرت سبز مزرعه شما
                <span className="mt-1 block text-xs font-bold text-stone-400">
                  سمپاش توربولاینر ۲۰۰۰ لیتری — کششی باغی
                </span>
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <Cpu className="size-6 text-amber-400" />
              <h3 className="mt-3 text-sm font-black text-white">میکرواینترکشن‌های تعاملی</h3>
              <ul className="mt-3 space-y-2.5 text-xs leading-6 text-stone-300">
                <li className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-400" /> هاور تعاملی روی قطعات دستگاه با نمایش نام فنی</li>
                <li className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-400" /> شمارنده انیمیشنی آمار (۴۰ سال، ۵۰ هزار دستگاه)</li>
                <li className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-400" /> کارت‌های گلس‌مورفیسم دسته‌بندی با افکت عمق</li>
                <li className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-400" /> اسکرول سینمایی (Parallax) در هیرو و کارخانه</li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <img
                src="/deltadasht/sprayer-night.jpg"
                alt="نمای نزدیک نازل‌های سمپاش در شب"
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <div className="bg-white/5 p-5 backdrop-blur">
                <h3 className="text-sm font-black text-white">زبان تصویر صنعتی–هنری</h3>
                <p className="mt-2 text-xs leading-7 text-stone-300">
                  عکاسی ماکرو از نازل، پمپ و اتصالات برنجی با نورپردازی دراماتیک؛ هر
                  تصویر، یک پوستر تبلیغاتی بالقوه برای شبکه‌های اجتماعی.
                </p>
              </div>
            </div>
          </div>

          {/* دسته‌بندی محصولات — پیش‌نمایش کارت‌های گلس */}
          <h3 className="mt-12 text-center text-lg font-black text-white">
            پیش‌نمایش کارت‌های دسته‌بندی محصولات (گلس‌مورفیسم)
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {PRODUCT_CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="group rounded-3xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-400/60 hover:bg-white/15"
              >
                <c.icon className="mx-auto size-7 text-amber-400 transition group-hover:scale-110" />
                <p className="mt-2 text-xs font-black leading-5 text-white">{c.name}</p>
                <p className="mt-0.5 text-[10px] text-stone-400">{c.desc}</p>
                <p className="mx-auto mt-2 w-fit rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                  {c.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── نقشه سایت ─────────────────────────────────────── */}
      <section id="sitemap" className="scroll-mt-24 bg-stone-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker="SITEMAP • معماری اطلاعات"
            title="نقشه سایت: ۴ ستون، ۱۶ صفحه کلیدی"
            desc="معماری تخت و کم‌عمق: هر محصول حداکثر با ۲ کلیک از صفحه اصلی در دسترس است؛ هم برای کاربر، هم برای خزنده گوگل."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SITEMAP.map((col, i) => (
              <div key={col.title} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                <div
                  className={`px-5 py-4 ${
                    i % 2 === 0
                      ? "bg-gradient-to-l from-emerald-800 to-emerald-950"
                      : "bg-gradient-to-l from-stone-800 to-stone-950"
                  }`}
                >
                  <p className="text-sm font-black text-white">{col.title}</p>
                </div>
                <ul className="space-y-2.5 p-5">
                  {col.pages.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs font-bold leading-6 text-stone-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── امکانات پورتال ────────────────────────────────── */}
      <section id="features" className="scroll-mt-24 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker="PORTAL FEATURES • سیستم‌های پیشرفته B2B"
            title="۶ موتور قدرتی که سایت را به فروشنده تبدیل می‌کند"
            desc="هر ماژول مستقیماً یکی از شکاف‌های سند تحلیل را پوشش می‌دهد — از انتخاب دستگاه تا صدور پیش‌فاکتور و سفارش قطعه."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className={`relative overflow-hidden rounded-[1.75rem] border p-7 transition hover:-translate-y-1 hover:shadow-2xl ${
                  f.accent === "amber"
                    ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white hover:shadow-amber-100"
                    : "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white hover:shadow-emerald-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${
                      f.accent === "amber"
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200"
                        : "bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-emerald-200"
                    }`}
                  >
                    <f.icon className="size-7" />
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black ${
                      f.accent === "amber"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-black text-stone-950">{f.title}</h3>
                <p className="mt-2 text-xs leading-7 text-stone-600">{f.text}</p>
                <ul className="mt-4 space-y-2 border-t border-dashed border-stone-200 pt-4">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[11px] font-bold leading-6 text-stone-700">
                      <CheckCircle2
                        className={`mt-0.5 size-4 shrink-0 ${
                          f.accent === "amber" ? "text-amber-600" : "text-emerald-600"
                        }`}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* نوار نمونه پیش‌فاکتور */}
          <div className="mt-8 grid items-center gap-6 overflow-hidden rounded-[1.75rem] bg-stone-950 p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-1.5 text-[11px] font-black text-amber-300">
                <QrCode className="size-4" />
                نمونه خروجی موتور پیش‌فاکتور
              </p>
              <h3 className="mt-3 text-xl font-black leading-9 text-white sm:text-2xl">
                از کلیک تا PDF رسمی، در ۶۰ ثانیه
              </h3>
              <p className="mt-2 max-w-2xl text-xs leading-7 text-stone-300">
                پیش‌فاکتور شماره <span className="font-mono text-amber-300" dir="ltr">DD-1405-08314</span> برای
                «سمپاش توربولاینر ۲۰۰۰ لیتری + کیت باغبانی» — شامل مهر دیجیتال، QR
                اعتبارسنجی یکتا و لینک پیگیری پیامکی. فروش شما حتی نیمه‌شب هم پاسخ‌گوست.
              </p>
            </div>
            <div className="grid size-40 place-items-center rounded-3xl border-2 border-dashed border-amber-400/50 bg-white/5">
              <div className="text-center">
                <QrCode className="mx-auto size-16 text-amber-400" />
                <p className="mt-2 text-[10px] font-black text-stone-300">اسکن اعتبارسنجی</p>
                <p className="font-mono text-[10px] text-stone-500" dir="ltr">DD-1405-08314</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── جدول مزیت رقابتی ──────────────────────────────── */}
      <section id="compare" className="scroll-mt-24 bg-[#0B0F0E] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            light
            kicker="COMPETITIVE EDGE • تحلیل رقابتی"
            title="دلتا دشت جدید در برابر غول‌های داخلی و جهانی"
            desc="مقایسه موشکافانه با کشت گستر، پارس کاوه و فامکو در داخل — و John Deere ،Amazone ،Hardi و Kubota در جهان. ستون طلایی، آینده شماست."
          />
          <div className="mt-10 overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[680px] border-collapse bg-white/5 text-right backdrop-blur">
              <thead>
                <tr className="text-[11px]">
                  <th className="p-4 font-black text-stone-300">قابلیت</th>
                  <th className="bg-gradient-to-b from-amber-400 to-amber-500 p-4 text-xs font-black text-stone-950">
                    ★ دلتا دشت جدید
                  </th>
                  <th className="p-4 font-black text-stone-300">رقبای داخلی</th>
                  <th className="p-4 font-black text-stone-300">رقبای خارجی</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {COMPARE_ROWS.map((r, i) => (
                  <tr key={r.feature} className={i % 2 === 0 ? "bg-white/[0.03]" : ""}>
                    <td className="border-t border-white/10 p-4 font-bold text-white">{r.feature}</td>
                    <td className="border-t border-amber-400/30 bg-amber-400/10 p-4">
                      <ScoreCell level={r.delta} highlight />
                    </td>
                    <td className="border-t border-white/10 p-4">
                      <ScoreCell level={r.domestic} />
                    </td>
                    <td className="border-t border-white/10 p-4">
                      <ScoreCell level={r.foreign} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-8 text-stone-300">
            جمع‌بندی: دلتا دشت جدید از نظر امکانات دیجیتال <strong className="text-amber-300">هم‌تراز برندهای جهانی</strong> و
            <strong className="text-amber-300"> یک پله جلوتر از تمام رقبای داخلی </strong>
            قرار می‌گیرد — با برتری منحصربه‌فرد سابقه ۴۰ ساله تولید بومی و گواهی رسمی مرکز توسعه مکانیزاسیون.
          </p>
        </div>
      </section>

      {/* ── چهارزبانه و سئو ───────────────────────────────── */}
      <section id="i18n-seo" className="scroll-mt-24 bg-stone-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker="GLOBAL READY • چهارزبانه و سئوی جهانی"
            title="یک پورتال، چهار زبان، سه بازار صادراتی"
            desc="فارسی، انگلیسی، عربی و کردی سورانی با RTL/LTR خودکار و محتوای بومی‌سازی‌شده — همراه با سئوی تکنیکال در سطح استاندارد جهانی."
          />

          {/* دموی زبانه زبان */}
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-center gap-2 border-b border-stone-100 bg-stone-950 px-4 py-4">
              <Languages className="size-4 text-amber-400" />
              <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
                {[
                  { id: "FA", label: "فارسی" },
                  { id: "EN", label: "English" },
                  { id: "AR", label: "العربية" },
                  { id: "KU", label: "کوردی" },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLangTab(l.id)}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-black transition ${
                      langTab === l.id ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 text-center" dir={langTab === "EN" ? "ltr" : "rtl"}>
              {langTab === "FA" && (
                <>
                  <p className="text-lg font-black text-stone-950">درخواست پیش‌فاکتور آنلاین</p>
                  <p className="mt-1 text-xs text-stone-500">۴۰ سال همراه مطمئن کشاورزان ایران</p>
                </>
              )}
              {langTab === "EN" && (
                <>
                  <p className="text-lg font-black text-stone-950">Request Online Proforma Invoice</p>
                  <p className="mt-1 text-xs text-stone-500">40 years of trusted agri-machinery, made in Iran</p>
                </>
              )}
              {langTab === "AR" && (
                <>
                  <p className="text-lg font-black text-stone-950">طلب فاتورة أولية عبر الإنترنت</p>
                  <p className="mt-1 text-xs text-stone-500">٤٠ عامًا من الثقة في المعدات الزراعية الإيرانية</p>
                </>
              )}
              {langTab === "KU" && (
                <>
                  <p className="text-lg font-black text-stone-950">داوای پێش‌فاکتورەی ئۆنڵاین</p>
                  <p className="mt-1 text-xs text-stone-500">٤٠ ساڵ متمانەی جووتیارانی کوردستان</p>
                </>
              )}
              <p className="mx-auto mt-4 max-w-md text-[11px] leading-6 text-stone-400">
                ↑ روی زبانه‌ها کلیک کنید — همین تجربه، در کل پورتال با تغییر خودکار جهت (RTL/LTR)، فونت و حتی تصاویر اعمال می‌شود.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_ITEMS.map((s) => (
              <div key={s.title} className="flex items-start gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-stone-950">{s.title}</p>
                  <p className="mt-1 text-[11px] leading-6 text-stone-600">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── زمان‌بندی ─────────────────────────────────────── */}
      <section id="timeline" className="scroll-mt-24 bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            kicker="FAST-TRACK PLAN • برنامه فشرده اجرا"
            title="از قرارداد تا لانچ جهانی: فقط ۸ هفته"
            desc="۵ فاز چابک با خروجی قابل تحویل در پایان هر فاز؛ شما هر دو هفته یک نسخه قابل مشاهده و تست تحویل می‌گیرید."
          />
          <div className="relative mt-12">
            <div className="absolute bottom-4 right-[27px] top-4 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-400 to-emerald-700 sm:right-1/2" />
            <div className="space-y-5">
              {TIMELINE.map((t) => (
                <div key={t.phase} className="relative mr-0 flex gap-4 sm:mr-0">
                  <span
                    className={`z-10 grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${
                      t.color === "amber"
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200"
                        : "bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-emerald-200"
                    }`}
                  >
                    <CalendarClock className="size-6" />
                  </span>
                  <div className="flex-1 rounded-3xl border border-stone-200 bg-stone-50 p-5 transition hover:border-emerald-300 hover:bg-white hover:shadow-lg">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          t.color === "amber"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {t.phase} • {t.weeks}
                      </span>
                      <h3 className="text-sm font-black text-stone-950">{t.title}</h3>
                    </div>
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-3">
                      {t.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-[11px] font-bold leading-6 text-stone-600">
                          <Check className="mt-1 size-3.5 shrink-0 text-emerald-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── امنیت و عملکرد ────────────────────────────────── */}
      <section id="security" className="scroll-mt-24 bg-stone-950 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            light
            kicker="SECURITY & PERFORMANCE • زیرساخت مطمئن"
            title="امن، سریع، همیشه بیدار"
            desc="استانداردهای فنی غیرقابل مذاکره: امنیت بانکی، سرعت جهانی و پایداری ۲۴ ساعته."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY_ITEMS.map((s) => (
              <div
                key={s}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <ShieldCheck className="size-5 shrink-0 text-emerald-400" />
                <p className="text-xs font-bold leading-6 text-stone-200">{s}</p>
              </div>
            ))}
          </div>

          {/* شاخص‌های عملکرد */}
          <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
            {[
              { v: "۱٫۵s >", t: "LCP (بارگذاری بزرگ‌ترین محتوا)", d: "استاندارد سبز گوگل" },
              { v: "۹۰+", t: "امتیاز PageSpeed موبایل", d: "در هر ۴ نسخه زبانی" },
              { v: "۹۹٫۹٪", t: "آپتایم تضمینی سالانه", d: "با مانیتورینگ ۲۴/۷" },
            ].map((k) => (
              <div key={k.t} className="rounded-3xl border border-amber-400/25 bg-gradient-to-b from-amber-400/10 to-transparent p-6">
                <p className="text-3xl font-black text-amber-300" dir="ltr">{k.v}</p>
                <p className="mt-2 text-xs font-black text-white">{k.t}</p>
                <p className="mt-0.5 text-[11px] text-stone-400">{k.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── پکیج مدیا ─────────────────────────────────────── */}
      <section id="media" className="scroll-mt-24 bg-stone-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            kicker="CLIENT TOOLKIT • همکاری کارفرما"
            title="از شما فقط این ۶ قلم را می‌خواهیم"
            desc="هرچه پکیج مدیا زودتر برسد، فاز محتوا جلوتر می‌افتد. چک‌لیست شفاف، بدون رفت‌وبرگشت فرسایشی."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEDIA_NEEDS.map((m, i) => (
              <div key={m.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-stone-950 text-amber-400">
                    <m.icon className="size-6" />
                  </span>
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
                    {["۱", "۲", "۳", "۴", "۵", "۶"][i]}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-black text-stone-950">{m.title}</h3>
                <p className="mt-1.5 text-xs leading-7 text-stone-600">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── سوالات پرتکرار ────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            kicker="FAQ • پاسخ به دغدغه‌های مدیران"
            title="۴ سؤالی که همه مدیران می‌پرسند"
          />
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <div
                key={f.q}
                className={`overflow-hidden rounded-3xl border transition ${
                  openFaq === i ? "border-emerald-300 bg-emerald-50/50" : "border-stone-200 bg-stone-50"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-5 text-right"
                >
                  <span className="flex items-center gap-3 text-sm font-black text-stone-950">
                    <MessageSquareText className={`size-5 ${openFaq === i ? "text-emerald-700" : "text-stone-400"}`} />
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-stone-400 transition ${openFaq === i ? "rotate-180 text-emerald-700" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="border-t border-dashed border-stone-200 px-5 py-4 text-xs leading-8 text-stone-600">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── گام بعدی ──────────────────────────────────────── */}
      <section id="next" className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:py-24">
        <img
          src="/deltadasht/hero-turboliner.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0E] via-[#0B0F0E]/85 to-[#0B0F0E]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-black/40 px-4 py-1.5 text-[11px] font-black text-amber-300 backdrop-blur">
            <Rocket className="size-3.5" />
            شروع پروژه از هفته آینده
          </p>
          <h2 className="mt-4 text-2xl font-black leading-11 text-white sm:text-4xl sm:leading-[3.8rem]">
            ۳ قدم تا صدر جدول دیجیتال
            <br />
            <span className="text-amber-300">فقط یک «بله» فاصله است</span>
          </h2>
          <div className="mt-8 grid gap-3 text-right sm:grid-cols-3">
            {[
              { icon: BookOpenCheck, t: "قدم ۱ — تأیید", d: "تأیید ساختار صفحات، هویت بصری و دموی این کاتالوگ" },
              { icon: Film, t: "قدم ۲ — تحویل مدیا", d: "ارسال پکیج ۶ قلمی تصاویر، کاتالوگ‌ها و ویدئوها" },
              { icon: Users, t: "قدم ۳ — کیک‌آف", d: "جلسه هماهنگی و شروع رسمی فاز ۱ در هفته آینده" },
            ].map((s) => (
              <div key={s.t} className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                <s.icon className="size-6 text-amber-400" />
                <p className="mt-2 text-sm font-black text-white">{s.t}</p>
                <p className="mt-1 text-[11px] leading-6 text-stone-300">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:info@deltadasht.com?subject=%D8%AA%D8%A7%DB%8C%DB%8C%D8%AF%20%D9%BE%D8%B1%D9%88%D9%BE%D9%88%D8%B2%D8%A7%D9%84%20%D9%BE%D9%88%D8%B1%D8%AA%D8%A7%D9%84%20%D8%AC%D8%AF%DB%8C%D8%AF"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-amber-400 to-amber-500 px-8 py-4 text-sm font-black text-stone-950 shadow-xl shadow-amber-500/30 transition hover:scale-[1.03] hover:brightness-110"
            >
              تأیید پروپوزال و شروع پروژه
              <ArrowLeft className="size-4" />
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-xs font-black text-white backdrop-blur transition hover:bg-white/20 print:hidden"
            >
              <Printer className="size-4" />
              چاپ / ذخیره PDF کاتالوگ
            </button>
          </div>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-stone-400">
            <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" /> deltadasht.com</span>
            <span className="inline-flex items-center gap-1.5"><Headset className="size-3.5" /> جلسه ارائه حضوری / آنلاین</span>
            <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-3.5" /> آموزش کامل تیم شما پس از لانچ</span>
          </p>
        </div>
      </section>

      {/* ── فوتر کاتالوگ ─────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-right">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-white">
              <Tractor className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-black text-white">دلتا دشت • کاتالوگ رسمی پروپوزال</p>
              <p className="mt-0.5 text-[10px] text-stone-500">نسخه ۱٫۰ — شهریور ۱۴۰۵ • محرمانه، ویژه هیئت مدیره</p>
            </div>
          </div>
          <p className="max-w-xl text-[10px] leading-6 text-stone-500">
            مبنای تحلیل: سند «بررسی و تحلیل جامع سایت دلتا دشت» (صص ۱–۱۴) شامل SWOT، مقایسه رقبا و شاخص‌های عملکردی. تمامی تصاویر این کاتالوگ، دموی مفهومی هویت بصری پیشنهادی است.
          </p>
        </div>
      </footer>

      {/* دکمه بازگشت به بالا */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-50 grid size-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-xl shadow-amber-500/30 transition hover:scale-110 print:hidden"
          aria-label="بازگشت به بالا"
        >
          <ArrowUp className="size-5" />
        </button>
      )}

      {/* استایل چاپ */}
      <style>{`
        @media print {
          header.sticky { position: static; }
          section, article { break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
