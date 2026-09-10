"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { mockCategories } from "../lib/data/mockProducts";
import { kidsCategories } from "../lib/kidsCategories";
import { formatToman, toPersianDigits } from "../lib/utils";
import { useCart } from "../lib/cart";

const initialCategories = [...mockCategories, ...kidsCategories];
type CurrentCustomer = { fullName: string; phone: string };

function useIsMounted() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const { getTotalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showTryonNotice, setShowTryonNotice] = useState(() =>
    typeof window === "undefined" || localStorage.getItem("miniroyal_tryon_notice_closed") !== "1"
  );
  const [customer, setCustomer] = useState<CurrentCustomer | null>(null);
  const [allCategories, setAllCategories] = useState(initialCategories);
  const parentCategories = allCategories.filter((category) => !category.parentId);
  const [searchResults, setSearchResults] = useState<{ products: { id: number; title: string; slug: string; image: string; price: number }[]; categories: { name: string; slug: string }[] }>({ products: [], categories: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) { setSearchResults({ products: [], categories: [] }); return; }
      const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(searchQuery)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Search failed");
      setSearchResults(await response.json());
      setShowSearch(true);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    fetch("/api/catalog/categories", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Categories unavailable")))
      .then((data: { categories?: typeof initialCategories }) => { if (Array.isArray(data.categories) && data.categories.length) setAllCategories(data.categories); })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/customer/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { customer?: CurrentCustomer | null }) => { if (active) setCustomer(data.customer || null); })
      .catch(() => { if (active) setCustomer(null); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const refreshCustomer = () => {
      fetch("/api/customer/me", { cache: "no-store" })
        .then((response) => response.json())
        .then((data: { customer?: CurrentCustomer | null }) => setCustomer(data.customer || null))
        .catch(() => setCustomer(null));
    };
    window.addEventListener("miniroyal:auth-changed", refreshCustomer);
    return () => window.removeEventListener("miniroyal:auth-changed", refreshCustomer);
  }, []);
  const totalItems = isMounted ? getTotalItems() : 0;
  const closeMobile = () => setMenuOpen(false);
  const closeTryonNotice = () => {
    localStorage.setItem("miniroyal_tryon_notice_closed", "1");
    setShowTryonNotice(false);
  };

  // پنهان‌سازی هدر عمومی فروشگاه در پنل مدیریت برای آزاد شدن تمام صفحه برای ادمین
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/ehsanpaneladmin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fffaf3]/95 backdrop-blur-xl">
      {showTryonNotice && (
        <div dir="rtl" className="relative bg-gradient-to-l from-stone-950 via-amber-950 to-stone-950 px-12 py-2.5 text-center text-xs font-bold text-white border-b border-amber-500/30">
          <span>برای استفاده از خدمات پرو آنلاین لباس و ذخیره اتاق پرو، لطفاً وارد حساب خود شوید.</span>
          <Link href="/account?mode=login" className="mr-3 inline-flex rounded-full bg-amber-400 px-3.5 py-1 text-[11px] font-black text-stone-950 hover:bg-amber-300">
            ورود / عضویت
          </Link>
          <button onClick={closeTryonNotice} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white" aria-label="بستن اطلاعیه">
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="bg-stone-950 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-amber-200">
        ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان <span className="mx-2 text-stone-500">•</span> پرو آنلاین هوشمند برای انتخاب سایز کودک
      </div>

      <div className="mx-auto flex site-container items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 lg:gap-8">
        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="rounded-full border border-stone-300 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
          aria-label="باز کردن منو"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="grid size-10 sm:size-11 overflow-hidden rounded-full border border-amber-400 bg-stone-950 shadow-lg transition group-hover:rotate-6">
            <img src="/images/brand/miniroyal-logo.webp" width={48} height={72} alt="لوگوی مینی رویال" className="size-full object-cover" />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-lg sm:text-xl font-black tracking-tight text-stone-950">مینی رویال</span>
            <span className="mt-1 block text-[9px] sm:text-[10px] font-bold tracking-[0.18em] text-amber-700">KIDS COUTURE</span>
          </span>
        </Link>

        <div ref={searchRef} className="relative flex-1 lg:max-w-md">
          <form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) { setShowSearch(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); } }}>
            <Search className="pointer-events-none absolute right-3.5 sm:right-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => searchQuery && setShowSearch(true)}
              placeholder="جست‌وجوی لباس، سایز..."
              className="w-full rounded-full border border-stone-200 bg-white px-9 sm:px-11 py-2 sm:py-2.5 text-xs outline-none transition focus:border-amber-500 focus:ring-3 focus:ring-amber-100"
            />
          </form>
          {showSearch && searchQuery && (
            <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl z-50">
              {searchResults.categories.map((category) => (
                <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setShowSearch(false)} className="block rounded-xl px-3 py-2 text-xs font-bold hover:bg-amber-50">
                  {category.name}
                </Link>
              ))}
              {searchResults.products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setShowSearch(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-50">
                  <img src={product.image} alt={product.title} className="size-10 rounded-lg object-cover" />
                  <span className="truncate text-xs font-bold">{product.title}<small className="mt-1 block text-amber-700 font-black">{formatToman(product.price)}</small></span>
                </Link>
              ))}
              {!searchResults.categories.length && !searchResults.products.length && (
                <p className="p-3 text-center text-xs text-stone-500">نتیجه‌ای پیدا نشد.</p>
              )}
            </div>
          )}
        </div>

        {/* دکمه‌های دسترسی: لاگین همیشه در دسترس در همه اندازه‌ها + پرو آنلاین + سبد خرید */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {customer ? (
            <Link
              href="/account"
              className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 sm:px-3 py-2 text-[11px] font-black text-stone-900 shadow-xs transition hover:bg-stone-100"
              aria-label="ورود به کارتابل کاربر"
            >
              <User className="size-3.5 text-amber-600" />
              <span className="hidden sm:inline max-w-28 truncate">{customer.fullName}</span>
              <span className="sm:hidden text-[11px]">حساب</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/account?mode=login"
                className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-black text-stone-900 shadow-xs transition hover:bg-stone-100 hover:border-amber-400"
                aria-label="ورود به سایت"
              >
                <User className="size-3.5 text-amber-600" />
                <span>ورود</span>
              </Link>
              <Link
                href="/account?mode=register"
                className="hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2 text-[11px] font-black text-stone-950 shadow-xs transition hover:brightness-105 sm:flex"
              >
                عضویت
              </Link>
            </div>
          )}

          <Link
            href="/virtual-tryon"
            className="hidden items-center gap-1.5 rounded-full bg-stone-950 px-3.5 py-2 text-[11px] font-black text-amber-300 shadow-md border border-amber-400/40 transition hover:-translate-y-0.5 hover:bg-stone-900 md:flex"
          >
            <Sparkles className="size-3.5 text-amber-400" />
            <span>پرو آنلاین</span>
          </Link>

          <Link
            href="/cart"
            className="relative grid size-9 sm:size-11 place-items-center rounded-full bg-stone-950 text-white shadow-md transition hover:bg-stone-800"
            aria-label="سبد خرید"
          >
            <ShoppingBag className="size-4 sm:size-5 text-amber-400" />
            <span className="absolute -right-1 -top-1 grid size-4.5 sm:size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-stone-950">
              {toPersianDigits(totalItems)}
            </span>
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-stone-200/70 bg-white/60 lg:block">
        <div className="mx-auto flex site-container items-center gap-1 px-4">
          <Link href="/" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-amber-700">خانه</Link>
          <Link href="/shop" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-amber-700">فروشگاه</Link>
          <div className="relative" onMouseEnter={() => setCategoryOpen(true)} onMouseLeave={() => setCategoryOpen(false)}>
            <button onClick={() => setCategoryOpen((value) => !value)} className="flex items-center gap-1 px-4 py-3 text-xs font-black text-stone-900 hover:text-amber-700">
              همه دسته‌بندی‌ها <ChevronDown className="size-3.5" />
            </button>
            {categoryOpen && (
              <div className="absolute right-0 top-full z-50 grid w-[760px] grid-cols-3 gap-6 rounded-b-3xl border border-stone-200 bg-[#fffaf3] p-6 shadow-2xl">
                {parentCategories.map((parent) => (
                  <div key={parent.slug}>
                    <Link href={`/category/${parent.slug}`} className="flex items-center gap-2 border-b border-stone-200 pb-2 text-sm font-black text-stone-950 hover:text-amber-700">
                      <span>{parent.icon}</span>{parent.name}
                    </Link>
                    <div className="mt-3 space-y-1.5">
                      {allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => (
                        <Link key={category.slug} href={`/category/${category.slug}`} className="block text-[11px] font-semibold text-stone-500 hover:text-amber-700">
                          {category.icon} {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/virtual-tryon" className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-stone-950 shadow-md hover:bg-amber-300">
            <Sparkles className="size-3.5" /> پرو آنلاین و توصیه سایز
          </Link>
          <Link href="/blog" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-amber-700">مجله استایل</Link>
          <Link href="/order/track" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-amber-700">پیگیری سفارش</Link>
          <Link href="/contact" className="mr-auto px-4 py-3 text-xs font-bold text-stone-500 hover:text-amber-700">تماس با ما</Link>
        </div>
      </nav>

      {/* منوی کشویی موبایل با دسترسی مستقیم به لاگین و پرو آنلاین */}
      {menuOpen && (
        <div className="border-t border-stone-200 bg-[#fffaf3] p-4 shadow-xl lg:hidden">
          <div className="grid gap-2.5">
            {/* کارت پرو آنلاین در منوی موبایل */}
            <Link
              href="/virtual-tryon"
              onClick={closeMobile}
              className="rounded-2xl bg-gradient-to-l from-stone-950 via-stone-900 to-stone-950 border border-amber-400/50 p-4 text-center text-white shadow-lg"
            >
              <span className="flex items-center justify-center gap-2 text-amber-300 text-sm font-black">
                <Sparkles className="size-4.5 text-amber-400" /> اتاق پرو آنلاین و انتخاب سایز هوشمند
              </span>
              <span className="mt-1 block text-[11px] text-stone-300 font-medium">
                تن‌خور لباس بر اساس عکس کودک و توصیه دقیق سایز
              </span>
            </Link>

            {/* بخش ورود / پروفایل در منوی موبایل */}
            {customer ? (
              <div className="rounded-2xl bg-amber-50/90 border border-amber-200/80 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-amber-200 text-amber-950 font-black">
                    <User className="size-4.5" />
                  </span>
                  <div>
                    <span className="block font-black text-xs text-stone-900">{customer.fullName}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{customer.phone}</span>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={closeMobile}
                  className="rounded-xl bg-stone-950 px-3.5 py-2 text-xs font-black text-white hover:bg-stone-800 transition"
                >
                  حساب کاربری من ←
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account?mode=login"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white p-3 text-center text-xs font-black text-stone-900 shadow-xs hover:bg-stone-50"
                >
                  <User className="size-4 text-amber-600" />
                  <span>ورود به حساب</span>
                </Link>
                <Link
                  href="/account?mode=register"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 p-3 text-center text-xs font-black text-stone-950 shadow-xs hover:brightness-105"
                >
                  <span>عضویت جدید</span>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/shop"
                onClick={closeMobile}
                className="rounded-xl bg-stone-900 p-3 text-center text-xs font-black text-white hover:bg-stone-800"
              >
                کاتالوگ همه محصولات
              </Link>
              <Link
                href="/order/track"
                onClick={closeMobile}
                className="rounded-xl bg-stone-100 border border-stone-200 p-3 text-center text-xs font-black text-stone-800 hover:bg-stone-200"
              >
                پیگیری وضعیت سفارش
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {parentCategories.map((parent) => (
              <div key={parent.slug}>
                <Link href={`/category/${parent.slug}`} onClick={closeMobile} className="block border-b border-stone-200 pb-2 text-sm font-black text-stone-900">
                  {parent.icon} {parent.name}
                </Link>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                  {allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => (
                    <Link key={category.slug} href={`/category/${category.slug}`} onClick={closeMobile} className="text-[11px] font-semibold text-stone-500 hover:text-amber-700">
                      {category.icon} {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
