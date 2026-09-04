# 🚀 مسیر دیپلوی مینی رویال — و اینکه چرا یک پوش به‌تنهایی سایت را به‌روز نمی‌کند

## زنجیرهٔ دیپلوی (همان‌طور که در کد وجود دارد)

```
push به main
   └─► .github/workflows/trigger-deploy.yml        (فقط روی main اجرا می‌شود)
          └─► POST به DEPLOY_WEBHOOK_URL با امضای MINIROYAL_WEBHOOK_SECRET
                 └─► /api/github-webhook روی سرور
                        ├─ امضا با GITHUB_WEBHOOK_SECRET بررسی می‌شود
                        ├─ برنچ باید در ALLOWED_BRANCHES باشد (پیش‌فرض: main)
                        ├─ اگر AUTO_DEPLOY_WEBHOOK=true نباشد → فقط ثبت می‌شود،
                        │   دیپلوی انجام نمی‌شود («managed by Hostinger Git»)
                        └─ در غیر این صورت git pull + build + pm2 restart
```

## چک‌لیست وقتی سایت به‌روز نشد

| # | پرسش | چطور بررسی کنیم |
|---|---|---|
| ۱ | کد روی `main` است؟ | `git ls-remote --heads origin` — اگر کار روی یک برنچ `arena/*` باشد، هیچ‌کدام از مراحل بالا اجرا نمی‌شود |
| ۲ | ورک‌فلو اجرا شده؟ | `gh run list --limit 5` (ستون برنچ باید `main` باشد) |
| ۳ | Secrets تعریف شده‌اند؟ | `gh secret list` — به `DEPLOY_WEBHOOK_URL` و `MINIROYAL_WEBHOOK_SECRET` نیاز دارد |
| ۴ | وب‌هوک روی سرور فعال است؟ | `AUTO_DEPLOY_WEBHOOK=true` و `GITHUB_WEBHOOK_SECRET` در `.env` سرور |
| ۵ | لاگ وب‌هوک چه می‌گوید؟ | `/api/github-webhook/status` با `DEPLOY_STATUS_TOKEN` |
| ۶ | بیلد روی سرور موفق بوده؟ | `pm2 logs miniroyal` و وجود `.next/BUILD_ID` |

> ⚠️ **«موفق» بودن ورک‌فلو در گیت‌هاب به معنای دیپلوی‌شدن نیست.** آن ورک‌فلو فقط یک
> درخواست POST می‌فرستد؛ کار واقعی روی سرور انجام می‌شود. اگر Secrets تعریف نشده
> باشند، ورک‌فلو پیام «Webhook secrets are not configured» را چاپ می‌کند و با
> وضعیت موفقیت بیرون می‌آید.

## دیپلوی دستی (مطمئن‌ترین راه)

با SSH به هاستینگر:

```bash
cd ~/domains/miniroyal.shop/public_html      # مسیر نصب برنامه
GIT_BRANCH=main bash scripts/deploy-hostinger.sh
```

اسکریپت این کارها را می‌کند: `git pull` → `npm ci` → `npm run build` → بررسی
`BUILD_ID` → `pm2 restart miniroyal --update-env` → چاپ وضعیت پیامک و زمان بیلد.

### سه نکتهٔ مهم

1. **`--update-env`** در ری‌استارت pm2 لازم است. بدون آن pm2 متغیرهای محیطی تازهٔ
   `.env` را نمی‌خواند — این دقیقاً همان چیزی است که باعث می‌شود تغییر `SMS_*`
   روی سرور بی‌اثر بماند.
2. **`npm ci` اجباری است** وقتی وابستگی‌ها عوض شده باشند (مثلاً حذف
   `@google/model-viewer`/`three`/`framer-motion`).
3. **بیلد لازم است** چون تشخیص ویدیوی هیرو (`public/video/hero.mp4`) هنگام build
   انجام می‌شود و فایل‌های WebP تازه هم باید در بیلد دیده شوند.

## دیپلوی با Git خودِ هاستینگر

اگر در hPanel گزینهٔ Git auto-deploy روشن است، هاستینگر برنچ `main` را می‌کشد و
دستور بیلد را اجرا می‌کند. در این حالت `AUTO_DEPLOY_WEBHOOK` را `false` نگه دارید
تا دو مسیر دیپلوی هم‌زمان اجرا نشوند (پیش‌فرض `.env.example` هم `false` است).
