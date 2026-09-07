#!/usr/bin/env node
/**
 * بهینه‌سازی تصاویر لوکال مینی رویال
 *
 * چرا این اسکریپت؟ تصاویر کاتالوگ PNG با ابعاد ۱۶۶۴×۹۲۸ و میانگین ۱٫۷ مگابایت بودند
 * و صفحهٔ اصلی ~۵۰ مگابایت تصویر رفرنس می‌داد. این اسکریپت همان تصاویر را به WebP
 * در دو اندازه تبدیل می‌کند و در همان پوشهٔ public نگه می‌دارد — یعنی همه‌چیز لوکال
 * می‌ماند و به هیچ CDN یا بهینه‌ساز زمان اجرا (sharp روی هاست) نیازی نیست.
 *
 * اجرا:  node scripts/optimize-images.mjs
 * خروجی: public/images/catalog/*.webp  (۱۲۸۰px)  و  *-sm.webp  (۵۶۰px)
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogDir = path.join(root, "public/images/catalog");
const brandDir = path.join(root, "public/images/brand");

const LARGE = { width: 1280, quality: 78 };
const SMALL = { width: 560, quality: 72 };

async function convert(src, dest, { width, quality }) {
  const before = fs.statSync(src).size;
  const buf = await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  fs.writeFileSync(dest, buf);
  return { before, after: buf.length };
}

async function main() {
  let beforeTotal = 0;
  let afterTotal = 0;
  let count = 0;

  const pngs = fs.readdirSync(catalogDir).filter((f) => f.endsWith(".png")).sort();
  for (const file of pngs) {
    const src = path.join(catalogDir, file);
    const base = file.replace(/\.png$/, "");
    for (const [suffix, spec] of [["", LARGE], ["-sm", SMALL]]) {
      const dest = path.join(catalogDir, `${base}${suffix}.webp`);
      const { before, after } = await convert(src, dest, spec);
      beforeTotal += before;
      afterTotal += after;
      count += 1;
    }
    process.stdout.write(`  ${file} → ${base}.webp + ${base}-sm.webp\n`);
  }

  // لوگو: در هدر و فوتر فقط ۴۴–۴۸ پیکسل نمایش داده می‌شود ولی فایل اصلی ۲٫۲ مگابایت بود
  const logoSrc = path.join(brandDir, "miniroyal-logo.png");
  if (fs.existsSync(logoSrc)) {
    const dest = path.join(brandDir, "miniroyal-logo.webp");
    const { before, after } = await convert(logoSrc, dest, { width: 192, quality: 82 });
    beforeTotal += before;
    afterTotal += after;
    count += 1;
    process.stdout.write(`  miniroyal-logo.png → miniroyal-logo.webp (${(after / 1024).toFixed(0)} KB)\n`);
  }

  // آیکون‌های PWA: از همان لوگوی برند، مربع و در دو اندازه
  if (fs.existsSync(logoSrc)) {
    const raw = await sharp(logoSrc).resize(512, 512, { fit: "cover", position: "top" }).toBuffer();
    for (const size of [192, 512]) {
      const dest = path.join(brandDir, `icon-${size}.png`);
      await sharp(raw).resize(size, size).png({ compressionLevel: 9 }).toFile(dest);
      process.stdout.write(`  icon-${size}.png (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)\n`);
    }
  }

  // پوستر هیرو: تصویر ثابتی که تا لود شدن ویدیو/انیمیشن نمایش داده می‌شود
  const posterSrc = path.join(catalogDir, "catalog-26.png");
  if (fs.existsSync(posterSrc)) {
    const dest = path.join(root, "public/images/hero-poster.webp");
    const { before, after } = await convert(posterSrc, dest, { width: 1600, quality: 76 });
    beforeTotal += before;
    afterTotal += after;
    count += 1;
    process.stdout.write(`  hero-poster.webp (${(after / 1024).toFixed(0)} KB)\n`);
  }

  const mb = (n) => (n / 1048576).toFixed(2);
  process.stdout.write(`\n${count} فایل تولید شد: ${mb(beforeTotal)} MB → ${mb(afterTotal)} MB `);
  process.stdout.write(`(${((1 - afterTotal / beforeTotal) * 100).toFixed(1)}٪ کاهش)\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
