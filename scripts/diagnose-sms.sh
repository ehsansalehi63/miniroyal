#!/usr/bin/env bash
# ============================================================================
#  ابزار عیب‌یابی پیامک مینی رویال — روی سرور (Hostinger) اجرا شود
#
#  این اسکریپت هیچ چیزی تغییر نمی‌دهد؛ فقط وضعیت را چاپ می‌کند.
#  خروجی کامل را کپی کنید تا علت دقیق «ارسال نشدن پیامک» مشخص شود.
#
#  اجرا:  bash scripts/diagnose-sms.sh
# ============================================================================
set -uo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
PORT="${PORT:-3000}"
TEST_PHONE="${TEST_PHONE:-}"

hr() { printf '\n\033[1;36m===== %s =====\033[0m\n' "$1"; }
ok() { printf '  \033[1;32m✔\033[0m %s\n' "$1"; }
bad() { printf '  \033[1;31m✘\033[0m %s\n' "$1"; }
info() { printf '  • %s\n' "$1"; }

cd "$APP_DIR" || exit 1

hr "۰) اطلاعات پایه"
info "مسیر برنامه: $APP_DIR"
info "Node: $(node -v 2>/dev/null || echo 'node پیدا نشد!')"
info "کاربر: $(id -un) | تاریخ: $(date '+%F %T %Z')"

# ---------------------------------------------------------------------------
hr "۱) متغیرهای محیطی پیامک که «واقعاً» به پروسه رسیده‌اند"
# این مهم‌ترین بخش است: خیلی وقت‌ها .env درست است ولی pm2 با env قدیمی بالا آمده.
ENV_DUMP="$(mktemp)"
PM2_PID=""
if command -v pm2 >/dev/null 2>&1; then
  PM2_PID="$(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const a=JSON.parse(d);const p=a.find(x=>x.name==="miniroyal")||a[0];console.log(p?p.pid||"":"" )}catch(e){console.log("")}})' 2>/dev/null)"
fi
if [ -z "$PM2_PID" ]; then
  PM2_PID="$(pgrep -f 'node .*server\.js' 2>/dev/null | head -1)"
fi
if [ -n "$PM2_PID" ] && [ -r "/proc/$PM2_PID/environ" ]; then
  info "PID پروسهٔ در حال اجرا: $PM2_PID"
  tr '\0' '\n' < "/proc/$PM2_PID/environ" > "$ENV_DUMP" 2>/dev/null || true
  # کلیدهای حیاتی برای ارسال پیامک
  for k in SMS_PROVIDER SMS_API_KEY; do
    v="$(grep -m1 "^$k=" "$ENV_DUMP" 2>/dev/null | cut -d= -f2-)"
    if [ -z "$v" ]; then bad "$k: در پروسهٔ در حال اجرا وجود ندارد یا خالی است — پیامک ارسال نمی‌شود"; continue; fi
    if [ "$k" = "SMS_API_KEY" ]; then ok "$k: تنظیم شده (طول ${#v}) ${v:0:4}***${v: -4}"; else ok "$k = $v"; fi
  done
  # کلیدهایی که بسته به سرویس لازم‌اند
  for k in SMS_LINE_NUMBER SMS_PATTERN_CODE; do
    v="$(grep -m1 "^$k=" "$ENV_DUMP" 2>/dev/null | cut -d= -f2-)"
    if [ -z "$v" ]; then info "$k: تنظیم نشده (برای ایران‌پیامک لازم است)"; else ok "$k = $v"; fi
  done
  # کلیدهای اختیاری
  for k in SMSIR_TEMPLATE_ID SMS_CONSOLE_FALLBACK NODE_ENV AUTH_SESSION_SECRET; do
    v="$(grep -m1 "^$k=" "$ENV_DUMP" 2>/dev/null | cut -d= -f2-)"
    if [ -z "$v" ]; then info "$k: تنظیم نشده (اختیاری)"; continue; fi
    if [ "$k" = "AUTH_SESSION_SECRET" ]; then ok "$k: تنظیم شده (طول ${#v}) ${v:0:4}***${v: -4}"; else ok "$k = $v"; fi
  done
else
  bad "پروسهٔ miniroyal پیدا نشد یا /proc در دسترس نیست — از pm2 list استفاده کنید."
  command -v pm2 >/dev/null 2>&1 && pm2 list
fi

# ---------------------------------------------------------------------------
hr "۲) فایل‌های .env موجود در مسیر برنامه"
for f in .env .env.local .env.production .env.production.local; do
  if [ -f "$f" ]; then
    info "$f وجود دارد:"
    grep -E '^[[:space:]]*(SMS_|NODE_ENV)' "$f" 2>/dev/null | sed -E 's/(SMS_API_KEY=)(.{0,4}).*/\1\2*** (پنهان شد)/' | sed 's/^/      /'
    [ -z "$(grep -E '^[[:space:]]*SMS_' "$f" 2>/dev/null)" ] && bad "      هیچ کلید SMS_* در $f نیست"
  else
    info "$f وجود ندارد"
  fi
done

# ---------------------------------------------------------------------------
hr "۳) قضاوت کد برنامه دربارهٔ پیکربندی (منبع حقیقت: app/lib/sms.ts)"
if [ -f app/lib/sms.ts ]; then
  MR_ENV_FILE="$ENV_DUMP" node -e '
    const fs=require("fs");
    const QUOTES=[String.fromCharCode(39),String.fromCharCode(34),String.fromCharCode(96)];
    const strip=(x)=>{let v=x.trim();while(v.length&&QUOTES.includes(v[0]))v=v.slice(1);while(v.length&&QUOTES.includes(v[v.length-1]))v=v.slice(0,-1);return v.trim();};
    // ۱) اول متغیرهای واقعیِ پروسهٔ در حال اجرا (از /proc) — این‌ها اولویت دارند
    const envFile=process.env.MR_ENV_FILE;
    if (envFile && fs.existsSync(envFile)) {
      for (const line of fs.readFileSync(envFile,"utf8").split(/\r?\n/)) {
        const i=line.indexOf("=");
        if (i<1) continue;
        const k=line.slice(0,i), v=line.slice(i+1);
        if (!/^SMS_|^NODE_ENV/.test(k)) continue;
        if (process.env[k]===undefined) process.env[k]=strip(v);
      }
    }
    // ۲) بعد فایل‌های .env روی دیسک — برای دیدن اختلاف بین دیسک و پروسهٔ فعال
    for (const f of [".env",".env.local",".env.production"]) {
      if (!fs.existsSync(f)) continue;
      for (const line of fs.readFileSync(f,"utf8").split(/\r?\n/)) {
        const m=/^\s*([\w.]+)\s*=\s*(.*)$/.exec(line);
        if (!m) continue;
        let v=m[2].trim();
        if (!/^SMS_|^NODE_ENV/.test(m[1])) continue;
        if (process.env[m[1]]===undefined) process.env[m[1]]=v.replace(/^["'\'']|["'\'']$/g,"");
      }
    }
    const show=(k)=>{const v=(process.env[k]||"").trim();return v?`${v.length>8?v.slice(0,4)+"***"+v.slice(-4):v+"***"} (طول ${v.length})`:"— خالی —"};
    console.log("  NODE_ENV              =", process.env.NODE_ENV||"(unset)");
    console.log("  SMS_PROVIDER          =", process.env.SMS_PROVIDER||"(unset)");
    console.log("  SMS_API_KEY           =", show("SMS_API_KEY"));
    console.log("  SMS_LINE_NUMBER       =", process.env.SMS_LINE_NUMBER||"(unset)");
    console.log("  SMS_PATTERN_CODE      =", process.env.SMS_PATTERN_CODE||"(unset)");
    console.log("  SMSIR_TEMPLATE_ID     =", process.env.SMSIR_TEMPLATE_ID||"(unset)");
    console.log("  SMS_CONSOLE_FALLBACK  =", process.env.SMS_CONSOLE_FALLBACK||"(unset)");
  '
else
  bad "app/lib/sms.ts پیدا نشد؛ کد روی سرور قدیمی است. ابتدا git pull + npm run build + pm2 restart."
fi

# ---------------------------------------------------------------------------
hr "۴) تست خروجی شبکهٔ سرور به سرویس‌های پیامک (پورت ۴۴۳)"
for host in api.iranpayamak.com api.kavenegar.com api.sms.ir; do
  code="$(curl -s -o /dev/null -m 12 -w '%{http_code}' "https://$host/" 2>/dev/null)"
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    bad "$host: اتصال برقرار نشد (خروجی ۴۴۳ مسدود یا DNS خراب)"
  else
    ok "$host: پاسخ HTTP $code (اتصال برقرار است)"
  fi
done

# ---------------------------------------------------------------------------
hr "۵) فراخوانی مسیر واقعی OTP روی خودِ سرور"
# این دقیقاً همان کدی را اجرا می‌کند که کاربر اجرا می‌کند (route → requestCustomerOtp → sendOtp)
PHONE="${TEST_PHONE:-09120000000}"
info "POST http://127.0.0.1:$PORT/api/customer/request-otp  با شمارهٔ تستی $PHONE"
resp="$(curl -s -m 25 -X POST "http://127.0.0.1:$PORT/api/customer/request-otp" \
        -H 'Content-Type: application/json' -d "{\"phone\":\"$PHONE\"}" 2>&1)"
printf '  پاسخ: %s\n' "${resp:-<خالی — سرور جواب نداد>}"
case "$resp" in
  *'"channel":"console"'*) bad "کد فقط در لاگ چاپ شده؛ پیامکی ارسال نشده است (SMS_PROVIDER روی console یا خالی)." ;;
  *'"success":true'*) ok "مسیر ارسال، موفق برگشت." ;;
  *'"success":false'*) bad "مسیر ارسال خطا داد — متن خطای بالا علت دقیق است." ;;
  *) bad "پاسخی از سرور محلی گرفته نشد؛ وضعیت pm2 و پورت را بررسی کنید." ;;
esac

info "وضعیت گزارش‌شده توسط خود برنامه:"
curl -s -m 15 "http://127.0.0.1:$PORT/api/system-health" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);const s=j.checks&&j.checks.sms_gateway;console.log("  sms_gateway =",s?s.status:"?","|",s?s.detail:"پاسخ نامعتبر");}catch(e){console.log("  (پاسخ /api/system-health قابل پارس نبود)")}})' 2>/dev/null

# ---------------------------------------------------------------------------
hr "۶) لاگ‌های مرتبط با پیامک"
if command -v pm2 >/dev/null 2>&1; then
  pm2 logs miniroyal --lines 300 --nostream 2>/dev/null \
    | grep -iE "MiniRoyal (SMS|OTP)|IranPayamak|kavenegar|sms\.ir|SMS_" | tail -40 \
    | sed 's/^/  /'
  [ -z "$(pm2 logs miniroyal --lines 300 --nostream 2>/dev/null | grep -iE 'MiniRoyal (SMS|OTP)')" ] \
    && info "در ۳۰۰ خط آخر لاگ، رکورد پیامکی پیدا نشد."
else
  bad "pm2 نصب نیست؛ لاگ‌ها را دستی بررسی کنید (~/.pm2/logs)."
fi

rm -f "$ENV_DUMP"
hr "پایان — خروجی بالا را کامل کپی کنید"
