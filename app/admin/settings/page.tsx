"use client";

import { useState, useEffect } from "react";
import { Settings, Server, Save, Store, Bell, CreditCard, Truck, KeyRound, MessageSquareCode, CheckCircle2, ShieldCheck, Activity, Search, Globe, ExternalLink } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("مینی رویال");
  const [tagline, setTagline] = useState("فروشگاه تخصصی پوشاک کودک و نوجوان");
  const [phone, setPhone] = useState("۰۲۱-۸۸۸۸۹۹۹۹");
  const [mobile, setMobile] = useState("۰۹۱۲۳۴۵۶۷۸۹");
  const [address, setAddress] = useState("تهران، خیابان ولیعصر، مجتمع تجاری رویال، پلاک ۴۲");
  
  const [announcementText, setAnnouncementText] = useState("👑 ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان | 👗 پرو آنلاین لباس با تضمین سایز");
  const [heroTitle, setHeroTitle] = useState("شیک‌ترین لباس‌های فصل برای فرشته‌های کوچک شما 👑");
  const [heroSubtitle, setHeroSubtitle] = useState("کالکشن جدید پاییزه و زمستانه با پارچه‌های ۱۰۰٪ پنبه ارگانیک ضد حساسیت");

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500000);
  const [baseShippingFee, setBaseShippingFee] = useState(45000);

  // درگاه‌های پرداخت
  const [activeGateway, setActiveGateway] = useState("zarinpal");
  const [zarinpalMerchant, setZarinpalMerchant] = useState("00000000-0000-0000-0000-000000000000");
  const [isSandbox, setIsSandbox] = useState(true);

  // سامانه پیامک
  const [smsProvider, setSmsProvider] = useState("iranpayamak");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderLine, setSmsSenderLine] = useState("10008888");
  const [smsPatternCode, setSmsPatternCode] = useState("100100");

  // سئو و گوگل سرچ کنسول
  const [googleSearchConsoleToken, setGoogleSearchConsoleToken] = useState("google-site-verification-miniroyal-search-console");
  const [seoMetaTitle, setSeoMetaTitle] = useState("مینی رویال | خرید اینترنتی لباس کودک و نوزاد با پرو آنلاین هوشمند");
  const [seoMetaDescription, setSeoMetaDescription] = useState("فروشگاه اینترنتی پوشاک کودک و نوجوان مینی رویال با قابلیت منحصر‌به‌فرد پرو آنلاین، هوش مصنوعی راهنمای سایز دقیق، ارسال سریع تیپاکس و ضمانت بازگشت.");
  const [seoKeywords, setSeoKeywords] = useState("خرید لباس کودک, پوشاک نوزاد و سیسمونی, پرو آنلاین لباس کودک, لباس مجلسی دخترانه شیک, ست پسرانه شیک, جدول سایز استاندارد لباس کودک, مینی رویال");

  // تغییر رمز عبور ادمین
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [buildInfo, setBuildInfo] = useState<{ version: string; buildTime: string } | null>(null);
  const [smsLive, setSmsLive] = useState<{ gateway: boolean; provider: string | null; mode: string | null } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.siteName) setSiteName(s.siteName);
          if (s.tagline) setTagline(s.tagline);
          if (s.phone) setPhone(s.phone);
          if (s.mobile) setMobile(s.mobile);
          if (s.address) setAddress(s.address);
          if (s.announcementText) setAnnouncementText(s.announcementText);
          if (s.heroTitle) setHeroTitle(s.heroTitle);
          if (s.heroSubtitle) setHeroSubtitle(s.heroSubtitle);
          if (s.freeShippingThreshold) setFreeShippingThreshold(Number(s.freeShippingThreshold));
          if (s.baseShippingFee) setBaseShippingFee(Number(s.baseShippingFee));
          if (s.activeGateway) setActiveGateway(s.activeGateway);
          if (s.zarinpalMerchant) setZarinpalMerchant(s.zarinpalMerchant);
          if (s.isSandbox !== undefined) setIsSandbox(Boolean(s.isSandbox));
          if (s.smsProvider) setSmsProvider(s.smsProvider);
          if (s.smsSenderLine) setSmsSenderLine(s.smsSenderLine);
          if (s.smsPatternCode) setSmsPatternCode(s.smsPatternCode);
          if (s.googleSearchConsoleToken) setGoogleSearchConsoleToken(s.googleSearchConsoleToken);
          if (s.seoMetaTitle) setSeoMetaTitle(s.seoMetaTitle);
          if (s.seoMetaDescription) setSeoMetaDescription(s.seoMetaDescription);
          if (s.seoKeywords) setSeoKeywords(s.seoKeywords);
        }
      })
      .catch(() => {});

    fetch("/api/system-status")
      .then((res) => res.json())
      .then((data) => {
        setBuildInfo({
          version: data.version || "1.2.0",
          buildTime: new Date(data.buildTime).toLocaleString("fa-IR"),
        });
        setSmsLive({
          gateway: Boolean(data.features?.smsGateway),
          provider: data.features?.smsProvider ?? null,
          mode: data.features?.smsMode ?? null,
        });
      })
      .catch(() => {
        setBuildInfo({ version: "1.2.0", buildTime: "امروز" });
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName,
          tagline,
          phone,
          mobile,
          address,
          announcementText,
          heroTitle,
          heroSubtitle,
          freeShippingThreshold,
          baseShippingFee,
          activeGateway,
          zarinpalMerchant,
          isSandbox,
          smsProvider,
          smsSenderLine,
          smsPatternCode,
          googleSearchConsoleToken,
          seoMetaTitle,
          seoMetaDescription,
          seoKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ذخیره تنظیمات ناموفق بود.");
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "خطا در ذخیره تنظیمات");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem("miniroyal_admin_password") || "admin123";
    
    if (currentPasswordInput !== stored) {
      setPasswordFeedback({ success: false, message: "رمز عبور فعلی اشتباه است." });
      return;
    }
    
    if (newPasswordInput.length < 4) {
      setPasswordFeedback({ success: false, message: "رمز عبور جدید باید حداقل ۴ کاراکتر باشد." });
      return;
    }

    localStorage.setItem("miniroyal_admin_password", newPasswordInput);
    setPasswordFeedback({ success: true, message: "رمز عبور جدید ادمین با موفقیت ذخیره شد! 🎉" });
    setCurrentPasswordInput("");
    setNewPasswordInput("");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* نشانگر تاییدیه لایو به‌روزرسانی */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">تنظیمات اصلی فروشگاه و امنیت ⚙️</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800 border border-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              تاییدیه لایو نسخه {buildInfo?.version || "1.2.0"}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            آخرین بیلد سرور: <strong className="text-stone-800">{buildInfo?.buildTime || "در حال لود..."}</strong> — مدیریت کامل تنظیمات و لایه امنیت
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={savingSettings}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 py-3 text-xs font-black text-white shadow-lg transition hover:bg-stone-800 disabled:opacity-50"
        >
          <Save className="size-4" />
          <span>{savingSettings ? "در حال ذخیره در دیتابیس..." : isSaved ? "ذخیره شد! 🎉" : "ذخیره تغییرات سایت"}</span>
        </button>
      </div>

      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {saveError}
        </div>
      )}

      {/* ۱. تغییر رمز عبور ادمین */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <KeyRound className="size-5 text-amber-600" />
          <span>تغییر رمز عبور حساب ادمین</span>
        </h2>

        <form onSubmit={handleChangePassword} className="mt-4 grid gap-4 sm:grid-cols-3 items-end text-xs">
          <div>
            <label className="block font-bold text-stone-700">رمز عبور فعلی</label>
            <input
              type="password"
              value={currentPasswordInput}
              onChange={(e) => setCurrentPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700">رمز عبور جدید</label>
            <input
              type="password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="حداقل ۴ کاراکتر"
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full rounded-xl bg-stone-950 py-2.5 text-xs font-black text-white shadow hover:bg-stone-800 transition"
            >
              ثبت رمز عبور جدید
            </button>
          </div>
        </form>

        {passwordFeedback && (
          <p
            className={`mt-3 text-xs font-bold ${
              passwordFeedback.success ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {passwordFeedback.message}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* ۲. درگاه‌های پرداخت آنلاین */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <CreditCard className="size-5 text-amber-600" />
            <span>تنظیمات درگاه‌های پرداخت آنلاین</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">انتخاب درگاه فعال سایت</label>
              <select
                value={activeGateway}
                onChange={(e) => setActiveGateway(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500 font-bold"
              >
                <option value="zarinpal">زرین‌پال (ZarinPal)</option>
                <option value="parsian">بانک پارسیان (Parsian)</option>
                <option value="pasargad">بانک پاسارگاد (Pasargad)</option>
                <option value="idpay">آیدی پی (IDPay)</option>
                <option value="nextpay">نکست پی (NextPay)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700">کد مرچنت درگاه (Merchant ID)</label>
              <input
                type="text"
                value={zarinpalMerchant}
                onChange={(e) => setZarinpalMerchant(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-3">
              <div>
                <span className="block font-bold text-stone-800">محیط تست آزمایشی (Sandbox Mode)</span>
                <span className="text-[11px] text-stone-500">پرداخت‌های تستی جهت صحت سنجی فرآیند سفارش</span>
              </div>
              <input
                type="checkbox"
                checked={isSandbox}
                onChange={(e) => setIsSandbox(e.target.checked)}
                className="size-5 accent-amber-600"
              />
            </div>
          </div>
        </div>

        {/* ۳. اتصال به پنل پیامکی */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <MessageSquareCode className="size-5 text-amber-600" />
            <span>تنظیمات سامانه پیامک و کد ورود OTP</span>
          </h2>

          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[11px] leading-6 text-amber-900">
            <p className="font-black">⚠️ این فرم فقط نمایشی است و چیزی ذخیره نمی‌کند.</p>
            <p>
              منبع حقیقت پیکربندی پیامک، متغیرهای محیطی سرور است:
              <code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">SMS_PROVIDER</code>
              <code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">SMS_API_KEY</code>
              <code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">SMS_LINE_NUMBER</code>
              <code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">SMS_PATTERN_CODE</code>
              در فایل <code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">.env</code> مسیر برنامه — بعد از تغییر، سرویس را ری‌استارت کنید
              (<code dir="ltr" className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono">pm2 restart miniroyal</code>).
            </p>
            <p className="mt-2 font-bold">
              وضعیت واقعی روی سرور:{" "}
              {smsLive === null ? "در حال بررسی..." : smsLive.gateway ? (
                <span className="text-emerald-700">
                  فعال ✅ — سرویس {smsLive.provider} (مسیر {smsLive.mode})
                </span>
              ) : (
                <span className="text-red-700">
                  غیرفعال ❌ — پیامک ارسال نمی‌شود؛ جزئیات در صفحهٔ «سلامت سیستم»
                </span>
              )}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">سرویس‌دهنده پیامک</label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500 font-bold"
              >
                {/* فقط سرویس‌هایی که در app/lib/sms.ts پیاده‌سازی شده‌اند. */}
                <option value="iranpayamak">ایران پیامک / فراز (IranPayamak)</option>
                <option value="kavenegar">کاوه نگار (Kavenegar)</option>
                <option value="smsir">اس‌ام‌اس آی‌آر (SMS.ir)</option>
                <option value="console">حالت توسعه (console — بدون ارسال پیامک)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700">کلید API سامانه پیامک (API Key)</label>
              <input
                type="text"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="مثال: 3456...45345"
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700">شماره خط اختصاصی</label>
                <input
                  type="text"
                  value={smsSenderLine}
                  onChange={(e) => setSmsSenderLine(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700">کد پترن OTP ورود</label>
                <input
                  type="text"
                  value={smsPatternCode}
                  onChange={(e) => setSmsPatternCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ۴. هویت برند و اطلاعات تماس */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Store className="size-5 text-amber-600" />
            <span>اطلاعات عمومی برند و تماس</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">نام تجاری فروشگاه</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700">شعار برند</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700">تلفن ثابت پشتیبانی</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700">موبایل / واتساپ پشتیبانی</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700">آدرس دفتر مرکزی / فروشگاه</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* ۵. نرخ‌های ارسال و ارسال رایگان */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Truck className="size-5 text-amber-600" />
            <span>تنظیمات ارسال و پست</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">سقف خرید جهت ارسال رایگان (تومان)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700">هزینه پایه پست پیشتاز و تیپاکس (تومان)</label>
              <input
                type="number"
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* ۶. تنظیمات سئو و اتصال گوگل سرچ کنسول (Google Search Console) */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Search className="size-5 text-amber-600" />
              <span>تنظیمات سئو (SEO)، کلمات کلیدی و اتصال گوگل سرچ کنسول</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200/80">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>سئو تکنیکال و متاتگ‌های پیشرفته فعال</span>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs leading-6 text-sky-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sky-900">
              <Globe className="size-4 text-sky-700" />
              <span>وضعیت فایل‌های استاندارد برای خزنده‌های گوگل (Googlebot):</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-sky-900 shadow-sm border border-sky-200 hover:bg-sky-100 transition"
              >
                <span>مشاهده نقشه سایت (sitemap.xml)</span>
                <ExternalLink className="size-3 text-sky-700" />
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-sky-900 shadow-sm border border-sky-200 hover:bg-sky-100 transition"
              >
                <span>مشاهده فایل robots.txt</span>
                <ExternalLink className="size-3 text-sky-700" />
              </a>
            </div>
            <p className="text-[11px] text-sky-800 pt-1">
              تمام محصولات موجود در دیتابیس، دسته‌بندی‌های دخترانه و پسرانه، مقالات مجله و صفحات پرو آنلاین به صورت خودکار با متاتگ‌های <code className="bg-white/80 px-1 rounded font-mono">OpenGraph</code>، <code className="bg-white/80 px-1 rounded font-mono">JSON-LD Structured Data</code> و <code className="bg-white/80 px-1 rounded font-mono">Canonical</code> در ایندکس گوگل قرار دارند.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-800">
                کد تایید اتصال گوگل سرچ کنسول (Google Site Verification Token)
              </label>
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: google-site-verification-miniroyal-search-console یا هش کدی مثل abc123xyz"
                  value={googleSearchConsoleToken}
                  onChange={(e) => setGoogleSearchConsoleToken(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-amber-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                این توکن به صورت خودکار در متاتگ <code className="font-mono text-stone-700">&lt;meta name=&quot;google-site-verification&quot;&gt;</code> و همچنین فایل <code className="font-mono text-stone-700">/google*.html</code> تزریق می‌شود و تاییدیه سرچ کنسول گوگل را بلافاصله سبز می‌کند.
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-800">عنوان اصلی متاتگ سایت برای نتایج گوگل (Meta Title)</label>
              <input
                type="text"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                توصیه: حداکثر ۶۰ کاراکتر حاوی کلمات کلیدی اصلی و برند مینی رویال.
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-800">توضیحات سئو سایت در سرچ گوگل (Meta Description)</label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                توصیه: بین ۱۲۰ تا ۱۶۰ کاراکتر جذاب و ترغیب‌کننده برای افزایش نرخ کلیک (CTR) در نتایج گوگل.
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-800">کلمات کلیدی استراتژیک سئو (Keywords جهت ارتقای رتبه)</label>
              <textarea
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                rows={3}
                placeholder="کلمات را با کاما جدا کنید..."
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                کلمات کلیدی اصلی که روی آن فوکوس کرده‌اید: خرید لباس کودک، پرو آنلاین هوشمند لباس، لباس مجلسی دخترانه، لباس پسرانه، جدول سایز کودک.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
