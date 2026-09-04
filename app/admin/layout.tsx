"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Warehouse,
  Users,
  Tag,
  MessageSquare,
  FolderTree,
  FileText,
  Bot,
  Settings,
  Globe,
  LogOut,
  Activity,
  ShieldCheck,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "پیشخوان KPI", icon: LayoutDashboard },
  { href: "/admin/health", label: "تست سلامت سیستم 🩺", icon: Activity },
  { href: "/admin/products", label: "مدیریت محصولات", icon: ShoppingBag },
  { href: "/admin/orders", label: "سفارش‌ها و مرسوله‌ها", icon: PackageCheck },
  { href: "/admin/inventory", label: "مرکز کنترل انبار", icon: Warehouse },
  { href: "/admin/customers", label: "مشتریان و باشگاه", icon: Users },
  { href: "/admin/roles", label: "نقش‌ها و دسترسی ادمین", icon: ShieldCheck },
  { href: "/admin/coupons", label: "کد تخفیف و کمپین", icon: Tag },
  { href: "/admin/reviews", label: "نظرات و بازخورد سایز", icon: MessageSquare },
  { href: "/admin/categories", label: "دسته‌ها و برندها", icon: FolderTree },
  { href: "/admin/blog", label: "بلاگ و محتوای AI", icon: FileText },
  { href: "/admin/automation", label: "پایپ‌لاین اتوماسیون", icon: Bot },
  { href: "/admin/settings", label: "تنظیمات سایت و دیپلوی", icon: Settings },
  { href: "/admin/slides", label: "مدیریت اسلایدشو صفحه اصلی", icon: Globe },
];

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMounted = useIsMounted();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "code">("phone");
  const [loginError, setLoginError] = useState("");
  const [adminRole, setAdminRole] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean; admin?: { role?: string } }) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminRole(data.admin?.role || "");
        }
      })
      .catch(() => undefined);
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const data = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      setLoginError(data.error || "ارسال کد ورود انجام نشد.");
      return;
    }
    setLoginStep("code");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
    const data = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      setLoginError(data.error || "کد ورود نادرست است.");
      return;
    }
    setIsAuthenticated(true);
    setAdminRole("super_admin");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setLoginStep("phone");
    setCode("");
  };

  if (!isMounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-900 text-white font-sans dir-rtl">
        <div className="text-center">
          <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="mx-auto size-16 rounded-2xl object-cover" />
          <p className="mt-4 text-xs font-bold text-stone-400">در حال بارگذاری پنل مدیریت مینی رویال...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-950 p-4 font-sans text-stone-900 dir-rtl">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 p-8 shadow-2xl">
          <div className="text-center">
            <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="mx-auto size-16 rounded-2xl object-cover shadow-lg" />
            <h1 className="mt-4 text-2xl font-black text-white">ورود مدیر سیستم</h1>
            <p className="mt-1 text-xs text-stone-400">
              جهت مدیریت کامل فروشگاه، محصولات، سفارشات و تنظیمات وارد شوید.
            </p>
          </div>

          {loginStep === "phone" ? (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300">شماره موبایل مدیر مجاز</label>
                <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۳۳۲۸۷۹۸۴" className="mt-1 w-full rounded-2xl border border-stone-700 bg-stone-800 px-4 py-3 text-xs text-white outline-none focus:border-violet-500" required />
              </div>
              {loginError && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center text-xs font-bold text-rose-400">{loginError}</p>}
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-xs font-black text-white shadow-lg transition hover:brightness-110">ارسال کد ورود با پیامک ←</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div><label className="block text-xs font-bold text-stone-300">کد ارسال‌شده به {phone}</label><input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="کد ۶ رقمی" className="mt-1 w-full rounded-2xl border border-stone-700 bg-stone-800 px-4 py-3 text-center text-lg tracking-[.35em] text-white outline-none focus:border-violet-500" required /></div>
              {loginError && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center text-xs font-bold text-rose-400">{loginError}</p>}
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-xs font-black text-white shadow-lg transition hover:brightness-110">تأیید و ورود به پنل ←</button>
              <button type="button" onClick={() => { setLoginStep("phone"); setCode(""); setLoginError(""); }} className="w-full text-xs font-bold text-stone-400 hover:text-white">تغییر شماره</button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs font-bold text-stone-400 hover:text-white">
              ← بازگشت به فروشگاه مینی رویال
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100/70 font-sans text-stone-900 dir-rtl">
      {/* سایدبار مدیریت */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 border-l border-stone-200 bg-stone-900 text-white flex flex-col p-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl shadow-md">
              <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
            </span>
              <div>
                <span className="block font-black text-sm text-white">مدیریت مینی رویال</span>
                <span className="text-[10px] font-bold text-violet-400">{adminRole || "پنل کنترل اصلی"}</span>
              </div>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-300 transition hover:bg-stone-800 hover:text-white"
              >
                <Icon className="size-4 text-violet-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-800 pt-4 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-800 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white"
          >
            <Globe className="size-4" />
            <span>مشاهده فروشگاه اصلی</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/40 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900"
          >
            <LogOut className="size-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* محتوای صفحات ادمین */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
