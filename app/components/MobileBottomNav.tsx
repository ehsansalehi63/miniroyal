"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Home, ShoppingBag, Sparkles, Store, User } from "lucide-react";
import { useCart } from "../lib/cart";
import { toPersianDigits } from "../lib/utils";

type CurrentCustomer = { fullName: string; phone: string };

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const { getTotalItems } = useCart();
  const [customer, setCustomer] = useState<CurrentCustomer | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { customer?: CurrentCustomer | null }) => {
        if (active) setCustomer(data.customer || null);
      })
      .catch(() => {
        if (active) setCustomer(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const refresh = () => {
      fetch("/api/customer/me", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { customer?: CurrentCustomer | null }) => {
          setCustomer(data.customer || null);
        })
        .catch(() => setCustomer(null));
    };
    window.addEventListener("miniroyal:auth-changed", refresh);
    return () => window.removeEventListener("miniroyal:auth-changed", refresh);
  }, []);

  // در پنل ادمین و صفحه پروپوزال دلتادشت پنهان می‌شود
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/ehsanpaneladmin") || pathname?.startsWith("/deltadasht-proposal")) {
    return null;
  }

  const totalItems = isMounted ? getTotalItems() : 0;
  const isHome = pathname === "/";
  const isShop = pathname?.startsWith("/shop") || pathname?.startsWith("/category");
  const isTryon = pathname === "/virtual-tryon";
  const isCart = pathname === "/cart";
  const isAccount = pathname?.startsWith("/account");

  return (
    <nav
      dir="rtl"
      aria-label="منوی دسترسی سریع موبایل"
      className="fixed inset-x-0 bottom-0 z-40 block lg:hidden border-t border-stone-200/90 bg-[#fffaf3]/95 backdrop-blur-xl pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 items-center justify-around px-1 py-1.5 text-center">
        {/* ۱. صفحه اصلی */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 transition ${
            isHome ? "text-amber-700 font-black" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Home className={`size-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[10px] leading-none font-bold">خانه</span>
        </Link>

        {/* ۲. فروشگاه */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 transition ${
            isShop ? "text-amber-700 font-black" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Store className={`size-5 ${isShop ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[10px] leading-none font-bold">فروشگاه</span>
        </Link>

        {/* ۳. پرو آنلاین هوشمند (دکمه مرکزی برجسته) */}
        <Link
          href="/virtual-tryon"
          className="relative -top-3 flex flex-col items-center justify-center"
        >
          <span
            className={`grid size-12 place-items-center rounded-full shadow-xl transition-all active:scale-95 ${
              isTryon
                ? "bg-amber-400 text-stone-950 ring-4 ring-amber-400/30 shadow-amber-500/30"
                : "bg-gradient-to-tr from-stone-950 via-stone-900 to-amber-950 text-amber-300 border border-amber-400/60 shadow-stone-950/40"
            }`}
          >
            <Sparkles className="size-5.5 animate-pulse text-amber-400" />
          </span>
          <span
            className={`mt-0.5 text-[10px] font-black leading-none ${
              isTryon ? "text-amber-700" : "text-stone-900"
            }`}
          >
            پرو آنلاین
          </span>
        </Link>

        {/* ۴. سبد خرید با تعداد */}
        <Link
          href="/cart"
          className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 transition ${
            isCart ? "text-amber-700 font-black" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`size-5 ${isCart ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 grid size-4.5 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-stone-950 shadow-xs">
                {toPersianDigits(totalItems)}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none font-bold">سبد خرید</span>
        </Link>

        {/* ۵. ورود / حساب کاربری (همیشه در دسترس روی همه صفحات) */}
        <Link
          href={customer ? "/account" : "/account?mode=login"}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 transition ${
            isAccount ? "text-amber-700 font-black" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className="relative">
            <User className={`size-5 ${isAccount ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            {customer && (
              <span className="absolute -top-0.5 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-[#fffaf3]" />
            )}
          </div>
          <span className="text-[10px] leading-none font-bold">
            {customer ? "حساب من" : "ورود"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
