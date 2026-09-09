// Functional test runner for /api/ai-tryon strict edit-only policy.
// Usage: node scripts/test/run-tryon-tests.mjs <phase>
//   phase A → no AI keys configured (expect honest failure, NO fallback image)
//   phase B → POLLINATIONS configured against mock provider
//   phase C → AIHUBMIX configured against mock provider
import crypto from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";

const BASE = "http://127.0.0.1:3000";
const MOCK = "http://127.0.0.1:9911";
const SECRET = "test-session-secret";
const phase = process.argv[2] || "A";

// ---- forge a valid dev session cookie (customer-auth signSession format) ----
function forgeCookie(id = 7) {
  const payload = `${id}.${Date.now() + 30 * 86400000}`;
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `miniroyal_customer_session=${payload}.${signature}`;
}

// ---- create two distinct input photos (child + garment) ----
const personBuf = await sharp({
  create: { width: 120, height: 160, channels: 3, background: { r: 60, g: 120, b: 200 } },
}).jpeg({ quality: 80 }).toBuffer();
const garmentBuf = await sharp({
  create: { width: 120, height: 140, channels: 3, background: { r: 250, g: 220, b: 90 } },
}).png().toBuffer();
const personImage = `data:image/jpeg;base64,${personBuf.toString("base64")}`;
const garmentImage = `data:image/png;base64,${garmentBuf.toString("base64")}`;

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail}`);
  }
}

async function setMockMode(mode) {
  await fetch(`${MOCK}/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
}

async function callTryon(body, useCookie = true) {
  const res = await fetch(`${BASE}/api/ai-tryon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(useCookie ? { Cookie: forgeCookie() } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

function lastMockLogs(n = 1) {
  if (!fs.existsSync("/tmp/mock-ai.log")) return [];
  return fs.readFileSync("/tmp/mock-ai.log", "utf8").trim().split("\n").filter(Boolean).slice(-n).map((l) => JSON.parse(l));
}

const baseBody = { personImage, garmentImage, productId: 1, requestedSize: "110" };

console.log(`\n=== Phase ${phase} ===`);

if (phase === "A") {
  // T0: unauthenticated → 401 AUTH_REQUIRED
  const t0 = await callTryon(baseBody, false);
  check("بدون ورود → ۴۰۱ و کد AUTH_REQUIRED", t0.status === 401 && t0.data?.code === "AUTH_REQUIRED", JSON.stringify(t0.data));

  // T1: logged-in, no AI provider reachable → honest failure, NO image at all
  const t1 = await callTryon(baseBody);
  check("بدون اتصال AI → success:false", t1.data?.success === false, JSON.stringify(t1.data));
  check("کد خطا AI_TRYON_UNAVAILABLE", t1.data?.code === "AI_TRYON_UNAVAILABLE", JSON.stringify(t1.data));
  check("هیچ imageUrl ساختگی برگردانده نمی‌شود", !t1.data?.imageUrl, JSON.stringify(t1.data));
  check("هیچ provider محلی (studio-fit) وجود ندارد", !t1.data?.provider, JSON.stringify(t1.data));
  check("پیام خطای فارسی صادقانه", typeof t1.data?.error === "string" && t1.data.error.includes("هوش مصنوعی"), JSON.stringify(t1.data));
}

if (phase === "B") {
  // T4a: Pollinations edit chain, mock returns a genuine edit → success
  await setMockMode("ok");
  const t4a = await callTryon(baseBody);
  const logsA = lastMockLogs(1)[0];
  check("Pollinations OK → success:true", t4a.data?.success === true, JSON.stringify(t4a.data));
  check("provider = pollinations-tongyi-mai/z-image-turbo", t4a.data?.provider === "pollinations-tongyi-mai/z-image-turbo", String(t4a.data?.provider));
  check("نتیجه عکس جدید AI است (نه کپی ورودی)", Boolean(t4a.data?.imageUrl) && t4a.data.imageUrl !== personImage && t4a.data.imageUrl !== garmentImage);
  check("هر دو عکس (person.jpg + garment.png) به مدل ارسال شد", logsA?.images === 2 && logsA?.files?.includes("person.jpg") && logsA?.files?.includes("garment.png"), JSON.stringify(logsA));
  check("پرامپت فقط EDIT است (Image 1/Image 2)", /Image 1/i.test(logsA?.prompt || "") && /Image 2/i.test(logsA?.prompt || "") && /EDIT/i.test(logsA?.prompt || ""), logsA?.prompt?.slice(0, 120));
  check("پرامپت حاوی حفظ چهره و ممنوعیت کودک جدید است", /face, identity/i.test(logsA?.prompt || "") && /Do NOT generate a new or different child/i.test(logsA?.prompt || ""));

  // T4b: provider echoes the person photo (ignored the garment) → rejected, honest failure
  await setMockMode("echo");
  const t4b = await callTryon(baseBody);
  check("اکوی عکس کاربر → رد می‌شود (success:false)", t4b.data?.success === false, JSON.stringify(t4b.data));
  check("اکو → کد AI_TRYON_UNAVAILABLE بدون عکس", t4b.data?.code === "AI_TRYON_UNAVAILABLE" && !t4b.data?.imageUrl, JSON.stringify(t4b.data));

  // T5: accessory kind → accessory-specific edit prompt, edit models only
  await setMockMode("ok");
  const t5 = await callTryon({ ...baseBody, kind: "accessory" });
  const logsC = lastMockLogs(1)[0];
  check("اکسسوری → success:true", t5.data?.success === true, JSON.stringify(t5.data));
  check("پرامپت اختصاصی اکسسوری استفاده شد", /accessory/i.test(logsC?.prompt || ""), logsC?.prompt?.slice(0, 120));

  // T6: missing garment image → 400
  const t6 = await callTryon({ personImage, productId: 1 });
  check("فقط عکس کودک بدون محصول → ۴۰۰", t6.status === 400 && t6.data?.success === false, JSON.stringify(t6.data));
}

if (phase === "C") {
  // T2: AIHubMix native try-on with both images → success
  await setMockMode("ok");
  const t2 = await callTryon(baseBody);
  const logsA = lastMockLogs(1)[0];
  check("AIHubMix OK → success:true", t2.data?.success === true, JSON.stringify(t2.data));
  check("provider = aihubmix", t2.data?.provider === "aihubmix", String(t2.data?.provider));
  check("هر دو عکس در آرایه image ارسال شد", logsA?.images === 2, JSON.stringify(logsA));
  check("نتیجه عکس جدید AI است", Boolean(t2.data?.imageUrl) && t2.data.imageUrl !== personImage);

  // T3: AIHubMix echoes person → rejected, honest failure (no composite fallback)
  await setMockMode("echo");
  const t3 = await callTryon(baseBody);
  check("AIHubMix اکو → success:false و بدون عکس", t3.data?.success === false && !t3.data?.imageUrl, JSON.stringify(t3.data));
  check("اکو → AI_TRYON_UNAVAILABLE", t3.data?.code === "AI_TRYON_UNAVAILABLE", JSON.stringify(t3.data));
}

console.log(`\nPhase ${phase}: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
