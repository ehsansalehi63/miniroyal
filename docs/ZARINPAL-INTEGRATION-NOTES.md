# یادداشت اتصال زرین‌پال

بر اساس مستندات رسمی زرین‌پال در تاریخ ۱۴۰۵/۰۶/۰۴، محیط آزمایشی با جایگزین‌کردن دامنهٔ `payment.zarinpal.com` با `sandbox.zarinpal.com` فعال می‌شود. Authorityهای sandbox با حرف `S` شروع می‌شوند و برای sandbox می‌توان یک UUID دلخواه به‌عنوان merchant ID وارد کرد.

در متد verify، مقدار `amount` باید با مبلغ اصلی تراکنش مطابقت داشته باشد و باید از دیتابیس خوانده شود؛ پارامترهای اصلی `authority` و `amount` هستند. کد پاسخ ۱۰۰ موفقیت تأیید و کد ۱۰۱ به معنی قبلاً تأییدشدن تراکنش است.

منبع‌ها:

1. https://www.zarinpal.com/docs/paymentGateway/sandBox — سرویس تست (sandbox)
2. https://www.zarinpal.com/docs/sdk/nodejs/method/verify — تأیید پرداخت در Node.js
