const TIPAX_BASE_URL = (process.env.TIPAX_BASE_URL || "https://omapi.tipax.ir").replace(/\/$/, "");
// رله ایرانی اختیاری: سایت از آلمان مستقیماً به تیپاکس (IR Access) دسترسی ندارد.
// اگر TIPAX_RELAY_URL تنظیم شده باشد، همه درخواست‌ها از طریق رله (میزبان‌فا) ارسال می‌شوند.
const TIPAX_RELAY_URL = process.env.TIPAX_RELAY_URL?.trim().replace(/\/$/, "") || "";
const TIPAX_RELAY_SECRET = process.env.TIPAX_RELAY_SECRET?.trim() || "";

function resolveUrl(path: string): { url: string; headersPath?: string } {
  if (!TIPAX_RELAY_URL) return { url: `${TIPAX_BASE_URL}${path}` };
  // مسیر از طریق هدر ارسال می‌شود تا فایروال هاست اشتراکی، کوئری‌استرینگ
  // حاوی «/api/...» را به عنوان الگوی مشکوک بلاک نکند.
  return { url: `${TIPAX_RELAY_URL}?service=tipax`, headersPath: path };
}

let tokenCache: { accessToken: string; refreshToken?: string; expiresAt: number } | null = null;

type TipaxEnvelope<T> = { data?: T; result?: T; isSuccess?: boolean; message?: string; statusCode?: string };

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function tipaxFetch<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const { url, headersPath } = resolveUrl(path);
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        ...(headersPath ? { "X-Relay-Path": headersPath } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(TIPAX_RELAY_SECRET ? { "X-Relay-Secret": TIPAX_RELAY_SECRET } : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
    const raw = await response.text();
    let data: unknown = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) {
      const message = data && typeof data === "object" && "message" in data ? String((data as { message?: unknown }).message || "") : "";
      throw new Error(`Tipax API ${response.status}: ${message || "request failed"}`);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

function unwrap<T>(value: T | TipaxEnvelope<T>): T {
  if (value && typeof value === "object") {
    const item = value as TipaxEnvelope<T>;
    if (item.data !== undefined) return item.data;
    if (item.result !== undefined) return item.result;
  }
  return value as T;
}

async function authenticate() {
  const payload = {
    username: required("TIPAX_USERNAME"),
    password: required("TIPAX_PASSWORD"),
    apiKey: required("TIPAX_API_KEY"),
  };
  const response = await tipaxFetch<TipaxEnvelope<{ accessToken?: string; refreshToken?: string; expiresIn?: number }> | { accessToken?: string; refreshToken?: string; expiresIn?: number }>("/api/OM/v3/Account/token", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const tokenData = unwrap(response);
  const accessToken = tokenData?.accessToken;
  if (!accessToken) throw new Error("Tipax authentication succeeded without an access token.");
  tokenCache = { accessToken, refreshToken: tokenData.refreshToken, expiresAt: Date.now() + Math.max(60, Number(tokenData.expiresIn || 1800) - 60) * 1000 };
  return tokenCache;
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.accessToken;
  return (await authenticate()).accessToken;
}

export async function tipaxRequest<T>(path: string, init: RequestInit = {}) {
  try {
    return await tipaxFetch<T>(path, init, await accessToken());
  } catch (error) {
    if (tokenCache && /401|unauthorized|expired/i.test(error instanceof Error ? error.message : "")) {
      tokenCache = null;
      return tipaxFetch<T>(path, init, await accessToken());
    }
    throw error;
  }
}

export async function listTipaxCities() {
  return unwrap(await tipaxRequest<unknown>("/api/OM/v3/Cities"));
}

export async function listTipaxAddresses() {
  return unwrap(await tipaxRequest<unknown>("/api/OM/v3/Addresses/Book"));
}

export async function getTipaxWallet() {
  return unwrap(await tipaxRequest<unknown>("/api/OM/v3/Customers/Wallet"));
}

export async function listTipaxPackaging() {
  const [packaging, contents] = await Promise.all([
    tipaxRequest<unknown>("/api/OM/v3/PackingPrices"),
    tipaxRequest<unknown>("/api/OM/v3/PackContentRates"),
  ]);
  return { packaging: unwrap(packaging), contents: unwrap(contents) };
}

export function tipaxConfigured() {
  return Boolean(process.env.TIPAX_API_KEY?.trim() && process.env.TIPAX_USERNAME?.trim() && process.env.TIPAX_PASSWORD?.trim());
}

export function tipaxBaseUrl() {
  return TIPAX_BASE_URL;
}
