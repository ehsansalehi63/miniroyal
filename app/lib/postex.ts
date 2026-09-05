/**
 * کلاینت پستکس (postex.ir).
 *
 * نکات پیاده‌سازی که در بازبینی اضافه شد:
 *  • هر درخواست timeout صریح دارد (پیش‌فرض ۱۵ ثانیه برای GET و ۴۵ ثانیه برای POST،
 *    مطابق کلاینت رسمی پستکس). قبلاً هیچ timeoutی نبود و یک درخواست معلق می‌توانست
 *    صفحهٔ تسویه یا ثبت سفارش را برای دقایق طولانی قفل کند.
 *  • پستکس گاهی با HTTP 200 ولی بدنهٔ {IsSuccess:false, Message:"..."} خطا برمی‌گرداند؛
 *    قبلاً این پاسخ «موفق» تلقی می‌شد و بعداً به خطای مبهم «قیمت قابل تشخیص نیست» می‌رسید.
 *  • خطاها با نوع مشخص (PostexError) برمی‌گردند تا در /admin/health دقیقاً معلوم شود
 *    مشکل از نبودن کلید، خطای احراز هویت، IP ثبت‌نشده، تایم‌اوت یا قطعی شبکه است.
 *  • فهرست شهرها در حافظه کش می‌شود؛ پیش از این برای هر استعلام قیمت دو بار کل لیست
 *    شهرهای کشور از پستکس گرفته می‌شد.
 */
const POSTEX_BASE_URL = (process.env.POSTEX_BASE_URL || "https://api.postex.ir").replace(/\/+$/, "");
const POSTEX_API_PREFIX = process.env.POSTEX_API_PREFIX || "/api/v1";
const GET_TIMEOUT_MS = Number(process.env.POSTEX_GET_TIMEOUT_MS || 15_000);
const POST_TIMEOUT_MS = Number(process.env.POSTEX_POST_TIMEOUT_MS || 45_000);
const CITIES_CACHE_TTL_MS = Number(process.env.POSTEX_CITIES_CACHE_MS || 6 * 60 * 60 * 1000);

export type PostexAddress = {
  name: string;
  mobile: string;
  province: string;
  city: string;
  postalCode: string;
  address: string;
};

export type PostexItem = {
  title: string;
  sku?: string;
  quantity: number;
  price: number;
  weight: number;
};

export type PostexErrorCode =
  | "not_configured"
  | "timeout"
  | "network"
  | "unauthorized"
  | "not_found"
  | "http"
  | "api"
  | "city_not_found";

export class PostexError extends Error {
  readonly code: PostexErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: PostexErrorCode, message: string, options: { status?: number; detail?: string } = {}) {
    super(message);
    this.name = "PostexError";
    this.code = code;
    this.status = options.status;
    this.detail = options.detail;
  }
}

/** پیام فارسی قابل نمایش به کاربر/مدیر بر اساس نوع خطا. */
export function describePostexError(error: unknown) {
  if (error instanceof PostexError) {
    switch (error.code) {
      case "not_configured":
        return "کلید API پستکس (POSTEX_API_KEY) روی هاست تنظیم نشده است.";
      case "timeout":
        return "پستکس در زمان تعیین‌شده پاسخ نداد (timeout).";
      case "network":
        return "اتصال شبکه به api.postex.ir برقرار نشد؛ خروجی اینترنت هاست یا DNS را بررسی کنید.";
      case "unauthorized":
        return "کلید API پستکس معتبر نیست یا IP سرور در پنل پستکس ثبت نشده است.";
      case "not_found":
        return "آدرس سرویس پستکس پیدا نشد (۴۰۴)؛ نسخهٔ API یا مسیر سرویس را بررسی کنید.";
      case "city_not_found":
        return error.message;
      default:
        return error.detail ? `${error.message} (${error.detail})` : error.message;
    }
  }
  return error instanceof Error ? error.message : "خطای ناشناخته در ارتباط با پستکس.";
}

function apiKey() {
  const key = process.env.POSTEX_API_KEY?.trim();
  if (!key) throw new PostexError("not_configured", "POSTEX_API_KEY is not configured.");
  return key;
}

function endpoint(path: string) {
  return `${POSTEX_BASE_URL}${path.startsWith("/api/") ? path : `${POSTEX_API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`}`;
}

async function postexFetch<T>(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const timeoutMs = method === "GET" ? GET_TIMEOUT_MS : POST_TIMEOUT_MS;
  const url = endpoint(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey(),
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof PostexError) throw error;
    const name = (error as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new PostexError("timeout", `Postex request timed out after ${timeoutMs}ms.`, { detail: url });
    }
    throw new PostexError("network", "Postex request failed before receiving a response.", {
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const raw = await response.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data as { message?: string; Message?: string } | null)?.message
      || (data as { Message?: string } | null)?.Message
      || `Postex API error ${response.status}`;
    if (response.status === 401 || response.status === 403) throw new PostexError("unauthorized", message, { status: response.status });
    if (response.status === 404) throw new PostexError("not_found", message, { status: response.status, detail: url });
    throw new PostexError("http", message, { status: response.status, detail: raw.slice(0, 300) });
  }

  // پاسخ ۲۰۰ ولی ناموفق (قالب رایج پستکس)
  const envelope = data as { IsSuccess?: boolean; isSuccess?: boolean; Message?: string; message?: string } | null;
  if (envelope && typeof envelope === "object") {
    const success = envelope.IsSuccess ?? envelope.isSuccess;
    if (success === false) {
      throw new PostexError("api", envelope.Message || envelope.message || "Postex rejected the request.", { status: response.status });
    }
  }
  return data as T;
}

/** استخراج آرایهٔ داده از قالب‌های مختلف پاسخ پستکس. */
function toRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const container = data as { entries?: unknown; data?: unknown; Data?: unknown; items?: unknown } | null;
  for (const value of [container?.entries, container?.data, container?.Data, container?.items]) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeFa(value: string) {
  return value.trim().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ");
}

export type PostexCity = { id: number; name: string; province: string };

let citiesCache: { at: number; cities: PostexCity[] } | null = null;

export async function listPostexCities(options: { forceRefresh?: boolean } = {}) {
  if (!options.forceRefresh && citiesCache && Date.now() - citiesCache.at < CITIES_CACHE_TTL_MS) {
    return citiesCache.cities;
  }
  const data = await postexFetch<unknown>("/locality/cities/all", { method: "GET" });
  const cities = toRows(data)
    .map((row) => {
      const item = row as Record<string, unknown>;
      return {
        id: Number(item.id || item.code || 0),
        name: String(item.cityName || item.name || item.city_name || "").trim(),
        province: String(item.provinceName || item.province_name || item.province || "").trim(),
      };
    })
    .filter((item) => item.id > 0 && item.name);
  if (cities.length) citiesCache = { at: Date.now(), cities };
  return cities;
}

async function cityCode(city: string) {
  const normalized = normalizeFa(city);
  const cities = await listPostexCities();
  const match = cities.find((item) => normalizeFa(item.name) === normalized)
    || cities.find((item) => normalizeFa(item.name).startsWith(normalized));
  if (!match) throw new PostexError("city_not_found", `شهر «${city}» در فهرست شهرهای پستکس پیدا نشد.`);
  return match.id;
}

async function originCityCode() {
  const configured = Number(process.env.POSTEX_ORIGIN_CITY_CODE);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return cityCode(process.env.POSTEX_ORIGIN_CITY || "اصفهان");
}

export async function getPostexQuote(input: {
  destinationCity: string;
  paymentType: "SENDER" | "COD" | "FREE_SHIPPING" | "RECEIVER";
  totalValue: number;
  totalWeight: number;
  length?: number;
  width?: number;
  height?: number;
}) {
  const [fromCityCode, toCityCode] = await Promise.all([originCityCode(), cityCode(input.destinationCity)]);
  return postexFetch<unknown>("/shipping/quotes", {
    method: "POST",
    body: JSON.stringify({
      collection_type: process.env.POSTEX_COLLECTION_TYPE || "pick_up",
      from_city_code: fromCityCode,
      parcels: [{
        custom_parcel_id: "miniroyal-quote",
        to_city_code: toCityCode,
        payment_type: input.paymentType,
        parcel_properties: {
          length: input.length || Number(process.env.POSTEX_DEFAULT_LENGTH_CM || 30),
          width: input.width || Number(process.env.POSTEX_DEFAULT_WIDTH_CM || 20),
          height: input.height || Number(process.env.POSTEX_DEFAULT_HEIGHT_CM || 10),
          total_weight: input.totalWeight,
          is_fragile: false,
          is_liquid: false,
          total_value: input.totalValue * 10,
          pre_paid_amount: input.paymentType === "SENDER" ? input.totalValue * 10 : 0,
          total_value_currency: "IRR",
          box_type_id: Number(process.env.POSTEX_DEFAULT_BOX_TYPE_ID || 0),
        },
      }],
      value_added_service: { request_label: true, request_packaging: false, request_sms_notification: true },
    }),
  });
}

/**
 * مبلغ کرایه را از پاسخ استعلام بیرون می‌کشد و به تومان برمی‌گرداند.
 * این کار قبلاً داخل صفحهٔ تسویه با حدس زدن نام کلیدها انجام می‌شد؛ حالا در سرور و
 * در یک جا انجام می‌شود تا رفتار قابل تست و قابل اصلاح باشد.
 */
export function extractQuotePriceToman(data: unknown): number | null {
  const candidates: number[] = [];
  const priceKey = /(price|amount|cost|fee|tariff|total)/i;
  const ignoreKey = /(value|weight|id|code|count|discount)/i;
  const walk = (node: unknown, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 6) return;
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (typeof child === "number" && child > 0 && priceKey.test(key) && !ignoreKey.test(key)) candidates.push(child);
      else if (child && typeof child === "object") walk(child, depth + 1);
    }
  };
  walk(data);
  if (!candidates.length) return null;
  // پستکس مبالغ را به ریال برمی‌گرداند؛ کمترین مبلغ معتبر به‌عنوان کرایهٔ پایه انتخاب می‌شود.
  const rial = Math.min(...candidates.filter((value) => value >= 1000));
  if (!Number.isFinite(rial)) return null;
  return Math.ceil(rial / 10);
}

export async function createPostexParcel(input: {
  orderNumber: string;
  recipient: PostexAddress;
  items: PostexItem[];
  paymentType: "SENDER" | "COD" | "FREE_SHIPPING" | "RECEIVER";
  totalValue: number;
}) {
  const fromCity = process.env.POSTEX_ORIGIN_CITY || "اصفهان";
  const [fromCityCode, toCityCode] = await Promise.all([originCityCode(), cityCode(input.recipient.city)]);
  return postexFetch<unknown>("/parcels/bulk", {
    method: "POST",
    body: JSON.stringify({
      collection_type: process.env.POSTEX_COLLECTION_TYPE || "pick_up",
      custom_channel: "miniroyal",
      parcels: [{
        from: { contact: { first_name: "مینی", last_name: "رویال", mobile_no: process.env.POSTEX_ORIGIN_MOBILE || "" }, location: { post_code: process.env.POSTEX_ORIGIN_POSTAL_CODE || "", city_id: fromCityCode, city_name: fromCity, address: process.env.POSTEX_ORIGIN_ADDRESS || "" } },
        to: { contact: { first_name: input.recipient.name, last_name: "", mobile_no: input.recipient.mobile }, location: { post_code: input.recipient.postalCode, city_id: toCityCode, city_name: input.recipient.city, address: input.recipient.address } },
        parcel_items: input.items.map((item) => ({ description: item.title, sku: item.sku || "", quantity: item.quantity, price: item.price, weight: item.weight })),
        parcel_properties: { length: Number(process.env.POSTEX_DEFAULT_LENGTH_CM || 30), width: Number(process.env.POSTEX_DEFAULT_WIDTH_CM || 20), height: Number(process.env.POSTEX_DEFAULT_HEIGHT_CM || 10), total_weight: input.items.reduce((sum, item) => sum + item.weight * item.quantity, 0), is_fragile: false, is_liquid: false, total_value: input.totalValue, pre_paid_amount: input.paymentType === "SENDER" ? input.totalValue : 0, total_value_currency: "IRR", box_type_id: Number(process.env.POSTEX_DEFAULT_BOX_TYPE_ID || 0) },
        courier: { name: process.env.POSTEX_COURIER_CODE || "", service_type: process.env.POSTEX_SERVICE_TYPE || "EXPRESS", payment_type: input.paymentType },
        added_service: { request_label: true, request_packaging: false, request_sms_notification: true },
        custom_order_no: input.orderNumber,
        ready_to_accept: true,
      }],
    }),
  });
}

export async function registerPostexOrder(order: Record<string, unknown>) {
  const address = {
    name: String(order.recipientName || ""),
    mobile: String(order.phone || ""),
    province: String(order.province || ""),
    city: String(order.city || ""),
    postalCode: String(order.postalCode || ""),
    address: String(order.address || ""),
  };
  let rawItems: unknown[] = [];
  if (Array.isArray(order.items)) rawItems = order.items;
  else if (typeof order.items_json === "string") {
    rawItems = order.items_json.split("||").map((item) => { try { return JSON.parse(item); } catch { return null; } }).filter(Boolean);
  }
  const items = rawItems.map((item) => {
    const value = item as { title?: string; quantity?: number; unitPrice?: number; sku?: string };
    return { title: String(value.title || "لباس کودک"), sku: value.sku, quantity: Number(value.quantity || 1), price: Number(value.unitPrice || 0) * 10, weight: Number(process.env.POSTEX_DEFAULT_ITEM_WEIGHT_GRAMS || 500) };
  });
  return createPostexParcel({ orderNumber: String(order.orderNumber), recipient: address, items, paymentType: order.paymentMethod === "cod" ? "COD" : "SENDER", totalValue: Number(order.finalTotal || 0) * 10 });
}

export async function trackPostexParcel(parcelNo: string) {
  return postexFetch<unknown>(`/tracking/events/${encodeURIComponent(parcelNo)}`, { method: "GET" });
}

/**
 * تست سلامت اتصال: نقطهٔ `user/whoami` سبک‌ترین سرویس پستکس است و اعتبار کلید و
 * دسترسی IP را یک‌جا مشخص می‌کند. خروجی آن در /admin/health نمایش داده می‌شود.
 */
export async function checkPostexConnection() {
  const startedAt = Date.now();
  if (!postexConfigured()) {
    return { ok: false, configured: false, code: "not_configured" as PostexErrorCode, message: describePostexError(new PostexError("not_configured", "")), durationMs: 0 };
  }
  try {
    const data = await postexFetch<unknown>("/user/whoami", { method: "GET" });
    return { ok: true, configured: true, durationMs: Date.now() - startedAt, data };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      code: error instanceof PostexError ? error.code : ("http" as PostexErrorCode),
      status: error instanceof PostexError ? error.status : undefined,
      message: describePostexError(error),
      durationMs: Date.now() - startedAt,
    };
  }
}

export function extractPostexIdentifiers(data: unknown) {
  const root = data as { entries?: unknown; data?: unknown };
  const values: unknown[] = [root, root?.entries, root?.data];
  const find = (key: string) => values.map((value) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined)).find(Boolean);
  return {
    parcelNo: String(find("parcel_no") || find("parcelNo") || find("id") || ""),
    orderNo: String(find("order_no") || find("orderNo") || ""),
    trackingCode: String(find("tracking_no") || find("trackingCode") || find("barcode") || ""),
  };
}

export function postexConfigured() {
  return Boolean(process.env.POSTEX_API_KEY?.trim());
}
