# Hostinger Environment Matrix

مقادیر واقعی این متغیرها در Hostinger تنظیم شده‌اند و در این فایل عمداً
نمایش داده نمی‌شوند. این فایل فقط نام، نقش و وضعیت لازم را ثبت می‌کند.

| متغیر | نقش | لازم برای |
|---|---|---|
| `SITE_URL` | دامنهٔ canonical سایت | callback پرداخت، لینک‌ها |
| `SITE_NAME` | نام فروشگاه | metadata و UI |
| `MYSQL_HOST` | میزبان MySQL | دیتابیس |
| `MYSQL_PORT` | پورت MySQL | دیتابیس |
| `MYSQL_DATABASE` | نام دیتابیس | دیتابیس |
| `MYSQL_USER` | کاربر دیتابیس | دیتابیس |
| `MYSQL_PASSWORD` | رمز دیتابیس | دیتابیس |
| `ZARINPAL_MERCHANT_ID` | شناسهٔ درگاه | پرداخت |
| `ZARINPAL_SANDBOX` | حالت تست/واقعی | پرداخت |
| `PAYMENT_STATE_SECRET` | امضای state پرداخت | پرداخت |
| `AUTH_SESSION_SECRET` | امضای نشست مشتری | حساب مشتری؛ جدا از payment ترجیح دارد |
| `GITHUB_WEBHOOK_SECRET` | اعتبارسنجی signature وب‌هوک | auto deploy |
| `DEPLOY_STATUS_TOKEN` | مجوز گزارش deploy | auto deploy |
| `ALLOWED_BRANCHES` | شاخه‌های مجاز | auto deploy؛ فعلاً `main` |
| `AUTO_DEPLOY_WEBHOOK` | فعال/غیرفعال‌کردن deploy داخلی | webhook |
| `ENFORCE_GITHUB_IP` | محدودیت IP وب‌هوک | webhook |
| `RESTART_COMMAND` | فرمان restart برنامه | PM2 |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | شمارهٔ واتساپ عمومی | ارتباط مشتری |
| `DAHL_API_KEY` | کلید تحلیل Vision | پرو آنلاین |
| `DAHL_API_URL` | endpoint سازگار OpenAI | پرو آنلاین |
| `DAHL_VISION_MODEL` | مدل Vision دال | پرو آنلاین |
| `OPENROUTER_API_KEY` | کلید تحلیل Vision جایگزین | پرو آنلاین |
| `OPENROUTER_API_URL` | endpoint OpenRouter | پرو آنلاین |
| `OPENROUTER_VISION_MODEL` | مدل Vision؛ پیش‌فرض `openrouter/free` | پرو آنلاین |
| `AIHUBMIX_API_KEY` | کلید تولید/ویرایش تصویر | پرو آنلاین و ویرایش تصویر |
| `AIHUBMIX_IMAGE_URL` | endpoint ویرایش تصویر | AIHubMix |
| `AIHUBMIX_IMAGE_MODELS` | فهرست مدل‌های fallback با comma | AIHubMix |
| `AIHUBMIX_TRYON_URL` | endpoint Native چندتصویری پروآنلاین | AIHubMix؛ پیش‌فرض Seedream 4.5 |
| `AIHUBMIX_TRYON_MODEL` | مدل Native چندتصویری پروآنلاین | پیش‌فرض `doubao-seedream-4-5` |
| `AIHUBMIX_IMAGE_SIZE` | اندازهٔ خروجی | AIHubMix |
| `AIHUBMIX_IMAGE_QUALITY` | کیفیت خروجی | AIHubMix |
| `AIHUBMIX_TIMEOUT_MS` | timeout درخواست تصویر | AIHubMix |
| `POLLINATIONS_API_KEY` | موتور fallback تولید تصویر | پرو آنلاین |
| `TRYON_API_URL` | endpoint fallback پرو | Pollinations یا provider سازگار |
| `TRYON_MODEL` | مدل image-edit چندمرجعی؛ توصیه: `seedream` | پرو آنلاین |
| `TRYON_TIMEOUT_MS` | timeout تولید پرو | پرو آنلاین |

## متغیرهای پایهٔ قالب

این موارد نیز در `.env.example` نگه‌داری می‌شوند:

`NODE_ENV`, `TZ`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`,
`AI_MODEL_CHEAP`, `SMS_PROVIDER`, `SMS_API_KEY`, `INFRA_STAGE`, `QUEUE_DRIVER`,
`STORAGE_DRIVER`, `SEARCH_DRIVER`, `VIDEO_DRIVER`, `POLLINATIONS_API_KEY`.

## چک‌لیست بعد از تغییر Environment

1. Save در Hostinger.
2. Restart برنامهٔ Node/PM2.
3. بازکردن `/api/system-health`.
4. بازکردن `/virtual-tryon`.
5. تست با عکس کوچک کاربر و یک عکس محصول.
6. در صورت خطا، log برنامه و مقدار نام مدل/endpoint را بررسی کنید؛ مقدار کلید را در چت ارسال نکنید.
