/**
 * تصاویر لوکال کاتالوگ مینی رویال
 *
 * همهٔ فایل‌ها روی همان هاست هستند (بدون CDN خارجی). نسخهٔ WebP بهینه‌شده با
 * `node scripts/optimize-images.mjs` از روی PNGهای اصلی تولید می‌شود:
 *   catalog-NN.webp     → عرض ۱۲۸۰px  (هیرو، کارت محصول، صفحهٔ محصول)
 *   catalog-NN-sm.webp  → عرض ۵۶۰px   (تامبنیل دسته‌بندی و جستجو)
 *
 * PNGهای اصلی در ریپو باقی می‌مانند تا هر زمان خواستید دوباره بهینه‌سازی کنید.
 */
const catalog = (index: number, size: "full" | "sm" = "full") =>
  `/images/catalog/catalog-${String(index).padStart(2, "0")}${size === "sm" ? "-sm" : ""}.webp`;

export const REAL_IMAGES = {
  heroWinter: catalog(26),
  heroParty: catalog(27),
  heroBaby: catalog(28),
  boyHoodie: catalog(1),
  girlDress: catalog(6),
  babySet: catalog(8),
  jacket: catalog(5),
  editorial: catalog(17),
  heroSlide1: catalog(29),
} as const;

/** همان تصاویر در اندازهٔ کوچک — مخصوص تامبنیل‌ها تا مگابایت‌ها جابه‌جا نشود. */
export const THUMB_IMAGES = {
  boyHoodie: catalog(1, "sm"),
  girlDress: catalog(6, "sm"),
  babySet: catalog(8, "sm"),
  jacket: catalog(5, "sm"),
  editorial: catalog(17, "sm"),
  heroWinter: catalog(26, "sm"),
  heroParty: catalog(27, "sm"),
  heroBaby: catalog(28, "sm"),
} as const;

/** هر محصول نمونه عکس اختصاصی خودش را دارد. */
export const PRODUCT_REAL_IMAGES = {
  boyHoodie: catalog(1),
  girlDress: catalog(6),
  babySuit: catalog(8),
  boyJacket: catalog(5),
} as const;

export const CATEGORY_REAL_IMAGES = Array.from({ length: 28 }, (_, index) => catalog(index + 2));
export const CATEGORY_REAL_IMAGES_SMALL = Array.from({ length: 28 }, (_, index) => catalog(index + 2, "sm"));

export const PRODUCT_FALLBACKS = {
  girl: REAL_IMAGES.girlDress,
  baby: REAL_IMAGES.babySet,
  outerwear: REAL_IMAGES.jacket,
  boy: REAL_IMAGES.boyHoodie,
} as const;

/** پوستر ثابت هیرو؛ تا آمادهٔ شدن قاب اول ویدیو/انیمیشن نمایش داده می‌شود. */
export const HERO_POSTER = "/images/hero-poster.webp";

/** لوگوی سبک برند (۱۷ کیلوبایت) — جایگزین PNG دو مگابایتی قبلی. */
export const BRAND_LOGO = "/images/brand/miniroyal-logo.webp";
