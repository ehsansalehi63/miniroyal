"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Search, ShoppingBag, User, Menu, X, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { searchAutocomplete } from "../lib/catalog";
import { formatToman, toPersianDigits } from "../lib/utils";
import { useCart } from "../lib/cart";

const navItems = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "همه محصولات" },
  { href: "/category/pesaraneh", label: "پسرانه" },
  { href: "/category/dokhtaraneh", label: "دخترانه" },
  { href: "/category/nozad", label: "نوزاد" },
  { href: "/category/set", label: "ست‌ها" },
  { href: "/category/madreseh", label: "لباس مدرسه" },
  { href: "/category/majlesi", label: "مجلسی" },
  { href: "/blog", label: "مجله کودک" },
];

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Header() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { getTotalItems } = useCart();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    products: { id: number; title: string; slug: string; image: string; price: number }[];
    categories: { name: string; slug: string }[];
  }>({ products: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const totalCartItems = isMounted ? getTotalItems() : 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("miniroyal_admin_token");
      setIsLoggedIn(token === "authenticated_admin");
    }
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        const res = await searchAutocomplete(searchQuery);
        setSearchResults(res);
        setIsSearching(false);
        setShowDropdown(true);
      } else {
        setSearchResults({ products: [], categories: [] });
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("miniroyal_admin_token");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      {/* نوار اطلاع‌رسانی بالایی */}
      <div className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-700 py-1.5 text-center text-xs font-semibold text-white px-4 flex justify-center items-center gap-4">
        <span>👑 ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان | 👗 پرو آنلاین لباس با تضمین سایز</span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        {/* همبرگر برای موبایل */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-xl border border-stone-200 p-2 text-stone-700 lg:hidden"
          aria-label="منو"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* لوگو برند */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl shadow-md transition hover:scale-105">
            👑
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-xl font-black tracking-tight text-stone-900">
              مینی رویال
            </span>
            <span className="text-[11px] font-semibold text-violet-600">
              فروشگاه پوشاک کودک و نوجوان
            </span>
          </span>
        </Link>

        {/* جستجوی زنده با آکاردئون پیشنهادات */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setShowDropdown(false);
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="relative"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 1) setShowDropdown(true);
              }}
              placeholder="جستجو در لباس کودک، سایز، دخترانه، پسرانه..."
              className="w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              aria-label="جستجو"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          </form>

          {/* منوی دراپ‌داون نتایج جستجوی زنده */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-stone-100 bg-white p-2 shadow-2xl">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  در حال جستجو...
                </div>
              ) : (
                <>
                  {/* دسته‌بندی‌های پیشنهادی */}
                  {searchResults.categories.length > 0 && (
                    <div className="mb-2 p-2 border-b border-stone-100">
                      <span className="text-[11px] font-bold text-stone-400">
                        دسته‌بندی‌های مرتبط
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {searchResults.categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/category/${c.slug}`}
                            onClick={() => setShowDropdown(false)}
                            className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* محصولات پیدا شده */}
                  {searchResults.products.length > 0 ? (
                    <div>
                      <span className="p-2 text-[11px] font-bold text-stone-400">
                        محصولات پیشنهادی
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-stone-50"
                          >
                            <img
                              src={p.image}
                              alt={p.title}
                              className="size-10 rounded-lg object-cover"
                            />
                            <div className="flex-1 overflow-hidden">
                              <h4 className="truncate text-xs font-bold text-stone-800">
                                {p.title}
                              </h4>
                              <span className="text-[11px] font-extrabold text-violet-700">
                                {formatToman(p.price)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    searchResults.categories.length === 0 && (
                      <div className="p-4 text-center text-xs text-stone-500">
                        نتیجه‌ای برای «{searchQuery}» پیدا نشد.
                      </div>
                    )
                  )}

                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setShowDropdown(false)}
                    className="mt-2 block rounded-xl bg-stone-100 p-2 text-center text-xs font-bold text-stone-700 hover:bg-violet-50 hover:text-violet-700"
                  >
                    مشاهده همه نتایج برای «{searchQuery}» ←
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* دکمه‌های سمت چپ (پرو آنلاین، ورود / حساب کاربری، سبد خرید) */}
        <div className="flex items-center gap-2">
          <Link
            href="/virtual-tryon"
            className="hidden items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100 sm:flex"
          >
            <Sparkles className="size-4" />
            <span>پرو آنلاین</span>
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-100"
                title="مدیریت حساب کاربری"
              >
                <User className="size-4 text-violet-600" />
                <span>حساب کاربری 👤</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-rose-600"
                title="خروج از حساب"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-2 text-stone-700 transition hover:border-violet-300 hover:bg-stone-50"
              title="ورود به حساب کاربری"
            >
              <User className="size-4 text-stone-600" />
              <span className="hidden text-xs font-semibold md:inline">ورود / ثبت‌نام</span>
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 transition hover:bg-violet-800"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">سبد خرید</span>
            <span className="grid size-5 place-items-center rounded-full bg-amber-400 text-[11px] font-black text-stone-950">
              {toPersianDigits(totalCartItems)}
            </span>
          </Link>
        </div>
      </div>

      {/* منوی دسته‌بندی دسکتاپ */}
      <nav className="hidden border-t border-stone-100 bg-stone-50/60 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-violet-100 hover:text-violet-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* منوی کشویی موبایل */}
      {isMobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white p-4 shadow-lg lg:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-bold text-stone-800 transition hover:bg-violet-50 hover:text-violet-700"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/virtual-tryon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-violet-700 py-3 text-sm font-bold text-white shadow-md"
            >
              <Sparkles className="size-4" />
              👗 پرو آنلاین لباس
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
