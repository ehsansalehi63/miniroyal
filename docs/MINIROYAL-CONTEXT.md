# MiniRoyal — مرجع ثابت پروژه

این فایل مرجع سریع برای هر جلسهٔ بعدی است. قبل از هر تغییر، ابتدا
`git fetch origin main` و `git status` اجرا شود. هیچ کلید یا رمز واقعی داخل
ریپو ذخیره نشود.

## هویت پروژه

- دامنهٔ عملیاتی: `https://miniroyal.shop`
- ریپو: `https://github.com/ehsansalehi63/miniroyal`
- شاخهٔ deploy: `main`
- پلتفرم اجرا: Hostinger Node.js Application Manager
- سرور برنامه: `server.js` و اجرای production با PM2
- مسیر سلامت: `/api/system-health`
- مسیر وضعیت سیستم: `/api/system-status`
- endpoint وب‌هوک: `/api/github-webhook`

## قرارداد دیپلوی

1. تغییرات روی یک سیستم با `git pull --ff-only origin main` دریافت شود.
2. تغییرات با `npm run build` بررسی شود.
3. پس از `git push origin main`، Hostinger Git deployment باید pull/build/restart را انجام دهد.
4. اگر سایت تغییر نکرد، به‌ترتیب Git deployment، لاگ build، PM2 restart و cache را بررسی کنید.
5. مقدار واقعی Environment Variables فقط در Hostinger وارد شود؛ `.env.example` فقط قالب است.

## معماری قابلیت‌ها

| بخش | مسیرهای اصلی | وضعیت |
|---|---|---|
| فروشگاه RTL | `/`, `/shop`, `/category/[...slug]`, `/product/[slug]` | فعال |
| سبد مهمان | `app/lib/cart.ts`, `/cart` | با Zustand و persist؛ عضویت برای افزودن لازم نیست |
| حساب مشتری | `/account`, `/api/customer/*`, `app/lib/customer-auth.ts` | حساب دائمی MySQL، رمز با scrypt، cookie امن |
| سفارش | `/checkout`, `/api/orders`, `app/lib/orders.ts` | ثبت سمت‌سرور و اتصال به مشتری |
| پرداخت | `/payment/gateway`, `/api/payment/request`, `/api/payment/verify` | زرین‌پال؛ مبلغ از سفارش دیتابیس کنترل می‌شود |
| پرو آنلاین | `/virtual-tryon` و بخش پرو صفحهٔ محصول | عکس کاربر + لباس مرجع؛ تحلیل Dahl/OpenRouter و تولید با AIHubMix/Pollinations |
| مدل سه‌بعدی | `InteractiveChildModel`, فایل‌های `public/models/*.glb` | در صفحهٔ اصلی |
| مدیریت | `/admin/*` | پنل مدیریتی جدا از حساب مشتری |

## زنجیرهٔ پرو آنلاین

```text
عکس کاربر + عکس محصول
        ↓
Dahl Vision (اختیاری)
        ↓ در صورت نبود/خطا
OpenRouter Vision (اختیاری)
        ↓
prompt دقیق پرو
        ↓
AIHubMix Image Edit (اولویت) یا Pollinations (fallback)
        ↓
نتیجهٔ بزرگ زیر توضیحات عکس کاربر
```

برای پرو دو تصویر باید به مدل image-edit ارسال شوند. اگر مقدار قدیمی
`TRYON_MODEL=kontext` در Hostinger باشد، کد مسیر پرو آن را به مدل چندمرجعی
پیش‌فرض تبدیل می‌کند؛ مقدار توصیه‌شده `seedream` است.

## دیتابیس

- موتور: MySQL/MariaDB روی Hostinger
- DDL اصلی: `database/schema.sql` و نسخهٔ مستنداتی: `docs/schema.sql`
- جداول مهم: `customers`, `orders`, `order_items`, `products`, `product_variants`,
  `addresses`, `reviews`, `coupons`
- احراز هویت مشتری: `customers.password_hash` با scrypt؛ رمز خام ذخیره نمی‌شود.
- نشست مشتری: cookie HttpOnly با امضای HMAC؛ کلید آن `AUTH_SESSION_SECRET` است.
- قبل از استفادهٔ production، schema دیتابیس باید در phpMyAdmin اجرا شده باشد.

## لوگو و رسانه

- لوگوی اصلی: `public/images/brand/miniroyal-logo.png`
- استفاده‌های اصلی: Header، Footer، پنل مدیریت، Live Chat و Error Boundary
- تصاویر کاتالوگ: `public/images/catalog/`
- مدل‌های سه‌بعدی: `public/models/`

## قوانین امنیتی

- هرگز مقدار `*_API_KEY`, `MYSQL_PASSWORD`, `PAYMENT_STATE_SECRET`,
  `AUTH_SESSION_SECRET`, `GITHUB_WEBHOOK_SECRET` یا merchant واقعی commit نشود.
- کلیدهای AI فقط در Route Handler سمت سرور استفاده شوند.
- اطلاعات کارت بانکی هرگز در سایت ذخیره یا از کاربر درخواست نشود؛ پرداخت در صفحهٔ رسمی درگاه انجام می‌شود.
- تراکنش واقعی فقط با سفارش، مبلغ و تأیید صاحب حساب قابل شروع است.
