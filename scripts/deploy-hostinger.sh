#!/usr/bin/env bash
# ============================================================================
#  دیپلوی مینی رویال روی هاستینگر (از طریق SSH)
#
#  نحوهٔ اجرا روی سرور:
#     bash scripts/deploy-hostinger.sh
#     GIT_BRANCH=main bash scripts/deploy-hostinger.sh
# ============================================================================

set -euo pipefail

# برنچ پیش‌فرض «main» است.
# نکته: پیش‌تر پیش‌فرض روی arena/01a04d03-miniroyal قفل بود (برنچ یک جلسهٔ قدیمی)
# و دیپلوی دستی، کد اشتباهی را بالا می‌برد. حالا فقط با GIT_BRANCH صریح عوض می‌شود.
BRANCH="${GIT_BRANCH:-main}"

echo "👑 شروع دیپلوی مینی رویال از برنچ: $BRANCH"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# ۱) گرفتن کد
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "   کامیت فعلی: $(git log --oneline -1)"

# ۲) نصب وابستگی‌ها — چون وابستگی‌ها عوض شده‌اند (model-viewer/three/framer-motion حذف شدند)
#    این مرحله اجباری است وگرنه بیلد با ماژول‌های قدیمی شکست می‌خورد.
if [ -f package-lock.json ]; then
  npm ci --legacy-peer-deps || npm install --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

# ۳) بیلد
npm run build

# اطمینان از اینکه بیلد واقعاً خروجی داده قبل از اینکه سرویس را ری‌استارت کنیم
if [ ! -f .next/BUILD_ID ]; then
  echo "❌ بیلد BUILD_ID تولید نکرد؛ سرویس دست‌نخورده باقی می‌ماند."
  exit 1
fi
echo "   BUILD_ID: $(cat .next/BUILD_ID)"

# ۴) اسکیمای دیتابیس (اختیاری)
bash scripts/init-db.sh || echo "   ⚠️ init-db.sh ناموفق بود (ادامه می‌دهیم)"

# ۵) ری‌استارت سرویس
# --update-env مهم است: بدون آن pm2 متغیرهای محیطی تازهٔ .env را نمی‌خواند
# و همان چیزی است که باعث می‌شد تغییر SMS_* روی سرور اثر نکند.
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart miniroyal --update-env \
    || pm2 start npm --name "miniroyal" -- start
  echo "✅ PM2 ری‌استارت شد"
else
  echo "⚠️ pm2 پیدا نشد؛ سرویس را دستی ری‌استارت کنید."
fi

# ۶) بررسی پس از دیپلوی
sleep 4
PORT_CHECK="${PORT:-3000}"
echo "── بررسی پس از دیپلوی ──────────────────────────────"
curl -s -m 15 "http://127.0.0.1:${PORT_CHECK}/api/system-status" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);console.log("  نسخه:",j.version,"| buildTime:",j.buildTime);console.log("  پیامک:",j.features.smsGateway?"فعال ✅":"غیرفعال ❌","| سرویس:",j.features.smsProvider||"—","| مسیر:",j.features.smsMode||"—")}catch(e){console.log("  ⚠️ پاسخ /api/system-status قابل پارس نبود")}})' \
  || echo "  ⚠️ سرور محلی پاسخ نداد"

echo "🎉 دیپلوی تمام شد. برای گزارش کامل پیامک: bash scripts/diagnose-sms.sh"
