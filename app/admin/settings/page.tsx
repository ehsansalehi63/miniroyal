"use client";

import { useState, useEffect } from "react";
import { Save, Store, CreditCard, Truck, KeyRound, MessageSquareCode } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("مینی رویال");
  const [tagline, setTagline] = useState("فروشگاه تخصصی پوشاک کودک و نوجوان");
  const [phone, setPhone] = useState("۰۲۱-۸۸۸۸۹۹۹۹");
  const [mobile, setMobile] = useState("۰۹۱۲۳۴۵۶۷۸۹");
  const [address, setAddress] = useState("تهران، خیابان ولیعصر، مجتمع تجاری رویال، پلاک ۴۲");
  

  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500000);
  const [baseShippingFee, setBaseShippingFee] = useState(45000);

  // درگاه‌های پرداخت
  const [activeGateway, setActiveGateway] = useState("zarinpal");
  const [zarinpalMerchant, setZarinpalMerchant] = useState("00000000-0000-0000-0000-000000000000");
  const [isSandbox, setIsSandbox] = useState(true);

  // سامانه پیامک
  const [smsProvider, setSmsProvider] = useState("kavenegar");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderLine, setSmsSenderLine] = useState("10008888");
  const [smsPatternCode, setSmsPatternCode] = useState("100100");

  // تغییر رمز عبور ادمین
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [buildInfo, setBuildInfo] = useState<{ version: string; buildTime: string } | null>(null);

  useEffect(() => {
    fetch("/api/system-status")
      .then((res) => res.json())
      .then((data) => {
        setBuildInfo({
          version: data.version || "1.2.0",
          buildTime: new Date(data.buildTime).toLocaleString("fa-IR"),
        });
      })
      .catch(() => {
        setBuildInfo({ version: "1.2.0", buildTime: "امروز" });
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-xs font-black text-white shadow-lg transition hover:brightness-110"
        >
          <Save className="size-4" />
          <span>{isSaved ? "ذخیره شد! 🎉" : "ذخیره تغییرات سایت"}</span>
        </button>
      </div>

      {/* ۱. تغییر رمز عبور ادمین */}
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
        <h2 className="text-base font-black text-stone-900 border-b border-violet-100 pb-3 flex items-center gap-2">
          <KeyRound className="size-5 text-violet-600" />
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
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 outline-none focus:border-violet-500"
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
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-700 py-2.5 text-xs font-bold text-white shadow hover:bg-violet-800"
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
            <CreditCard className="size-5 text-violet-600" />
            <span>تنظیمات درگاه‌های پرداخت آنلاین</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">انتخاب درگاه فعال سایت</label>
              <select
                value={activeGateway}
                onChange={(e) => setActiveGateway(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
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
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-violet-500"
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
                className="size-5 accent-violet-600"
              />
            </div>
          </div>
        </div>

        {/* ۳. اتصال به پنل پیامکی */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <MessageSquareCode className="size-5 text-violet-600" />
            <span>تنظیمات سامانه پیامک و کد ورود OTP</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">سرویس‌دهنده پیامک</label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              >
                <option value="kavenegar">کاوه نگار (Kavenegar)</option>
                <option value="melipayamak">ملی پیامک (Melipayamak)</option>
                <option value="farazsms">فراز اس‌ام‌اس (FarazSMS)</option>
                <option value="ghasedak">قاصدک (Ghasedak)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700">کلید API سامانه پیامک (API Key)</label>
              <input
                type="text"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="مثال: 3456...45345"
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700">شماره خط اختصاصی</label>
                <input
                  type="text"
                  value={smsSenderLine}
                  onChange={(e) => setSmsSenderLine(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700">کد پترن OTP ورود</label>
                <input
                  type="text"
                  value={smsPatternCode}
                  onChange={(e) => setSmsPatternCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 font-mono outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ۴. هویت برند و اطلاعات تماس */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Store className="size-5 text-violet-600" />
            <span>اطلاعات عمومی برند و تماس</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">نام تجاری فروشگاه</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700">شعار برند</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700">تلفن ثابت پشتیبانی</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700">موبایل / واتساپ پشتیبانی</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700">آدرس دفتر مرکزی / فروشگاه</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* ۵. نرخ‌های ارسال و ارسال رایگان */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Truck className="size-5 text-violet-600" />
            <span>تنظیمات ارسال و پست</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700">سقف خرید جهت ارسال رایگان (تومان)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700">هزینه پایه پست پیشتاز و تیپاکس (تومان)</label>
              <input
                type="number"
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
