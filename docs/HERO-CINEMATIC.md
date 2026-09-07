# 🎬 هیروی سینمایی صفحهٔ اصلی — راهنمای نگهداری

## چه چیزی عوض شد و چرا

| قبل | بعد |
|---|---|
| مدل سه‌بعدی `model-viewer` + چهار فایل GLB (۴۴ مگابایت) | صحنهٔ استودیویی سینمایی با CSS خالص و همان عکس‌های لوکال |
| کتابخانه‌های `@google/model-viewer`، `three`، `framer-motion` | هیچ‌کدام — از `dependencies` حذف شدند |
| ۲۹ تصویر PNG با مجموع **۴۹٫۲ مگابایت** در صفحهٔ اصلی | ۱۴ تصویر WebP با مجموع **۰٫۴۲ مگابایت** |
| لوگوی ۲٬۲۶۸ کیلوبایتی در هدر و فوتر | نسخهٔ WebP با ۱۶ کیلوبایت |
| `Cache-Control: public, max-age=0` برای تصاویر | `max-age=2592000` + `stale-while-revalidate` |

اجزای صحنه (همه در `app/globals.css` و `app/components/CinematicHero.tsx`):
نور متمرکز استودیو، کف بازتابنده، اشعهٔ نور چرخان، **نام و لوگوی سایت به‌صورت سه‌بعدی
پشت سوژه**، قاب فیلم با حرکت آرام Ken Burns، بازتاب سوژه روی کف، گرین فیلم، وینیت و
نوارهای سینمایی. همه با `prefers-reduced-motion` غیرفعال می‌شوند.

---

## گذاشتن ویدیوی واقعی

کد آماده است: اگر فایل ویدیو وجود داشته باشد، **خودکار** به‌جای صحنهٔ انیمیشنی پخش می‌شود.

```
public/video/hero.mp4      ← اولویت اول
public/video/hero.webm     ← اگر mp4 نبود
```

چون صفحهٔ اصلی استاتیک prerender می‌شود، بعد از افزودن فایل یک بار بیلد لازم است:

```bash
npm run build && pm2 restart miniroyal
```

### مشخصات پیشنهادی ویدیو

| مورد | مقدار |
|---|---|
| نسبت تصویر | ۱۶:۹ (۱۹۲۰×۱۰۸۰) — قاب هیرو ۱۶:۹ است |
| طول | ۸ تا ۱۲ ثانیه، بی‌نهایت لوپ‌شدن (فریم اول و آخر نزدیک هم) |
| حجم | زیر ۶ مگابایت |
| صدا | ندارد (ویدیو `muted` پخش می‌شود) |
| کدک | H.264 / yuv420p برای سازگاری با سافاری و iOS |

### فشرده‌سازی با ffmpeg

```bash
ffmpeg -i input.mov -vf "scale=1920:-2" -c:v libx264 -pix_fmt yuv420p \
  -crf 26 -preset slow -an -movflags +faststart public/video/hero.mp4
```

### پرامپت آماده برای ساخت ویدیو (Veo / Kling / Runway)

> Cinematic studio commercial shot, slow smooth dolly-in. Three well-dressed children
> (a girl in a party dress, a boy in a hoodie, a baby in a soft cotton set) standing and
> gently turning inside a dark premium photography studio. Warm key light from above with
> soft volumetric rays, subtle haze, reflective dark floor. Behind them, a large extruded
> 3D metallic logo reading "MINI ROYAL" with a golden crown emblem, softly glowing violet
> rim light. Shallow depth of field, 35mm anamorphic look, film grain, elegant color grade
> in violet/amber/cream. No text overlays other than the logo. Seamless loop, 10 seconds.

---

## بهینه‌سازی دوبارهٔ تصاویر

اگر عکس جدیدی به `public/images/catalog/` اضافه کردید:

```bash
node scripts/optimize-images.mjs
```

این اسکریپت از روی هر PNG دو نسخهٔ WebP می‌سازد و در همان پوشه می‌گذارد:

- `catalog-NN.webp` — عرض ۱۲۸۰px (هیرو، کارت و صفحهٔ محصول)
- `catalog-NN-sm.webp` — عرض ۵۶۰px (تامبنیل دسته‌بندی)

همچنین لوگوی سبک (`miniroyal-logo.webp`)، آیکون‌های PWA (`icon-192.png`، `icon-512.png`)
و پوستر هیرو (`hero-poster.webp`) را تولید می‌کند.

**همه‌چیز لوکال است** — هیچ CDN یا سرویس بیرونی در کار نیست و به بهینه‌ساز زمان اجرا
(که روی هاست اشتراکی بار CPU می‌گذارد) نیازی نیست.

> PNGهای اصلی در ریپو نگه داشته شده‌اند تا منبع بازتولید WebP باشند. اگر خواستید
> حجم ریپو/دیپلوی را کم کنید، می‌توانید بعد از تولید WebPها آن‌ها را حذف کنید —
> فقط در نظر داشته باشید که دیگر نمی‌توانید WebP بهتری از آن‌ها بسازید.
