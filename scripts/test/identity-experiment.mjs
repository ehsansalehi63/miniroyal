// Threshold-tuning experiment for the try-on identity guard.
// Builds synthetic scenes and checks that:
//  - real edits (garment swapped on the SAME photo, even with drift/aspect change) PASS
//  - invented images (different child/scene) are REJECTED
import sharp from "sharp";

const GRID = 48;

function sceneSvg({ bg1, bg2, headColor, headX, torsoColor, w = 480, h = 640 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${headX}" cy="${h * 0.18}" r="${w * 0.11}" fill="${headColor}"/>
  <rect x="${headX - w * 0.16}" y="${h * 0.3}" width="${w * 0.32}" height="${h * 0.32}" rx="18" fill="${torsoColor}"/>
  <rect x="${headX - w * 0.13}" y="${h * 0.63}" width="${w * 0.1}" height="${h * 0.28}" fill="#3b3b52"/>
  <rect x="${headX + w * 0.03}" y="${h * 0.63}" width="${w * 0.1}" height="${h * 0.28}" fill="#3b3b52"/>
</svg>`;
}

async function computeIdentityMetrics(personBuf, resultBuf) {
  const load = async (buf) => {
    const { data, info } = await sharp(buf).rotate().resize(GRID, GRID, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, info };
  };
  const [A, B] = await Promise.all([load(personBuf), load(resultBuf)]);
  const n = GRID * GRID;
  let sumAll = 0, sumTop = 0, topCount = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = (y * GRID + x) * 3;
      const d = (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2])) / 3;
      sumAll += d;
      if (y < GRID * 0.28) { sumTop += d; topCount++; }
    }
  }
  const madAll = sumAll / n;
  const madTop = sumTop / Math.max(1, topCount);
  // histogram correlation, 8 bins per channel
  const bins = 8 * 8 * 8;
  const hA = new Float64Array(bins), hB = new Float64Array(bins);
  const idx = (i, d) => {
    const r = Math.min(7, d[i] >> 5), g = Math.min(7, d[i + 1] >> 5), b = Math.min(7, d[i + 2] >> 5);
    return (r * 8 + g) * 8 + b;
  };
  for (let p = 0; p < n; p++) { const i = p * 3; hA[idx(i, A.data)]++; hB[idx(i, B.data)]++; }
  const mean = (h) => h.reduce((s, v) => s + v, 0) / h.length;
  const mA = mean(hA), mB = mean(hB);
  let num = 0, dA = 0, dB = 0;
  for (let k = 0; k < bins; k++) { num += (hA[k] - mA) * (hB[k] - mB); dA += (hA[k] - mA) ** 2; dB += (hB[k] - mB) ** 2; }
  const corr = dA && dB ? num / Math.sqrt(dA * dB) : 0;

  // Grayscale NCC of the head zone (top 38% rows) on a finer grid.
  // NCC is invariant to brightness/contrast drift but very sensitive to
  // a different head/face position or shape → catches invented children
  // even on identical plain backgrounds.
  const HG = 64;
  const loadGray = async (buf) => {
    const { data } = await sharp(buf).rotate().resize(HG, HG, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    return data;
  };
  const [gA, gB] = await Promise.all([loadGray(personBuf), loadGray(resultBuf)]);
  const rowsTop = Math.round(HG * 0.38);
  let sA = 0, sB = 0, cnt = 0;
  for (let y = 0; y < rowsTop; y++) for (let x = 0; x < HG; x++) { const i = y * HG + x; sA += gA[i]; sB += gB[i]; cnt++; }
  const muA = sA / cnt, muB = sB / cnt;
  let nNum = 0, nA = 0, nB = 0;
  for (let y = 0; y < rowsTop; y++) for (let x = 0; x < HG; x++) {
    const i = y * HG + x; const da = gA[i] - muA, db = gB[i] - muB;
    nNum += da * db; nA += da * da; nB += db * db;
  }
  const nccTop = nA && nB ? nNum / Math.sqrt(nA * nB) : 0;
  return { madAll: +madAll.toFixed(1), madTop: +madTop.toFixed(1), corr: +corr.toFixed(3), nccTop: +nccTop.toFixed(3) };
}

// Decision rule (same as the route will use)
function looksGenuine(m, { maxAll = 40, maxTop = 38, minCorr = 0.45, minNccTop = 0.45 } = {}) {
  if (m.madTop > maxTop && m.madAll > maxAll) return false;
  if (m.corr < minCorr && m.madAll > maxAll) return false;
  if (m.nccTop < minNccTop) return false;
  return true;
}

const base = { bg1: "#cfe6f7", bg2: "#7d94a8", headColor: "#f2c9a0", headX: 240, torsoColor: "#d94f4f" };
const person = await sharp(Buffer.from(sceneSvg(base))).jpeg({ quality: 90 }).toBuffer();

const cases = [];
// 1. REAL edit: only the torso garment color changed (IDM-VTON style)
cases.push(["ویرایش واقعی (فقط لباس عوض شده)", await sharp(Buffer.from(sceneSvg({ ...base, torsoColor: "#3f7d4e" }))).jpeg({ quality: 90 }).toBuffer(), true]);
// 2. REAL edit + brightness/saturation drift (kontext-style regeneration drift)
cases.push(["ویرایش واقعی + دریفت نور/رنگ", await sharp(Buffer.from(sceneSvg({ ...base, torsoColor: "#3f7d4e" }))).modulate({ brightness: 1.12, saturation: 0.88 }).jpeg({ quality: 82 }).toBuffer(), true]);
// 3. REAL edit but output aspect changed to square (model ignored size hint)
cases.push(["ویرایش واقعی با تغییر نسبت به مربع", await sharp(Buffer.from(sceneSvg({ ...base, torsoColor: "#3f7d4e", w: 640, h: 640 }))).jpeg({ quality: 90 }).toBuffer(), true]);
// 4. REAL edit + slight pose shift (head moved 6%)
cases.push(["ویرایش واقعی + جابه‌جایی جزئی سر", await sharp(Buffer.from(sceneSvg({ ...base, torsoColor: "#3f7d4e", headX: 270 }))).jpeg({ quality: 90 }).toBuffer(), true]);
// 4b. REAL edit + slight zoom/reframe (model cropped ~8%)
cases.push(["ویرایش واقعی + زوم/برش جزئی مدل", await sharp(Buffer.from(sceneSvg({ ...base, torsoColor: "#3f7d4e" }))).extract({ left: 20, top: 26, width: 440, height: 588 }).resize(480, 640, { fit: "fill" }).jpeg({ quality: 90 }).toBuffer(), true]);
// 5. INVENTED: different child scene (different background, head, colors)
cases.push(["ساختگی: کودک/صحنهٔ متفاوت", await sharp(Buffer.from(sceneSvg({ bg1: "#f7e9cf", bg2: "#a8875d", headColor: "#c98f5a", headX: 300, torsoColor: "#4f5fd9", w: 480, h: 640 }))).jpeg({ quality: 90 }).toBuffer(), false]);
// 6. INVENTED: totally different colors
cases.push(["ساختگی: رنگ‌های کاملاً متفاوت", await sharp(Buffer.from(sceneSvg({ bg1: "#20304a", bg2: "#0d1320", headColor: "#e8b070", headX: 180, torsoColor: "#e0c040" }))).jpeg({ quality: 90 }).toBuffer(), false]);
// 7. INVENTED but same plain white background (must be caught by head zone)
const whiteBg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640"><rect width="480" height="640" fill="#ffffff"/><circle cx="${c.x}" cy="115" r="52" fill="${c.skin}"/><rect x="${c.x - 70}" y="190" width="140" height="200" rx="18" fill="${c.shirt}"/></svg>`;
const personWhite = await sharp(Buffer.from(whiteBg({ x: 240, skin: "#f2c9a0", shirt: "#d94f4f" }))).jpeg({ quality: 90 }).toBuffer();
cases.push(["سفید/ویرایش واقعی روی پس‌زمینه سفید", await sharp(Buffer.from(whiteBg({ x: 240, skin: "#f2c9a0", shirt: "#2f6fb2" }))).jpeg({ quality: 90 }).toBuffer(), true, personWhite]);
cases.push(["ساختگی روی پس‌زمینه سفید (کودک دیگر)", await sharp(Buffer.from(whiteBg({ x: 150, skin: "#9c6b3f", shirt: "#20a060" }))).jpeg({ quality: 90 }).toBuffer(), false, personWhite]);

let allOk = true;
for (const [name, buf, expected, personOverride] of cases) {
  const m = await computeIdentityMetrics(personOverride || person, buf);
  const decision = looksGenuine(m);
  const ok = decision === expected;
  if (!ok) allOk = false;
  console.log(`${ok ? "✅" : "❌"} ${name} → madAll=${m.madAll} madTop=${m.madTop} corr=${m.corr} nccTop=${m.nccTop} | تصمیم: ${decision ? "پذیرش" : "رد"} (انتظار: ${expected ? "پذیرش" : "رد"})`);
}
console.log(allOk ? "\n🎯 همهٔ حالت‌ها با آستانه‌های پیش‌فرض درست تشخیص داده شدند" : "\n⚠️ نیاز به تنظیم آستانه‌ها");
process.exit(allOk ? 0 : 1);
