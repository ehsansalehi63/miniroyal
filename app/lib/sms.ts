/**
 * لایهٔ ارسال پیامک مینی رویال (OTP ورود مشتری)
 *
 * نکتهٔ مهم معماری: تنها «منبع حقیقت» برای اینکه پیامک ارسال می‌شود یا نه،
 * تابع resolveOtpPlan است. هم sendOtp (ارسال واقعی) و هم describeSmsConfig
 * (صفحهٔ سلامت و ابزار عیب‌یابی) از همان یک تابع استفاده می‌کنند تا هیچ‌وقت
 * «گزارش سلامت» با «رفتار واقعی ارسال» اختلاف پیدا نکند.
 *
 * سرویس‌دهنده‌های پشتیبانی‌شده:
 *   iranpayamak / farazsms  → https://api.iranpayamak.com  (پترن یا متن ساده)
 *   kavenegar               → https://api.kavenegar.com
 *   smsir / sms.ir          → https://api.sms.ir           (سریع با templateId یا خط اختصاصی)
 *   console                 → فقط توسعه؛ کد را در لاگ چاپ می‌کند و پیامکی نمی‌فرستد
 */

export type SmsChannel = "console" | "iranpayamak" | "kavenegar" | "smsir";

export const SUPPORTED_SMS_PROVIDERS = [
  "iranpayamak",
  "farazsms",
  "kavenegar",
  "smsir",
  "console",
] as const;

/** نام‌های جایگزینی که در پنل‌ها و .env رایج‌اند. */
const PROVIDER_ALIASES: Record<string, SmsChannel> = {
  console: "console",
  log: "console",
  iranpayamak: "iranpayamak",
  "iran-payamak": "iranpayamak",
  "iran_payamak": "iranpayamak",
  farazsms: "iranpayamak", // FarazSMS و IranPayamak یک سرویس‌اند (api.iranpayamak.com)
  faraz: "iranpayamak",
  kavenegar: "kavenegar",
  smsir: "smsir",
  "sms.ir": "smsir",
  sms_ir: "smsir",
};

const IRANPAYAMAK_PATTERN_URL = "https://api.iranpayamak.com/ws/v1/sms/pattern";
const IRANPAYAMAK_SIMPLE_URL = "https://api.iranpayamak.com/ws/v1/sms/simple";
const SMSIR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";
const SMSIR_SEND_URL = "https://api.sms.ir/v1/send/";
const FETCH_TIMEOUT_MS = 10_000;

/** مقدار خام env را تمیز می‌کند: فاصله/نقل‌قول اطراف و «undefined» نوشته‌شده را حذف می‌کند. */
export function envValue(value: string | undefined | null) {
  const cleaned = (value || "").trim().replace(/^['"`]|['"`]$/g, "").trim();
  return cleaned === "undefined" || cleaned === "null" ? "" : cleaned;
}

function flag(value: string | undefined | null) {
  const v = envValue(value).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

/**
 * حالت console فقط وقتی مجاز است که صریحاً فعال شده باشد
 * (SMS_CONSOLE_FALLBACK=true) یا واقعاً در حالت توسعه باشیم.
 *
 * چرا این شرط لازم است؟ Next.js در سرور سفارشی (server.js + next({dev:false}))
 * مقدار process.env.NODE_ENV را «production» قرار نمی‌دهد؛ @next/env فقط از
 * NODE_ENV برای انتخاب فایل .env مناسب استفاده می‌کند. در نتیجه روی هاست،
 * NODE_ENV معمولاً undefined است و شرط قبلی (NODE_ENV === "production")
 * هرگز true نمی‌شد: کد OTP در لاگ چاپ می‌شد، API هم success برمی‌گرداند،
 * ولی هیچ پیامکی ارسال نمی‌شد.
 */
function consoleFallbackAllowed(env: NodeJS.ProcessEnv) {
  if (flag(env.SMS_CONSOLE_FALLBACK)) return true;
  return envValue(env.NODE_ENV).toLowerCase() === "development";
}

type OtpPlan =
  | { kind: "console"; phone: string; code: string }
  | { kind: "iranpayamak-pattern"; apiKey: string; lineNumber: string; patternCode: string; phone: string; code: string }
  | { kind: "iranpayamak-simple"; apiKey: string; lineNumber: string; text: string; phone: string }
  | { kind: "kavenegar"; apiKey: string; text: string; phone: string }
  | { kind: "smsir-verify"; apiKey: string; templateId: string; phone: string; code: string }
  | { kind: "smsir-send"; apiKey: string; lineNumber: string; text: string; phone: string }
  | { kind: "error"; message: string };

export function otpText(code: string) {
  return `کد تایید مینی رویال: ${code}`;
}

/** تصمیم می‌گیرد پیامک از کدام مسیر برود؛ در صورت نبود پیکربندی، دلیل دقیق را برمی‌گرداند. */
export function resolveOtpPlan(phone: string, code: string, env: NodeJS.ProcessEnv = process.env): OtpPlan {
  const rawProvider = envValue(env.SMS_PROVIDER);
  const providerKey = rawProvider.toLowerCase();
  const provider = providerKey ? PROVIDER_ALIASES[providerKey] : undefined;

  if (!rawProvider) {
    return {
      kind: "error",
      message:
        "SMS_PROVIDER تنظیم نشده است. برای ارسال واقعی پیامک، SMS_PROVIDER و SMS_API_KEY را در .env سرور مقداردهی و سرویس را ری‌استارت کنید.",
    };
  }
  if (!provider) {
    return {
      kind: "error",
      message: `سرویس پیامک «${rawProvider}» پشتیبانی نمی‌شود. مقادیر معتبر: ${SUPPORTED_SMS_PROVIDERS.join("، ")}.`,
    };
  }

  if (provider === "console") {
    if (!consoleFallbackAllowed(env)) {
      return {
        kind: "error",
        message:
          "SMS_PROVIDER روی console است، یعنی پیامکی ارسال نمی‌شود و کد فقط در لاگ سرور چاپ می‌شود. یک سرویس واقعی (iranpayamak/kavenegar/smsir) تنظیم کنید.",
      };
    }
    return { kind: "console", phone, code };
  }

  const apiKey = envValue(env.SMS_API_KEY);
  if (!apiKey) {
    return { kind: "error", message: "SMS_API_KEY تنظیم نشده یا خالی است." };
  }
  const lineNumber = envValue(env.SMS_LINE_NUMBER);
  const patternCode = envValue(env.SMS_PATTERN_CODE);

  if (provider === "iranpayamak") {
    if (patternCode) {
      if (!lineNumber) {
        return {
          kind: "error",
          message: "SMS_LINE_NUMBER تنظیم نشده است؛ ارسال پترن ایران‌پیامک بدون شماره خط ممکن نیست.",
        };
      }
      return { kind: "iranpayamak-pattern", apiKey, lineNumber, patternCode, phone, code };
    }
    if (!lineNumber) {
      return {
        kind: "error",
        message: "SMS_LINE_NUMBER تنظیم نشده است؛ ایران‌پیامک برای ارسال متن ساده به شماره خط نیاز دارد.",
      };
    }
    return { kind: "iranpayamak-simple", apiKey, lineNumber, text: otpText(code), phone };
  }

  if (provider === "kavenegar") {
    return { kind: "kavenegar", apiKey, text: otpText(code), phone };
  }

  // sms.ir
  const templateId = envValue(env.SMSIR_TEMPLATE_ID);
  if (templateId) {
    return { kind: "smsir-verify", apiKey, templateId, phone, code };
  }
  if (!lineNumber) {
    return {
      kind: "error",
      message:
        "برای SMS.ir یا SMSIR_TEMPLATE_ID (ارسال سریع OTP) یا SMS_LINE_NUMBER (خط اختصاصی) لازم است.",
    };
  }
  return { kind: "smsir-send", apiKey, lineNumber, text: otpText(code), phone };
}

export interface SmsConfigReport {
  /** آیا مسیر ارسال واقعی (غیر console) آماده است؟ */
  configured: boolean;
  rawProvider: string;
  provider: SmsChannel | null;
  /** مسیری که یک OTP واقعی از آن ارسال می‌شود. */
  mode: OtpPlan["kind"] | null;
  hasApiKey: boolean;
  hasLineNumber: boolean;
  hasPatternCode: boolean;
  hasSmsIrTemplate: boolean;
  apiKeyPreview: string;
  lineNumber: string;
  patternCode: string;
  consoleFallbackAllowed: boolean;
  /** دلیل‌های فارسیِ اینکه چرا پیامک ارسال نمی‌شود. */
  problems: string[];
  detail: string;
}

/** وضعیت واقعی پیکربندی پیامک — برای صفحهٔ سلامت و ابزار عیب‌یابی. */
export function describeSmsConfig(env: NodeJS.ProcessEnv = process.env): SmsConfigReport {
  const rawProvider = envValue(env.SMS_PROVIDER);
  const providerKey = rawProvider.toLowerCase();
  const provider = providerKey ? (PROVIDER_ALIASES[providerKey] ?? null) : null;
  const apiKey = envValue(env.SMS_API_KEY);
  const lineNumber = envValue(env.SMS_LINE_NUMBER);
  const patternCode = envValue(env.SMS_PATTERN_CODE);
  const smsIrTemplate = envValue(env.SMSIR_TEMPLATE_ID);
  const allowConsole = consoleFallbackAllowed(env);

  const probe = resolveOtpPlan("09120000000", "123456", env);
  const problems: string[] = [];
  if (probe.kind === "error") problems.push(probe.message);

  if (!rawProvider) {
    problems.push("SMS_PROVIDER خالی است؛ در این حالت کد OTP فقط در لاگ چاپ می‌شود (console).");
  } else if (!provider) {
    problems.push(`SMS_PROVIDER=${rawProvider} در کد پیاده‌سازی نشده است.`);
  }

  if (provider === "console" && allowConsole) {
    problems.push("حالت console فعال است: پیامک واقعی ارسال نمی‌شود، کد فقط در لاگ ثبت می‌شود.");
  }

  const configured = probe.kind !== "error" && probe.kind !== "console";

  return {
    configured,
    rawProvider,
    provider,
    mode: probe.kind === "error" ? null : probe.kind,
    hasApiKey: Boolean(apiKey),
    hasLineNumber: Boolean(lineNumber),
    hasPatternCode: Boolean(patternCode),
    hasSmsIrTemplate: Boolean(smsIrTemplate),
    apiKeyPreview: maskSecret(apiKey),
    lineNumber,
    patternCode,
    consoleFallbackAllowed: allowConsole,
    problems: Array.from(new Set(problems)),
    detail: configured
      ? `ارسال پیامک فعال است (سرویس ${provider}، مسیر ${probe.kind}).`
      : problems.length
        ? problems[0]
        : "ارسال پیامک پیکربندی نشده است.",
  };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, status: response.status, ok: response.ok, text, json };
}

function shortBody(text: string, limit = 300) {
  const oneLine = (text || "").replace(/\s+/g, " ").trim();
  return oneLine.length > limit ? `${oneLine.slice(0, limit)}…` : oneLine || "(بدون پاسخ)";
}

function networkErrorMessage(error: unknown, host: string) {
  const raw = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "cause" in error
    ? String((error as { cause?: { code?: string } }).cause?.code || "")
    : "";
  return `اتصال شبکه به ${host} برقرار نشد (${raw}${code ? ` / ${code}` : ""}). خروجی پورت ۴۴۳ سرور یا DNS را بررسی کنید.`;
}

export interface SendOtpResult {
  channel: SmsChannel;
  mode: OtpPlan["kind"];
  /** برای دیباگ؛ در پاسخ کاربر نهایی نمایش داده نمی‌شود. */
  detail: string;
}

/** ارسال واقعی کد تایید. در صورت شکست، دلیل دقیق در لاگ سرور ثبت و به‌صورت خطا پرتاب می‌شود. */
export async function sendOtp(phone: string, code: string, env: NodeJS.ProcessEnv = process.env): Promise<SendOtpResult> {
  const plan = resolveOtpPlan(phone, code, env);

  if (plan.kind === "error") {
    console.error(`[MiniRoyal SMS] ارسال لغو شد: ${plan.message}`);
    throw new Error(plan.message);
  }

  if (plan.kind === "console") {
    console.warn(
      `[MiniRoyal OTP] حالت console فعال است — پیامکی ارسال نشد. phone=${phone} code=${code}`
    );
    return { channel: "console", mode: "console", detail: "کد در لاگ سرور ثبت شد (بدون ارسال پیامک)." };
  }

  try {
    if (plan.kind === "iranpayamak-pattern") {
      const result = await postJson(
        IRANPAYAMAK_PATTERN_URL,
        { "Api-Key": plan.apiKey },
        {
          code: plan.patternCode,
          attributes: { var1: plan.code },
          recipient: plan.phone,
          line_number: plan.lineNumber,
          number_format: "english",
          schedule: null,
        }
      );
      const parsed = result.json as { status?: string; messages?: string } | null;
      if (!result.ok || parsed?.status !== "success") {
        console.error("[MiniRoyal SMS] ایران‌پیامک (پترن) ناموفق بود:", {
          status: result.status,
          body: shortBody(result.text),
        });
        throw new Error(`ارسال کد تایید از الگوی ایران‌پیامک انجام نشد (HTTP ${result.status}).`);
      }
      return { channel: "iranpayamak", mode: "iranpayamak-pattern", detail: "پترن OTP ایران‌پیامک ثبت شد." };
    }

    if (plan.kind === "iranpayamak-simple") {
      const result = await postJson(
        IRANPAYAMAK_SIMPLE_URL,
        { "Api-Key": plan.apiKey },
        {
          text: plan.text,
          line_number: plan.lineNumber,
          recipients: [plan.phone],
          number_format: "english",
          schedule: null,
        }
      );
      const parsed = result.json as { status?: string } | null;
      if (!result.ok || parsed?.status !== "success") {
        console.error("[MiniRoyal SMS] ایران‌پیامک (متن ساده) ناموفق بود:", {
          status: result.status,
          body: shortBody(result.text),
        });
        throw new Error(`ارسال پیامک از ایران‌پیامک انجام نشد (HTTP ${result.status}).`);
      }
      return { channel: "iranpayamak", mode: "iranpayamak-simple", detail: "پیامک متنی ایران‌پیامک ثبت شد." };
    }

    if (plan.kind === "kavenegar") {
      const url = `https://api.kavenegar.com/v1/${encodeURIComponent(plan.apiKey)}/sms/send.json`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ receptor: plan.phone, message: plan.text }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const text = await response.text();
      let parsed: { return?: { status?: number | string; message?: string }; entries?: unknown[] } | null = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      const status = Number(parsed?.return?.status);
      const accepted = response.ok && (status === 200 || status === 201);
      if (!accepted) {
        console.error("[MiniRoyal SMS] کاوه‌نگار ناموفق بود:", {
          httpStatus: response.status,
          body: shortBody(text),
        });
        throw new Error(
          `ارسال پیامک از کاوه‌نگار انجام نشد (HTTP ${response.status}${parsed?.return?.message ? ` — ${parsed.return.message}` : ""}).`
        );
      }
      return { channel: "kavenegar", mode: "kavenegar", detail: "پیامک کاوه‌نگار ثبت شد." };
    }

    if (plan.kind === "smsir-verify") {
      const result = await postJson(
        SMSIR_VERIFY_URL,
        { "x-api-key": plan.apiKey },
        {
          mobile: plan.phone,
          templateId: Number(plan.templateId),
          parameters: [{ name: "CODE", value: plan.code }],
        }
      );
      const parsed = result.json as { status?: number; message?: string } | null;
      if (!result.ok || Number(parsed?.status) !== 1) {
        console.error("[MiniRoyal SMS] ارسال سریع SMS.ir ناموفق بود:", {
          status: result.status,
          body: shortBody(result.text),
        });
        throw new Error(
          `ارسال سریع OTP از SMS.ir انجام نشد (HTTP ${result.status}${parsed?.message ? ` — ${parsed.message}` : ""}).`
        );
      }
      return { channel: "smsir", mode: "smsir-verify", detail: "ارسال سریع SMS.ir ثبت شد." };
    }

    // smsir-send
    const result = await postJson(
      SMSIR_SEND_URL,
      { "x-api-key": plan.apiKey },
      { lineNumber: plan.lineNumber, messageText: plan.text, mobiles: [plan.phone] }
    );
    const parsed = result.json as { status?: number; message?: string } | null;
    if (!result.ok || Number(parsed?.status) !== 1) {
      console.error("[MiniRoyal SMS] SMS.ir ناموفق بود:", {
        status: result.status,
        body: shortBody(result.text),
      });
      throw new Error(
        `ارسال پیامک از SMS.ir انجام نشد (HTTP ${result.status}${parsed?.message ? ` — ${parsed.message}` : ""}).`
      );
    }
    return { channel: "smsir", mode: "smsir-send", detail: "پیامک SMS.ir ثبت شد." };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      const message = `پاسخ سرویس پیامک بیش از ${FETCH_TIMEOUT_MS / 1000} ثانیه طول کشید.`;
      console.error("[MiniRoyal SMS]", message);
      throw new Error(message);
    }
    if (error instanceof Error && (error.name === "TypeError" || /fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(error.message))) {
      const message = networkErrorMessage(error, "سرویس پیامک");
      console.error("[MiniRoyal SMS]", message);
      throw new Error(message);
    }
    throw error;
  }
}
