# 📋 سند تحویل به جلسهٔ جدید — مینی رویال (Mini Royal)

> این سند برای جلسه/ایجنت جدیدی است که روی ریپوی **miniroyal** باز می‌شود.
> کد Sprint 0 کامل است و فقط باید منتقل و ادامه داده شود.

## ✅ وضعیت فعلی (Sprint 0 — کامل شده)

| بخش | وضعیت |
|---|---|
| Next.js 16.3.3 (App Router + Turbopack) + TS strict + Tailwind v4 | ✅ build + lint پاس |
| فونت وزیرمتن لوکال (next/font/local) — بدون وابستگی به اینترنت | ✅ |
| RTL درجه‌یک فارسی (dir=rtl، lang=fa، fa-IR) | ✅ |
| هدر چسبان (لوگو 👑، جستجو، ورود، سبد) + فوتر کامل | ✅ |
| صفحه اصلی (هیرو، ۴ مزیت، ۶ دسته، بنر پرو آنلاین، خبرنامه) | ✅ |
| README فارسی + .env.example (زرین‌پال sandbox) + .gitignore امن | ✅ |

## 🔄 نحوهٔ انتقال کد به ریپوی miniroyal

اگر ریپوی `miniroyal` هنوز خالی است، کد را از برنچ پشتیبان منتقل کن:

```bash
git clone https://github.com/ehsansalehi63/ehsansalehi.ir.git /tmp/br
cd /tmp/br
git checkout backup/miniroyal-s0
# محتوا را بردار (بدون .git) به داخل ریپوی miniroyal بریز
```

یا در جلسهٔ جدید که دسترسی به miniroyal دارد:
```bash
git clone https://github.com/ehsansalehi63/miniroyal.git
cd miniroyal
git remote add backup https://github.com/ehsansalehi63/ehsansalehi.ir.git
git fetch backup backup/miniroyal-s0
git merge --allow-unrelated-histories backup/backup/miniroyal-s0  # یا cherry-pick
git push origin main
```

(همچنین نسخهٔ بکاپ آفلاین `kidswear-shop-repo.bundle` در سندباکس قبلی ساخته شده است.)

## 🚀 قدم بعدی: Sprint 1 — کاتالوگ

طبق `docs/18-master-build-prompt.md` (پرامپت مادر):
1. دیتابیس: اسکیمای `_ARENA_DELIVERABLES/09-data-model.sql` (۲۹ جدول) را migration تمیز کن + seed ۳۰ محصول پوشاک کودک (عنوان، قیمت، سایز، رنگ، تصویر placeholder)
2. صفحه اصلی کامل (اسلایدر محصول، «جدیدترین‌ها»، «پرفروش‌ها»، «پیشنهاد ویژه»)
3. دسته‌بندی با URL فارسی (مثلاً `/category/pesaraneh`) + فیلتر (جنسیت/سن/سایز/رنگ/قیمت/تخفیف) + مرتب‌سازی
4. جستجوی زنده
5. صفحه محصول (گالری، سایز×رنگ با موجودی، جدول سایز سانتی‌متری، نظرات size_fit، FAQ، محصولات مرتبط، JSON-LD)
6. بلاگ AI (موقتی با دیتای نمونه) + صفحات قانونی

**معیار پذیرش S1:** کاربر می‌تواند از صفحه اصلی به هر محصول برسد، فیلتر کند، و صفحه محصول را باز کند.

## 📌 تصمیمات قطعی‌شده

- **برند:** مینی رویال (Mini Royal) — لوگو 👑
- **درگاه:** زرین‌پال (در توسعه: `ZARINPAL_SANDBOX=true` — بدون پول واقعی)
- **بازار:** داخل ایران، تومان، فارسی RTL
- **استک:** Next.js 16 (RSC/Server Actions/ISR) + TS + Tailwind v4 + MySQL

## 📌 تصمیمات باز (از سند ۱۰ بلوپرینت — جواب‌شان از کاربر گرفته شود)

- مدل موجودی: انبار سبک vs دراپ‌شیپ
- بازه سنی دقیق (پیشنهاد: ۲ تا ۱۲ سال، فاز اول)
- سطح پرو آنلاین (پیشنهاد: سطح ۱ + ۲)
- نام ثبت‌شده دامنه/دامنه نهایی

---
*تاریخ: ۲۰۲۶-۰۸-۲۹ — مینی رویال Sprint 0 تکمیل شد.*