"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
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
  ScrollText,
  ShieldCheck,
  Landmark,
  Menu,
  X,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "پیشخوان KPI", icon: LayoutDashboard },
  { href: "/admin/health", label: "تست سلامت سیستم 🩺", icon: Activity },
  { href: "/admin/logs", label: "لاگ و عیب‌یابی", icon: ScrollText },
  { href: "/admin/products", label: "مدیریت محصولات", icon: ShoppingBag },
  { href: "/admin/orders", label: "سفارش‌ها و مرسوله‌ها", icon: PackageCheck },
  { href: "/admin/inventory", label: "مرکز کنترل انبار", icon: Warehouse },
  { href: "/admin/finance", label: "حسابداری و مالی فروش", icon: Landmark },
  { href: "/admin/customers", label: "مشتریان و باشگاه", icon: Users },
  { href: "/admin/roles", label: "نقش‌ها و دسترسی ادمین", icon: ShieldCheck },
  { href: "/admin/coupons", label: "کد تخفیف و کمپین", icon: Tag },
  { href: "/admin/reviews", label: "نظرات و بازخورد سایز", icon: MessageSquare },
  { href: "/admin/categories", label: "دسته‌ها و برندها", icon: FolderTree },
  { href: "/admin/blog", label: "بلاگ و محتوای AI", icon: FileText },
  { href: "/admin/automation", label: "پایپ‌لاین اتوماسیون", icon: Bot },
  { href: "/admin/settings", label: "تنظیمات سایت و دیپلوی", icon: Settings },
  { href: "/admin/slides", label: "مدیریت اسلایدشو صفحه اصلی", icon: Globe },
  { href: "/admin/banners", label: "مدیریت بنرهای سایت", icon: Globe },
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
  const pathname = usePathname();
  const adminBase = `/${pathname.split("/").filter(Boolean)[0] || "admin"}`;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "code">("phone");
  const [loginError, setLoginError] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/admin/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean; admin?: { role?: string } }) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminRole(data.admin?.role || "");
        }
      })
      .catch(() => undefined)
      .finally(() => setIsCheckingSession(false));
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

  if (isCheckingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-900 text-white font-sans dir-rtl">
        <div className="text-center">
          <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="mx-auto size-16 rounded-2xl object-cover" />
          <p className="mt-4 text-xs font-bold text-stone-400">در حال بررسی نشست مدیریت...</p>
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
                <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۳۳۲۸۷۹۸۴" className="mt-1 w-full rounded-2xl border border-stone-700 bg-stone-800 px-4 py-3 text-xs text-white outline-none focus:border-amber-500" required />
              </div>
              {loginError && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center text-xs font-bold text-rose-400">{loginError}</p>}
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-stone-950 shadow-lg transition hover:brightness-110">ارسال کد ورود با پیامک ←</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div><label className="block text-xs font-bold text-stone-300">کد ارسال‌شده به {phone}</label><input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="کد ۶ رقمی" className="mt-1 w-full rounded-2xl border border-stone-700 bg-stone-800 px-4 py-3 text-center text-lg tracking-[.35em] text-white outline-none focus:border-amber-500" required /></div>
              {loginError && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-center text-xs font-bold text-rose-400">{loginError}</p>}
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black text-stone-950 shadow-lg transition hover:brightness-110">تأیید و ورود به پنل ←</button>
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
    <div className="min-h-screen bg-stone-100/70 font-sans text-stone-900 dir-rtl lg:flex">
      {/* هدر مخصوص موبایل با دکمه همبرگری و دکمه‌های اقدام سریع */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3 text-white lg:hidden shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="grid size-10 place-items-center rounded-xl bg-stone-800 border border-stone-700 text-stone-200 transition hover:bg-stone-700 hover:text-white"
            aria-label="باز کردن منوی مدیریت"
          >
            <Menu className="size-5 text-amber-400" />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid size-8 overflow-hidden rounded-lg bg-stone-800 border border-amber-500/30 shadow-xs">
              <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
            </span>
            <div>
              <span className="block font-black text-xs text-white">مدیریت مینی رویال</span>
              <span className="text-[9px] font-bold text-amber-400">{adminRole || "پنل مدیر"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-xl bg-stone-800 px-2.5 py-2 text-[11px] font-bold text-stone-300 hover:bg-stone-700 hover:text-white"
            title="مشاهده فروشگاه اصلی"
          >
            <Globe className="size-3.5" />
            <span className="hidden sm:inline">فروشگاه</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="grid size-9 place-items-center rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 hover:bg-rose-900"
            title="خروج از حساب"
            aria-label="خروج از حساب"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* منوی کشویی موبایل (Mobile Off-canvas Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* پس‌زمینه نیمه‌شفاف برای بستن با کلیک */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-stone-800 bg-stone-900 p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 overflow-hidden rounded-xl bg-stone-800 border border-amber-500/30">
                  <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
                </span>
                <div>
                  <span className="block font-black text-xs text-white">مدیریت مینی رویال</span>
                  <span className="text-[10px] font-bold text-amber-400">{adminRole || "پنل کنترل اصلی"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid size-9 place-items-center rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
                aria-label="بستن منو"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto py-2">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const targetHref = `${adminBase}${item.href.replace(/^\/admin/, "")}`;
                const isActive = pathname === targetHref || (item.href !== "/admin" && pathname.startsWith(targetHref));
                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <Icon className={`size-4 ${isActive ? "text-amber-300" : "text-amber-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-stone-800 pt-3 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-stone-800 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white"
              >
                <Globe className="size-4" />
                <span>مشاهده فروشگاه اصلی</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/40 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900"
              >
                <LogOut className="size-4" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* سایدبار ثابت دسکتاپ */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col border-l border-stone-200 bg-stone-900 text-white p-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 overflow-hidden rounded-2xl bg-stone-800 border border-amber-500/30 text-xl shadow-md">
              <img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" />
            </span>
            <div>
              <span className="block font-black text-sm text-white">مدیریت مینی رویال</span>
              <span className="text-[10px] font-bold text-amber-400">{adminRole || "پنل کنترل اصلی"}</span>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const targetHref = `${adminBase}${item.href.replace(/^\/admin/, "")}`;
            const isActive = pathname === targetHref || (item.href !== "/admin" && pathname.startsWith(targetHref));
            return (
              <Link
                key={item.href}
                href={targetHref}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-amber-300" : "text-amber-400"}`} />
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
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/40 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900"
          >
            <LogOut className="size-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* بخش اصلی محتوای پنل مدیریت */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <main className="flex-1 min-w-0 w-full p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* نوار دسترسی سریع پایین صفحه برای موبایل (Admin Mobile Bottom Nav) */}
      <nav
        aria-label="دسترسی سریع مدیریت در موبایل"
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-stone-800 bg-stone-950/95 px-2 py-2 text-[10px] font-bold text-stone-400 backdrop-blur-xl lg:hidden shadow-2xl"
      >
        <Link
          href={`${adminBase}`}
          className={`flex flex-col items-center gap-1 p-1 transition ${pathname === adminBase ? "text-amber-400 font-black" : "hover:text-white"}`}
        >
          <LayoutDashboard className="size-4.5" />
          <span>پیشخوان</span>
        </Link>
        <Link
          href={`${adminBase}/products`}
          className={`flex flex-col items-center gap-1 p-1 transition ${pathname.includes("/products") ? "text-amber-400 font-black" : "hover:text-white"}`}
        >
          <ShoppingBag className="size-4.5" />
          <span>محصولات</span>
        </Link>
        <Link
          href={`${adminBase}/orders`}
          className={`flex flex-col items-center gap-1 p-1 transition ${pathname.includes("/orders") ? "text-amber-400 font-black" : "hover:text-white"}`}
        >
          <PackageCheck className="size-4.5" />
          <span>سفارش‌ها</span>
        </Link>
        <Link
          href={`${adminBase}/inventory`}
          className={`flex flex-col items-center gap-1 p-1 transition ${pathname.includes("/inventory") ? "text-amber-400 font-black" : "hover:text-white"}`}
        >
          <Warehouse className="size-4.5" />
          <span>انبار</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-amber-400 hover:text-amber-300"
        >
          <Menu className="size-4.5" />
          <span>کل منو</span>
        </button>
      </nav>
    </div>
  );
}
