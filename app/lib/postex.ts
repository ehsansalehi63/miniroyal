const POSTEX_BASE_URL = process.env.POSTEX_BASE_URL || "https://api.postex.ir";

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

function apiKey() {
  const key = process.env.POSTEX_API_KEY?.trim();
  if (!key) throw new Error("POSTEX_API_KEY is not configured.");
  return key;
}

async function postexFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${POSTEX_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Postex API error ${response.status}`);
  return data as T;
}

async function cityCode(city: string) {
  const data = await postexFetch<unknown>("/api/v1/locality/cities/all", { method: "GET" });
  const rows = Array.isArray(data) ? data : (data as { entries?: unknown[] })?.entries || (data as { data?: unknown[] })?.data || [];
  const normalized = city.trim().replace(/ي/g, "ی").replace(/ك/g, "ک");
  const match = rows.find((row) => {
    const item = row as { id?: number; code?: number; cityName?: string; name?: string };
    return [item.cityName, item.name].filter(Boolean).some((name) => String(name).trim().replace(/ي/g, "ی").replace(/ك/g, "ک") === normalized);
  }) as { id?: number; code?: number } | undefined;
  const code = match?.id ?? match?.code;
  if (!code) throw new Error(`Postex city code was not found for ${city}.`);
  return Number(code);
}

export async function listPostexCities() {
  const data = await postexFetch<unknown>("/api/v1/locality/cities/all", { method: "GET" });
  const rows = Array.isArray(data) ? data : (data as { entries?: unknown[]; data?: unknown[] })?.entries || (data as { data?: unknown[] })?.data || [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: Number(item.id || item.code || 0),
      name: String(item.cityName || item.name || item.city_name || "").trim(),
      province: String(item.provinceName || item.province_name || item.province || "").trim(),
    };
  }).filter((item) => item.id > 0 && item.name);
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
  const fromCityCode = Number(process.env.POSTEX_ORIGIN_CITY_CODE || await cityCode(process.env.POSTEX_ORIGIN_CITY || "اصفهان"));
  const toCityCode = await cityCode(input.destinationCity);
  return postexFetch<unknown>("/api/v1/shipping/quotes", {
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

export async function createPostexParcel(input: {
  orderNumber: string;
  recipient: PostexAddress;
  items: PostexItem[];
  paymentType: "SENDER" | "COD" | "FREE_SHIPPING" | "RECEIVER";
  totalValue: number;
}) {
  const fromCity = process.env.POSTEX_ORIGIN_CITY || "اصفهان";
  const fromCityCode = Number(process.env.POSTEX_ORIGIN_CITY_CODE || await cityCode(fromCity));
  const toCityCode = await cityCode(input.recipient.city);
  return postexFetch<unknown>("/api/v1/parcels/bulk", {
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
  return postexFetch<unknown>(`/api/v1/tracking/events/${encodeURIComponent(parcelNo)}`, { method: "GET" });
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
