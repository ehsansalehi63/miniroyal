import type {
  Product,
  ProductAngleMedia,
  ProductAttribute,
  ProductMediaAngle,
  SizeChartRow,
  Variant,
} from "./types/catalog";

/**
 * APIهای مدیریتی محصول، ردیف خام جدول را برمی‌گردانند (`SELECT p.*`) و بنابراین
 * کلیدها snake_case هستند: base_price، sale_price، category_id، size_chart_json …
 * ولی رابط کاربری پنل با نام‌های camelCase کار می‌کند. تا پیش از این نگاشتی بین
 * این دو وجود نداشت و نتیجه‌اش این بود که:
 *   • ستون «قیمت پایه» و «قیمت فروش» برای همهٔ محصولات «۰ تومان» نشان داده می‌شد،
 *   • با باز شدن فرم ویرایش، قیمت/دسته/وضعیت/جدول سایز خالی می‌شد و ذخیرهٔ مجدد
 *     همان مقادیر خالی را روی محصول می‌نوشت.
 * این ماژول تنها نقطهٔ تبدیل داده است تا هر سه مسیر (بارگذاری اولیه، تازه‌سازی
 * بعد از ذخیره و تازه‌سازی بعد از حذف) خروجی یکسان و درست بدهند.
 */
type RawRecord = Record<string, unknown>;

function pick(raw: RawRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function toText(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value as T;
  try {
    const parsed = JSON.parse(String(value));
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** تصویرها بسته به endpoint یا رشته‌اند یا آبجکت {url}. هر دو حالت پشتیبانی می‌شود. */
export function toImageUrlList(value: unknown): string[] {
  const list = parseJson<unknown>(value, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === "string" ? item : toText((item as RawRecord | null)?.url, "")))
    .filter((url) => url.trim().length > 0);
}

function toVariants(value: unknown, productId: number): Variant[] {
  const list = parseJson<unknown>(value, []);
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const raw = (item || {}) as RawRecord;
    return {
      id: toNumber(raw.id),
      productId: toNumber(pick(raw, "productId", "product_id"), productId),
      sku: toText(raw.sku),
      size: toText(raw.size),
      color: toText(raw.color),
      colorCode: toText(pick(raw, "colorCode", "color_code"), "") || undefined,
      stock: toNumber(raw.stock),
      priceAdjustment: toNumber(pick(raw, "priceAdjustment", "price_adjustment")),
    };
  });
}

function toAttributes(value: unknown): ProductAttribute[] {
  const list = parseJson<unknown>(value, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((item): ProductAttribute | null => {
      const raw = (item || {}) as RawRecord;
      const fieldKey = toText(pick(raw, "fieldKey", "field_key"));
      if (!fieldKey) return null;
      return {
        id: toOptionalNumber(raw.id),
        definitionId: toOptionalNumber(pick(raw, "definitionId", "definition_id")) ?? null,
        fieldKey,
        label: toText(raw.label, fieldKey),
        value: parseJson<ProductAttribute["value"]>(pick(raw, "value", "value_json", "value_text"), ""),
        unit: raw.unit === undefined || raw.unit === null ? null : String(raw.unit),
        isCustom: toBoolean(pick(raw, "isCustom", "is_custom")),
        sortOrder: toNumber(pick(raw, "sortOrder", "sort_order")),
      };
    })
    .filter((item): item is ProductAttribute => item !== null);
}

const angleKeys: ProductMediaAngle[] = ["front", "back", "left", "right", "detail", "on_model", "size_label", "packaging"];

/** زاویه‌های مدیارسانه در دیتابیس آرایه‌اند و در فرم به‌صورت map نگهداری می‌شوند. */
function toMediaAngles(value: unknown): Partial<Record<ProductMediaAngle, ProductAngleMedia>> {
  const parsed = parseJson<unknown>(value, []);
  const result: Partial<Record<ProductMediaAngle, ProductAngleMedia>> = {};
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const raw = (item || {}) as RawRecord;
      const angle = toText(raw.angle) as ProductMediaAngle;
      const url = toText(raw.url);
      if (!url || !angleKeys.includes(angle)) continue;
      result[angle] = {
        url,
        angle,
        alt: toText(raw.alt, "") || undefined,
        isAiOptimized: toBoolean(pick(raw, "isAiOptimized", "is_ai_optimized")),
        isTryOnReady: toBoolean(pick(raw, "isTryOnReady", "is_tryon_ready")),
      };
    }
    return result;
  }
  if (parsed && typeof parsed === "object") {
    for (const [angle, media] of Object.entries(parsed as RawRecord)) {
      const raw = (media || {}) as RawRecord;
      const url = toText(raw.url);
      if (!url || !angleKeys.includes(angle as ProductMediaAngle)) continue;
      result[angle as ProductMediaAngle] = {
        url,
        angle: angle as ProductMediaAngle,
        alt: toText(raw.alt, "") || undefined,
        isAiOptimized: toBoolean(pick(raw, "isAiOptimized", "is_ai_optimized")),
        isTryOnReady: toBoolean(pick(raw, "isTryOnReady", "is_tryon_ready")),
      };
    }
  }
  return result;
}

const statuses = new Set<Product["status"]>(["active", "draft", "review", "archived"]);
const genders = new Set<Product["gender"]>(["boy", "girl", "unisex"]);
const fitTypes = new Set<Product["fitType"]>(["tight", "normal", "loose"]);

export function normalizeAdminProduct(input: unknown): Product {
  const raw = (input || {}) as RawRecord;
  const id = toNumber(raw.id);
  const status = toText(pick(raw, "status"), "active") as Product["status"];
  const gender = toText(pick(raw, "gender"), "unisex") as Product["gender"];
  const fitType = toText(pick(raw, "fitType", "fit_type"), "normal") as Product["fitType"];
  const publishedAt = pick(raw, "publishedAt", "published_at", "createdAt", "created_at");

  return {
    id,
    title: toText(raw.title, "محصول بدون عنوان"),
    slug: toText(raw.slug),
    sku: toText(raw.sku, "بدون SKU"),
    shortDesc: toText(pick(raw, "shortDesc", "short_desc"), ""),
    description: toText(raw.description, ""),
    categoryId: toNumber(pick(raw, "categoryId", "category_id")),
    categorySlug: toText(pick(raw, "categorySlug", "category_slug"), ""),
    categoryName: toText(pick(raw, "categoryName", "category_name"), "بدون دسته‌بندی"),
    brandName: toText(pick(raw, "brandName", "brand_name"), "") || undefined,
    gender: genders.has(gender) ? gender : "unisex",
    ageMinMonth: toNumber(pick(raw, "ageMinMonth", "age_min_month"), 0),
    ageMaxMonth: toNumber(pick(raw, "ageMaxMonth", "age_max_month"), 0),
    basePrice: toNumber(pick(raw, "basePrice", "base_price")),
    salePrice: toOptionalNumber(pick(raw, "salePrice", "sale_price")),
    isFeatured: toBoolean(pick(raw, "isFeatured", "is_featured")),
    isSpecialOffer: toBoolean(pick(raw, "isSpecialOffer", "is_special_offer")),
    salesCount: toNumber(pick(raw, "salesCount", "sales_count")),
    viewsCount: toNumber(pick(raw, "viewsCount", "views_count")),
    ratingAvg: toNumber(pick(raw, "ratingAvg", "rating_avg")),
    ratingCount: toNumber(pick(raw, "ratingCount", "rating_count")),
    status: statuses.has(status) ? status : "draft",
    fitType: fitTypes.has(fitType) ? fitType : "normal",
    seoTitle: toText(pick(raw, "seoTitle", "seo_title"), "") || undefined,
    seoDesc: toText(pick(raw, "seoDesc", "seo_desc"), "") || undefined,
    faqJson: parseJson<Product["faqJson"]>(pick(raw, "faqJson", "faq_json"), []),
    sizeChartJson: parseJson<SizeChartRow[]>(pick(raw, "sizeChartJson", "size_chart_json"), []),
    images: toImageUrlList(raw.images),
    variants: toVariants(raw.variants, id),
    publishedAt: publishedAt ? new Date(String(publishedAt)).toISOString() : new Date().toISOString(),
    features: parseJson<string[]>(pick(raw, "features", "features_json"), []),
    fabricMaterial: toText(pick(raw, "fabricMaterial", "fabric_material"), "") || undefined,
    washCare: toText(pick(raw, "washCare", "wash_care"), "") || undefined,
    fitProfile: parseJson<Product["fitProfile"]>(pick(raw, "fitProfile", "fit_profile_json"), undefined),
    mediaAngles: toMediaAngles(pick(raw, "mediaAngles", "media_angles")),
    attributes: toAttributes(raw.attributes),
    tryOnAsset: parseJson<Product["tryOnAsset"]>(pick(raw, "tryOnAsset", "tryon_asset_json"), undefined),
  };
}

export function normalizeAdminProducts(input: unknown): Product[] {
  return Array.isArray(input) ? input.map((item) => normalizeAdminProduct(item)) : [];
}

/** تصویر جایگزین وقتی رسانهٔ محصول حذف/خراب شده باشد تا جدول مدیریت خالی نماند. */
export const ADMIN_PRODUCT_IMAGE_FALLBACK = "/images/products/boy-hoodie.svg";
