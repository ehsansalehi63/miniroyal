// Functional test runner for /api/ai-tryon strict edit-only + identity-verified policy.
// Usage: node scripts/test/run-tryon-tests.mjs <phase>
//   phase A → no AI keys configured (expect honest failure, NO fallback image)
//   phase B → POLLINATIONS configured against mock provider
//   phase C → AIHUBMIX configured against mock provider
//   phase D → POLLINATIONS + TRYON_MODEL=z-image-turbo (generator must be skipped)
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

// ---- realistic child-photo scene (gradient bg + head + torso + legs) ----
const sceneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#cfe6f7"/><stop offset="1" stop-color="#7d94a8"/>
  </linearGradient></defs>
  <rect width="480" height="640" fill="url(#bg)"/>
  <circle cx="240" cy="115" r="52" fill="#f2c9a0"/>
  <rect x="168" y="190" width="144" height="200" rx="18" fill="#d94f4f"/>
  <rect x="182" y="400" width="46" height="180" fill="#3b3b52"/>
  <rect x="252" y="400" width="46" height="180" fill="#3b3b52"/>
</svg>`;
const personBuf = await sharp(Buffer.from(sceneSvg)).jpeg({ quality: 90 }).toBuffer();
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

function mockLogs(n = 1) {
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
  // T4a: Pollinations edit chain, mock simulates a REAL edit → success + identity verified
  await setMockMode("ok");
  const t4a = await callTryon(baseBody);
  const logA = mockLogs(1)[0];
  check("ویرایش واقعی → success:true", t4a.data?.success === true, JSON.stringify(t4a.data));
  check("identityVerified:true در پاسخ", t4a.data?.identityVerified === true, JSON.stringify(t4a.data));
  check(
    "provider یک مدل ویرایشگر واقعی است (نه z-image/schnell/turbo)",
    /^pollinations-(google\/gemini|black-forest-labs\/flux\.1-kontext|bytedance\/seedream|openai\/gpt-image)/.test(String(t4a.data?.provider)) &&
      !/z-image|zimage|schnell|turbo/.test(String(t4a.data?.provider)),
    String(t4a.data?.provider)
  );
  check("نتیجه عکس جدید AI است (نه کپی ورودی)", Boolean(t4a.data?.imageUrl) && t4a.data.imageUrl !== personImage && t4a.data.imageUrl !== garmentImage);
  check("هر دو عکس (person.jpg + garment.png) به مدل ارسال شد", logA?.images === 2 && logA?.files?.includes("person.jpg") && logA?.files?.includes("garment.png"), JSON.stringify(logA?.files));
  check("سایز خروجی هم‌نسبت با عکس کاربر (768x1024 برای 480x640)", logA?.size === "768x1024", String(logA?.size));
  check("پرامپت فقط EDIT است (Image 1/Image 2)", /Image 1/i.test(logA?.prompt || "") && /Image 2/i.test(logA?.prompt || "") && /EDIT/i.test(logA?.prompt || ""));
  check("پرامپت حاوی حفظ چهره و ممنوعیت کودک جدید است", /face, identity/i.test(logA?.prompt || "") && /Do NOT generate a new or different child/i.test(logA?.prompt || ""));
  check("پرامپت تأکید می‌کند خروجی همان عکس ورودی است", /SAME photo as image 1/i.test(logA?.prompt || ""));

  // T4b: provider INVENTS an unrelated image (like z-image did) → identity guard rejects
  await setMockMode("invent");
  const t4b = await callTryon(baseBody);
  check("عکس ساختگی/بی‌ربط → رد می‌شود (success:false)", t4b.data?.success === false, JSON.stringify(t4b.data));
  check("عکس ساختگی → AI_TRYON_UNAVAILABLE بدون imageUrl", t4b.data?.code === "AI_TRYON_UNAVAILABLE" && !t4b.data?.imageUrl, JSON.stringify(t4b.data));

  // T4c: provider echoes the person photo → rejected
  await setMockMode("echo");
  const t4c = await callTryon(baseBody);
  check("اکوی عکس کاربر → رد می‌شود", t4c.data?.success === false && t4c.data?.code === "AI_TRYON_UNAVAILABLE", JSON.stringify(t4c.data));

  // T5: accessory kind → accessory-specific edit prompt, edit models only
  await setMockMode("ok");
  const t5 = await callTryon({ ...baseBody, kind: "accessory" });
  const logC = mockLogs(1)[0];
  check("اکسسوری → success:true", t5.data?.success === true, JSON.stringify(t5.data));
  check("پرامپت اختصاصی اکسسوری استفاده شد", /accessory/i.test(logC?.prompt || ""), String(logC?.prompt).slice(0, 100));

  // T6: missing garment image → 400
  const t6 = await callTryon({ personImage, productId: 1 });
  check("فقط عکس کودک بدون محصول → ۴۰۰", t6.status === 400 && t6.data?.success === false, JSON.stringify(t6.data));
}

if (phase === "C") {
  // T2: AIHubMix native try-on simulating a real edit → success
  await setMockMode("ok");
  const t2 = await callTryon(baseBody);
  const logA = mockLogs(1)[0];
  check("AIHubMix ویرایش واقعی → success:true", t2.data?.success === true, JSON.stringify(t2.data));
  check("provider = aihubmix + identityVerified", t2.data?.provider === "aihubmix" && t2.data?.identityVerified === true, JSON.stringify(t2.data));
  check("هر دو عکس در آرایه image ارسال شد", logA?.images === 2, JSON.stringify(logA?.images));
  check("نتیجه عکس جدید AI است", Boolean(t2.data?.imageUrl) && t2.data.imageUrl !== personImage);

  // T3a: AIHubMix invents unrelated image → identity guard rejects
  await setMockMode("invent");
  const t3a = await callTryon(baseBody);
  check("AIHubMix عکس ساختگی → success:false بدون imageUrl", t3a.data?.success === false && !t3a.data?.imageUrl && t3a.data?.code === "AI_TRYON_UNAVAILABLE", JSON.stringify(t3a.data));

  // T3b: AIHubMix echoes person → rejected
  await setMockMode("echo");
  const t3b = await callTryon(baseBody);
  check("AIHubMix اکو → AI_TRYON_UNAVAILABLE", t3b.data?.success === false && t3b.data?.code === "AI_TRYON_UNAVAILABLE", JSON.stringify(t3b.data));
}

if (phase === "D") {
  // TRYON_MODEL is configured to a TEXT-TO-IMAGE generator (the old bug).
  // It must be skipped entirely; the verified edit models are used instead.
  await setMockMode("ok");
  const t = await callTryon(baseBody);
  const logs = mockLogs(8);
  const modelsCalled = logs.map((l) => l.model);
  check("با TRYON_MODEL=z-image-turbo هم نتیجه موفق و ویرایش واقعی است", t.data?.success === true && t.data?.identityVerified === true, JSON.stringify(t.data));
  check("مدل تولیدکننده (z-image) هرگز صدا زده نشد", !modelsCalled.some((m) => /z-image|turbo/i.test(m)), JSON.stringify(modelsCalled));
  check("در عوض مدل ویرایشگر تأییدشده صدا زده شد", modelsCalled.some((m) => /gemini|kontext|seedream|gpt-image/i.test(m)), JSON.stringify(modelsCalled));
}

console.log(`\nPhase ${phase}: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
