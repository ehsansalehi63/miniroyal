#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * بررسی خودکار لایهٔ پیامک مینی رویال.
 *
 * این اسکریپت «کد واقعی» app/lib/sms.ts را با tsc خود پروژه کامپایل می‌کند و
 * همان را اجرا می‌کند (نه یک کپی از منطق). فقط fetch با یک mock عوض می‌شود تا
 * بتوان بدون کلید واقعی و بدون خروجی اینترنت، مسیر تصمیم‌گیری و بدنهٔ درخواست
 * ارسال‌شده به هر سرویس پیامک را بررسی کرد.
 *
 * اجرا:  node scripts/check-sms.cjs
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "miniroyal-sms-"));
const tsc = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

process.stdout.write("کامپایل app/lib/sms.ts با tsc خود پروژه...\n");
execFileSync(process.execPath, [
  tsc,
  path.join(repoRoot, "app", "lib", "sms.ts"),
  "--outDir", outDir,
  "--module", "commonjs",
  "--target", "es2022",
  "--lib", "es2022,dom",
  "--esModuleInterop",
  "--skipLibCheck",
], { cwd: repoRoot, stdio: "inherit" });

const sms = require(path.join(outDir, "sms.js"));

/** mock شدن fetch: درخواست‌ها را ضبط می‌کند و پاسخ ساختگی می‌دهد. */
let calls = [];
let responder = null;

/** پاسخ پیش‌فرض «موفق» متناسب با هر سرویس (بدون نیاز به کلید واقعی). */
function defaultResponse(url) {
  if (url.includes("kavenegar.com")) return { status: 200, body: JSON.stringify({ return: { status: 200, message: "successful" }, entries: ["12345"] }) };
  if (url.includes("api.sms.ir")) return { status: 200, body: JSON.stringify({ status: 1, message: "موفق" }) };
  return { status: 200, body: JSON.stringify({ status: "success", data: 0 }) };
}

global.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method, headers: init.headers || {}, body: init.body });
  const r = responder ? responder(String(url), init) : defaultResponse(String(url));
  if (r.throw) throw r.throw;
  return {
    ok: r.status >= 200 && r.status < 300,
    status: r.status,
    text: async () => r.body,
    json: async () => JSON.parse(r.body),
  };
};

/** پاسخ ساختگی تست بعدی را تعیین می‌کند؛ null یعنی پاسخ موفق پیش‌فرض. */
function setResponder(fn) {
  responder = fn;
}

const PHONE = "09120000000";
const CODE = "482913";
let pass = 0;
let fail = 0;

/** فقط درخواست‌های ضبط‌شده را پاک می‌کند (responder دست‌نخورده می‌ماند). */
function reset() {
  calls = [];
}

function check(name, condition, extra = "") {
  if (condition) {
    pass += 1;
    process.stdout.write(`  \x1b[32m✔\x1b[0m ${name}\n`);
  } else {
    fail += 1;
    process.stdout.write(`  \x1b[31m✘\x1b[0m ${name}${extra ? ` → ${extra}` : ""}\n`);
  }
}

async function expectError(name, env, needle) {
  reset();
  try {
    await sms.sendOtp(PHONE, CODE, env);
    check(name, false, "انتظار خطا بود ولی ارسال موفق برگشت");
  } catch (error) {
    const msg = String(error.message);
    check(name, msg.includes(needle), `پیام خطا: ${msg}`);
  }
}

async function expectSend(name, env, assertOnCall) {
  reset();
  try {
    const result = await sms.sendOtp(PHONE, CODE, env);
    if (calls.length !== 1) {
      check(name, false, `تعداد فراخوانی fetch = ${calls.length}`);
      return;
    }
    const detail = assertOnCall(calls[0], result);
    check(name, detail === true, typeof detail === "string" ? detail : "");
  } catch (error) {
    check(name, false, `خطای غیرمنتظره: ${error.message}`);
  }
}

(async () => {
  process.stdout.write("\n۱) پیکربندی ناقص باید «خطا» بدهد، نه موفقیت خاموش\n");

  await expectError("بدون SMS_PROVIDER → خطای واضح", {}, "SMS_PROVIDER");
  await expectError(
    "console + NODE_ENV=production → خطا (قبلاً هم خطا بود)",
    { NODE_ENV: "production", SMS_PROVIDER: "console" },
    "console"
  );
  // ریشهٔ اصلی باگ: NODE_ENV روی هاست undefined است و کد در لاگ چاپ می‌شد و success برمی‌گشت
  await expectError(
    "console بدون NODE_ENV (حالت واقعی هاست) → دیگر موفقیت خاموش نیست",
    { SMS_PROVIDER: "console" },
    "console"
  );
  await expectError("provider ناشناخته → خطا", { SMS_PROVIDER: "melipayamak", SMS_API_KEY: "k" }, "پشتیبانی نمی‌شود");
  await expectError("iranpayamak بدون کلید → خطا", { SMS_PROVIDER: "iranpayamak" }, "SMS_API_KEY");
  await expectError(
    "iranpayamak پترن بدون خط → خطا",
    { SMS_PROVIDER: "iranpayamak", SMS_API_KEY: "k", SMS_PATTERN_CODE: "100100" },
    "SMS_LINE_NUMBER"
  );
  await expectError(
    "smsir بدون templateId و بدون خط → خطا",
    { SMS_PROVIDER: "smsir", SMS_API_KEY: "k" },
    "SMS_LINE_NUMBER"
  );

  process.stdout.write("\n۲) حالت console فقط با opt-in صریح\n");
  reset();
  {
    const r = await sms.sendOtp(PHONE, CODE, { SMS_CONSOLE_FALLBACK: "true", SMS_PROVIDER: "console" });
    check("SMS_CONSOLE_FALLBACK=true → کانال console و بدون fetch", r.channel === "console" && calls.length === 0,
      `channel=${r.channel}, fetch=${calls.length}`);
  }
  reset();
  {
    const r = await sms.sendOtp(PHONE, CODE, { NODE_ENV: "development", SMS_PROVIDER: "console" });
    check("NODE_ENV=development → کانال console", r.channel === "console" && calls.length === 0);
  }

  process.stdout.write("\n۳) ایران‌پیامک (پترن و متن ساده)\n");
  await expectSend(
    "پترن → POST به /ws/v1/sms/pattern با بدنهٔ درست",
    { SMS_PROVIDER: "iranpayamak", SMS_API_KEY: "KEY123", SMS_LINE_NUMBER: "5000123", SMS_PATTERN_CODE: "100100" },
    (c) => {
      const body = JSON.parse(c.body);
      if (!c.url.endsWith("/ws/v1/sms/pattern")) return `URL اشتباه: ${c.url}`;
      if (c.headers["Api-Key"] !== "KEY123") return "هدر Api-Key اشتباه است";
      if (body.code !== "100100" || body.attributes.var1 !== CODE || body.recipient !== PHONE || body.line_number !== "5000123") {
        return `بدنه اشتباه: ${c.body}`;
      }
      return true;
    }
  );
  await expectSend(
    "بدون پترن → POST به /ws/v1/sms/simple با recipients",
    { SMS_PROVIDER: "iranpayamak", SMS_API_KEY: "KEY123", SMS_LINE_NUMBER: "5000123" },
    (c) => {
      const body = JSON.parse(c.body);
      if (!c.url.endsWith("/ws/v1/sms/simple")) return `URL اشتباه: ${c.url}`;
      if (!Array.isArray(body.recipients) || body.recipients[0] !== PHONE) return `بدنه اشتباه: ${c.body}`;
      if (!body.text.includes(CODE)) return "کد داخل متن پیامک نیست";
      return true;
    }
  );
  await expectSend(
    "farazsms به‌عنوان نام جایگزین ایران‌پیامک کار می‌کند",
    { SMS_PROVIDER: "farazsms", SMS_API_KEY: "KEY123", SMS_LINE_NUMBER: "5000123", SMS_PATTERN_CODE: "100100" },
    (c, r) => (r.channel === "iranpayamak" && c.url.includes("iranpayamak.com") ? true : `channel=${r.channel} url=${c.url}`)
  );
  reset();
  setResponder(() => ({ status: 401, body: JSON.stringify({ status: "failed", messages: "invalid api key" }) }));
  await expectError(
    "پاسخ ۴۰۱ ایران‌پیامک → خطا با کد وضعیت",
    { SMS_PROVIDER: "iranpayamak", SMS_API_KEY: "BAD", SMS_LINE_NUMBER: "5000123", SMS_PATTERN_CODE: "100100" },
    "401"
  );

  setResponder(null);
  process.stdout.write("\n۴) کاوه‌نگار\n");
  await expectSend(
    "کاوه‌نگار → URL شامل کلید و بدنهٔ form",
    { SMS_PROVIDER: "kavenegar", SMS_API_KEY: "KAV-KEY" },
    (c) => {
      if (!c.url.includes("/v1/KAV-KEY/sms/send.json")) return `URL اشتباه: ${c.url}`;
      const params = new URLSearchParams(c.body);
      if (params.get("receptor") !== PHONE) return "receptor اشتباه است";
      if (!params.get("message").includes(CODE)) return "کد داخل message نیست";
      return true;
    }
  );
  reset();
  setResponder(() => ({ status: 200, body: JSON.stringify({ return: { status: 501, message: "credit is empty" }, entries: [] }) }));
  await expectError(
    "کاوه‌نگار با status داخلی ۵۰۱ → خطا (قبلاً رد می‌شد چون HTTP 200 بود)",
    { SMS_PROVIDER: "kavenegar", SMS_API_KEY: "KAV-KEY" },
    "credit is empty"
  );

  setResponder(null);
  process.stdout.write("\n۵) SMS.ir\n");
  await expectSend(
    "با SMSIR_TEMPLATE_ID → ارسال سریع /v1/send/verify",
    { SMS_PROVIDER: "smsir", SMS_API_KEY: "SIR", SMSIR_TEMPLATE_ID: "123456" },
    (c) => {
      const body = JSON.parse(c.body);
      if (!c.url.endsWith("/v1/send/verify")) return `URL اشتباه: ${c.url}`;
      if (c.headers["x-api-key"] !== "SIR") return "هدر x-api-key اشتباه است";
      if (body.mobile !== PHONE || body.templateId !== 123456) return `بدنه اشتباه: ${c.body}`;
      if (body.parameters[0].name !== "CODE" || body.parameters[0].value !== CODE) return `پارامتر اشتباه: ${c.body}`;
      return true;
    }
  );
  await expectSend(
    "بدون templateId → /v1/send/ با خط اختصاصی",
    { SMS_PROVIDER: "smsir", SMS_API_KEY: "SIR", SMS_LINE_NUMBER: "3000555" },
    (c) => {
      const body = JSON.parse(c.body);
      if (!c.url.endsWith("/v1/send/")) return `URL اشتباه: ${c.url}`;
      if (body.lineNumber !== "3000555" || body.mobiles[0] !== PHONE) return `بدنه اشتباه: ${c.body}`;
      return true;
    }
  );
  reset();
  setResponder(() => ({ status: 200, body: JSON.stringify({ status: 0, message: "خط نامعتبر است" }) }));
  await expectError(
    "پاسخ status:0 از SMS.ir → خطا (قبلاً چون HTTP 200 بود رد می‌شد)",
    { SMS_PROVIDER: "smsir", SMS_API_KEY: "SIR", SMS_LINE_NUMBER: "3000555" },
    "خط نامعتبر است"
  );

  setResponder(null);
  process.stdout.write("\n۶) رگرسیون: مقدارهای env با نقل‌قول\n");
  await expectSend(
    'SMS_PROVIDER="iranpayamak" (با نقل‌قول) درست خوانده می‌شود',
    { SMS_PROVIDER: '"iranpayamak"', SMS_API_KEY: "'KEY123'", SMS_LINE_NUMBER: '"5000123"', SMS_PATTERN_CODE: '"100100"' },
    (c) => (c.headers["Api-Key"] === "KEY123" ? true : `Api-Key=${c.headers["Api-Key"]}`)
  );

  process.stdout.write("\n۷) خطای شبکه باید خوانا باشد\n");
  reset();
  setResponder(() => ({ throw: Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } }) }));
  await expectError(
    "DNS/شبکه → پیام فارسی دربارهٔ خروجی سرور",
    { SMS_PROVIDER: "kavenegar", SMS_API_KEY: "K" },
    "خروجی پورت ۴۴۳"
  );

  setResponder(null);
  process.stdout.write("\n۸) describeSmsConfig (صفحهٔ سلامت) با واقعیت ارسال هم‌راستا باشد\n");
  {
    const empty = sms.describeSmsConfig({});
    check("بدون پیکربندی → configured=false و دلیل فارسی دارد",
      empty.configured === false && empty.problems.length > 0 && /SMS_PROVIDER/.test(empty.problems.join(" ")),
      JSON.stringify(empty.problems));
    const ready = sms.describeSmsConfig({ SMS_PROVIDER: "iranpayamak", SMS_API_KEY: "ABCDEFGH12345", SMS_LINE_NUMBER: "5000123", SMS_PATTERN_CODE: "100100" });
    check("پیکربندی کامل → configured=true و mode=iranpayamak-pattern",
      ready.configured === true && ready.mode === "iranpayamak-pattern", JSON.stringify({ c: ready.configured, m: ready.mode }));
    check("کلید API در گزارش ماسک می‌شود", ready.apiKeyPreview === "ABCD***2345", ready.apiKeyPreview);
  }

  process.stdout.write(`\nنتیجه: ${pass} موفق، ${fail} ناموفق\n`);
  fs.rmSync(outDir, { recursive: true, force: true });
  process.exit(fail === 0 ? 0 : 1);
})();
