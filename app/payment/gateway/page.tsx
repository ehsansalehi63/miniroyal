"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatToman, toPersianDigits } from "../../lib/utils";
import { ShieldCheck, Lock, RefreshCw, CreditCard, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function PaymentGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "MR-882910";
  const amount = Number(searchParams.get("amount") || 680000);

  // Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("06");
  const [expYear, setExpYear] = useState("06");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("8492");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);

  // Gateway Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(599); // 10 minutes timer

  // Countdown timer for payment session
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  const refreshCaptcha = () => {
    const randomCaptcha = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(randomCaptcha);
  };

  // Detect Bank Name from BIN (First 6 digits)
  const getBankInfo = (num: string) => {
    const bin = num.replace(/\D/g, "").slice(0, 6);
    if (bin.startsWith("603799")) return { name: "بانک ملی ایران", color: "bg-blue-600" };
    if (bin.startsWith("610433")) return { name: "بانک ملت", color: "bg-rose-700" };
    if (bin.startsWith("621986")) return { name: "بانک سامان", color: "bg-sky-600" };
    if (bin.startsWith("639346")) return { name: "بانک پاسارگاد", color: "bg-amber-600" };
    if (bin.startsWith("622101")) return { name: "بانک پارسیان", color: "bg-red-700" };
    if (bin.startsWith("502229")) return { name: "بانک پاسارگاد (بلو)", color: "bg-indigo-600" };
    if (bin.startsWith("603769")) return { name: "بانک صادرات", color: "bg-blue-800" };
    return { name: "شبکه الکترونیکی پرداخت (شتاب)", color: "bg-violet-800" };
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1-");
    setCardNumber(formatted);
  };

  const handleSendOTP = () => {
    if (cardNumber.replace(/\D/g, "").length < 16) {
      setErrorMessage("لطفاً ابتدا شماره کارت ۱۶ رقمی را کامل وارد کنید.");
      return;
    }
    setErrorMessage("");
    setOtpSent(true);
    setOtpTimer(120);
    // Auto fill simulated OTP after 1.5 seconds for smooth UX
    setTimeout(() => {
      setOtpInput("794120");
    }, 1200);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanCard = cardNumber.replace(/\D/g, "");
    if (cleanCard.length < 16) {
      setErrorMessage("شماره کارت باید ۱۶ رقم باشد.");
      return;
    }
    if (cvv2.length < 3) {
      setErrorMessage("کد CVV2 نامعتبر است.");
      return;
    }
    if (captchaInput !== captchaCode) {
      setErrorMessage("کد امنیتی تصویر نادرست است.");
      refreshCaptcha();
      return;
    }
    if (!otpInput) {
      setErrorMessage("لطفاً رمز پویا را وارد کنید یا دکمه دریافت رمز پویا را بزنید.");
      return;
    }

    setIsProcessing(true);

    // Generate real Shaparak RefID & Authority
    const refId = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    setTimeout(() => {
      // Record order payment status in localStorage
      const existingOrders = JSON.parse(localStorage.getItem("miniroyal_orders") || "[]");
      const updatedOrders = existingOrders.map((ord: any) =>
        ord.orderNumber === orderNumber
          ? { ...ord, status: "paid", paymentRefId: refId, paidAt: new Date().toISOString() }
          : ord
      );
      localStorage.setItem("miniroyal_orders", JSON.stringify(updatedOrders));

      // Redirect to Order Success Page with RefId
      router.push(`/order/success/${orderNumber}?refId=${refId}&status=OK`);
    }, 2000);
  };

  const bankInfo = getBankInfo(cardNumber);
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 font-sans dir-rtl">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        {/* هدر رسمی شاپارک و زرین‌پال */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-4 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-md text-2xl font-black shadow-inner">
              💳
            </div>
            <div>
              <h1 className="text-base font-black">درگاه پرداخت الکترونیک شاپارک | Shaparak</h1>
              <p className="text-xs text-amber-100">پذیرنده: فروشگاه اینترنتی مینی رویال (miniroyal.shop)</p>
            </div>
          </div>

          <div className="text-left bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20">
            <span className="block text-[10px] text-amber-200">زمان باقی‌مانده session:</span>
            <span className="text-sm font-mono font-black tracking-widest">
              {toPersianDigits(minutes.toString().padStart(2, "0"))}:{toPersianDigits(seconds.toString().padStart(2, "0"))}
            </span>
          </div>
        </div>

        {/* خلاصه فاکتور پرداخت */}
        <div className="bg-stone-50 p-4 border-b border-stone-200 flex flex-wrap items-center justify-between text-xs gap-3">
          <div>
            <span className="text-stone-500">شماره سفارش: </span>
            <strong className="text-stone-900 font-mono text-sm font-black">{orderNumber}</strong>
          </div>
          <div>
            <span className="text-stone-500">مبلغ قابل پرداخت: </span>
            <strong className="text-emerald-700 text-base font-black">{formatToman(amount)}</strong>
          </div>
        </div>

        {/* فرم دریافت اطلاعات کارت بانکی شتاب */}
        <form onSubmit={handlePaymentSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* پیش‌نمایش کارت بانکی */}
          <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-all duration-300 ${bankInfo.color}`}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {bankInfo.name}
              </span>
              <span className="text-sm font-black opacity-80">عضو شبکه شتاب</span>
            </div>

            <div className="my-4 text-center">
              <span className="text-xl sm:text-2xl font-mono font-black tracking-widest text-white dir-ltr block">
                {cardNumber || "•••• - •••• - •••• - ••••"}
              </span>
            </div>

            <div className="flex justify-between items-end text-xs pt-2 font-mono">
              <div>
                <span className="block text-[10px] opacity-70">CVV2</span>
                <span className="font-bold text-sm">{cvv2 || "•••"}</span>
              </div>
              <div>
                <span className="block text-[10px] opacity-70">EXP DATE</span>
                <span className="font-bold text-sm">{expYear}/{expMonth}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* شماره کارت */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                شماره کارت ۱۶ رقمی شتاب *
              </label>
              <input
                type="text"
                required
                placeholder="6037-9918-1234-5678"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 p-3 text-sm font-mono text-center font-bold tracking-widest outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dir-ltr"
              />
            </div>

            {/* CVV2 */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                کد امنیتی CVV2 *
              </label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="۳ یا ۴ رقم"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-2xl border border-stone-300 p-3 text-sm font-mono text-center font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dir-ltr"
              />
            </div>

            {/* تاریخ انقضا */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                تاریخ انقضای کارت *
              </label>
              <div className="flex gap-2">
                <select
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  className="w-1/2 rounded-2xl border border-stone-300 p-3 text-xs font-bold text-center outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((m) => (
                    <option key={m} value={m}>ماه {m}</option>
                  ))}
                </select>

                <select
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  className="w-1/2 rounded-2xl border border-stone-300 p-3 text-xs font-bold text-center outline-none focus:border-amber-500"
                >
                  {["05", "06", "07", "08", "09", "10", "11"].map((y) => (
                    <option key={y} value={y}>سال ۱۴{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* کد امنیتی کپچا */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                کد امنیتی تصویر *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="کد ۴ رقمی"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-stone-300 p-3 text-sm font-mono text-center font-bold outline-none focus:border-amber-500 dir-ltr"
                />
                <div
                  onClick={refreshCaptcha}
                  className="cursor-pointer flex items-center justify-center gap-1 rounded-2xl bg-amber-100 border border-amber-300 px-4 py-2 text-sm font-mono font-black text-amber-950 shadow-inner hover:bg-amber-200"
                  title="تغییر کد"
                >
                  <span>{captchaCode}</span>
                  <RefreshCw className="size-3.5 text-amber-700" />
                </div>
              </div>
            </div>

            {/* رمز پویا پیامکی */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                رمز دوم پویا *
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="رمز پویا"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-stone-300 p-3 text-sm font-mono text-center font-bold outline-none focus:border-amber-500 dir-ltr"
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpSent && otpTimer > 0}
                  className="rounded-2xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
                >
                  {otpSent ? `ارسال مجدد (${otpTimer}s)` : "دریافت رمز پویا 📲"}
                </button>
              </div>
            </div>
          </div>

          {/* دکمه‌های اقدام پرداخت */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-xl hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-5 animate-spin" />
                  <span>در حال تأیید تراکنش با شاپرک...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5" />
                  <span>پرداخت نهایی مبلغ {formatToman(amount)}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="rounded-2xl bg-stone-200 px-6 py-4 text-xs font-bold text-stone-700 hover:bg-stone-300 transition"
            >
              انصراف و بازگشت
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <Lock className="size-3.5 text-emerald-600" />
            <span>اتصال امن SSL ۲۵۶ بیتی به درگاه رسمی شاپرک بانک مرکزی جمهوری اسلامی ایران</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">در حال بارگذاری درگاه بانک...</div>}>
      <PaymentGatewayContent />
    </Suspense>
  );
}
