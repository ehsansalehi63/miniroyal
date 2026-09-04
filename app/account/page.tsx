"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toPersianDigits } from "../lib/utils";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role?: string;
  clubPoints?: number;
  clubTier?: string;
};

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mode, setMode] = useState<"login" | "register">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register"
      : "login"
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/customer/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setCustomer(data.customer || null))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register" && !phoneVerified) throw new Error("ابتدا شماره موبایل را تایید کنید.");
      const response = await fetch(`/api/customer/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "عملیات انجام نشد.");
      setCustomer(data.customer);
      window.dispatchEvent(new Event("miniroyal:auth-changed"));
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "عملیات انجام نشد.");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestOtp() {
    setError("");
    if (resendSeconds > 0) return;
    const response = await fetch("/api/customer/request-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "ارسال کد انجام نشد.");
    setOtpSent(true);
    setResendSeconds(30);
  }

  async function verifyOtp() {
    setError("");
    const response = await fetch("/api/customer/verify-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "کد تایید نادرست است.");
    setPhoneVerified(true);
  }

  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" });
    setCustomer(null);
    window.dispatchEvent(new Event("miniroyal:auth-changed"));
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-center" dir="rtl">در حال بررسی حساب شما...</main>;
  }

  if (customer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16" dir="rtl">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black tracking-[0.2em] text-violet-700">MINIROYAL MEMBER</p>
          <h1 className="mt-3 text-3xl font-black text-stone-950">سلام {customer.fullName}</h1>
          <p className="mt-2 text-sm text-stone-500">حساب دائمی شما فعال است و سفارش‌ها به این حساب متصل می‌شوند.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4"><span className="block text-xs text-stone-500">موبایل</span><strong className="mt-1 block">{customer.phone}</strong></div>
            <div className="rounded-2xl bg-stone-50 p-4"><span className="block text-xs text-stone-500">امتیاز باشگاه</span><strong className="mt-1 block">{customer.clubPoints ?? 0}</strong></div>
            <div className="rounded-2xl bg-stone-50 p-4"><span className="block text-xs text-stone-500">سطح عضویت</span><strong className="mt-1 block">{customer.clubTier || "bronze"}</strong></div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-violet-700 px-5 py-3 text-sm font-black text-white hover:bg-violet-800">ادامه خرید</Link>
            <button onClick={logout} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-black text-stone-700 hover:border-violet-400">خروج از حساب</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16" dir="rtl">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-black tracking-[0.2em] text-violet-700">MINIROYAL ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-black text-stone-950">{mode === "login" ? "ورود به حساب" : "ساخت حساب مشتری"}</h1>
        <p className="mt-2 text-sm text-stone-500">حساب شما برای پیگیری سفارش‌ها و پرداخت‌های آینده دائمی می‌ماند.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="نام و نام خانوادگی" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-violet-500" />}
          <div className="flex gap-2">
            <input required value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneVerified(false); }} placeholder="شماره موبایل" inputMode="tel" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-violet-500" />
            {mode === "register" && <button type="button" disabled={resendSeconds > 0} onClick={() => void requestOtp().catch((e) => setError(e.message))} className="rounded-xl bg-amber-400 px-3 text-xs font-black text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">{resendSeconds > 0 ? `ارسال مجدد ${toPersianDigits(resendSeconds)} ثانیه` : otpSent ? "ارسال مجدد کد" : "ارسال کد تایید"}</button>}
          </div>
          {mode === "register" && otpSent && <div className="flex gap-2"><input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="کد ۶ رقمی" inputMode="numeric" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-violet-500" /><button type="button" onClick={() => void verifyOtp().catch((e) => setError(e.message))} className="rounded-xl bg-emerald-600 px-4 text-xs font-black text-white">{phoneVerified ? "تایید شد" : "تایید شماره"}</button></div>}
          {mode === "register" && <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ایمیل (اختیاری)" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-violet-500" />}
          <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="رمز عبور (حداقل ۸ کاراکتر)" className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-violet-500" />
          {error && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
          <button disabled={submitting} className="w-full rounded-full bg-violet-700 px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">{submitting ? "در حال پردازش..." : mode === "login" ? "ورود امن" : "ایجاد حساب"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-5 w-full text-center text-xs font-bold text-violet-700">
          {mode === "login" ? "حساب ندارید؟ ثبت‌نام کنید" : "قبلاً ثبت‌نام کرده‌اید؟ وارد شوید"}
        </button>
      </div>
    </main>
  );
}
