"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#faf8f5]/95 backdrop-blur-xl">
      {showTryonNotice && <div dir="rtl" className="relative bg-stone-900 border-b border-amber-500/20 px-12 py-2.5 text-center text-xs font-bold text-stone-200"><span>برای استفاده کامل از خدمات پرو آنلاین و دریافت نتیجه، لطفاً عضو سایت شوید.</span><Link href="/account?mode=register" className="mr-3 inline-flex rounded-full bg-amber-400 px-3.5 py-1 text-[11px] font-black text-stone-950 hover:bg-amber-300">عضویت سریع</Link><button onClick={closeTryonNotice} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="بستن اطلاعیه"><X className="size-4" /></button></div>}
      <div className="bg-stone-950 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-amber-200/90">ارسال سریع سراسری با تیپاکس <span className="mx-2 text-stone-600">•</span> پرو آنلاین هوشمند برای انتخاب سایز کودک</div>
      <div className="mx-auto flex site-container items-center gap-3 px-4 py-3.5 lg:gap-8">
        <button onClick={() => setMenuOpen((value) => !value)} className="rounded-full border border-stone-300 p-2 lg:hidden" aria-label="باز کردن منو">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link href="/" className="group flex shrink-0 items-center gap-3"><span className="grid size-11 overflow-hidden rounded-full border border-amber-400/80 bg-stone-950 shadow-md transition group-hover:rotate-6"><img src="/images/brand/miniroyal-logo.webp" width={48} height={72} alt="لوگوی مینی رویال" className="size-full object-cover" /></span><span className="hidden leading-none sm:block"><span className="block text-xl font-black tracking-tight text-stone-950">مینی رویال</span><span className="mt-1 block text-[10px] font-black tracking-[0.2em] text-amber-800">ROYAL ATELIER</span></span></Link>
        <div ref={searchRef} className="relative flex-1 lg:max-w-md">
          <form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) { setShowSearch(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); } }}>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onFocus={() => searchQuery && setShowSearch(true)} placeholder="جست‌وجوی لباس، مدل، سایز..." className="w-full rounded-full border border-stone-200 bg-white px-11 py-2.5 text-xs outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-100/60" />
          </form>
          {showSearch && searchQuery && <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">{searchResults.categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setShowSearch(false)} className="block rounded-xl px-3 py-2 text-xs font-bold hover:bg-stone-50">{category.name}</Link>)}{searchResults.products.map((product) => <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setShowSearch(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-50"><img src={product.image} alt={product.title} className="size-10 rounded-lg object-cover" /><span className="truncate text-xs font-bold">{product.title}<small className="mt-1 block text-stone-950 font-black">{formatToman(product.price)}</small></span></Link>)}{!searchResults.categories.length && !searchResults.products.length && <p className="p-3 text-center text-xs text-stone-500">نتیجه‌ای پیدا نشد.</p>}</div>}
        </div>
        <div className="flex items-center gap-2">{customer ? <Link href="/account" className="hidden items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-2 text-[11px] font-black text-stone-800 transition hover:bg-stone-100 sm:flex" aria-label="ورود به کارتابل کاربر"><User className="size-3.5" /><span className="max-w-28 truncate">سلام {customer.fullName}</span></Link> : <><Link href="/account?mode=login" className="hidden items-center gap-1 rounded-full border border-stone-300 px-3 py-2 text-[11px] font-black text-stone-800 transition hover:bg-stone-100 sm:flex"><User className="size-3.5" /> ورود</Link><Link href="/account?mode=register" className="hidden rounded-full bg-stone-950 px-3.5 py-2 text-[11px] font-black text-white transition hover:bg-stone-800 sm:flex">عضویت</Link></>}<Link href="/virtual-tryon" className="hidden items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-l from-stone-950 via-stone-900 to-stone-950 px-4 py-2 text-[11px] font-black text-amber-200 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg md:flex"><Sparkles className="size-4 text-amber-400" /> پرو هوشمند سایز</Link><Link href="/cart" className="relative grid size-10 place-items-center rounded-full bg-stone-950 text-white shadow-md transition hover:bg-stone-800" aria-label="سبد خرید"><ShoppingBag className="size-4.5" /><span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-stone-950">{toPersianDigits(totalItems)}</span></Link></div>
      </div>
      <nav className="hidden border-t border-stone-200/70 bg-white/70 lg:block"><div className="mx-auto flex site-container items-center gap-1 px-4"><Link href="/" className="px-4 py-2.5 text-xs font-black text-stone-900 hover:text-amber-800">خانه</Link><Link href="/shop" className="px-4 py-2.5 text-xs font-black text-stone-900 hover:text-amber-800">فروشگاه</Link><div className="relative" onMouseEnter={() => setCategoryOpen(true)} onMouseLeave={() => setCategoryOpen(false)}><button onClick={() => setCategoryOpen((value) => !value)} className="flex items-center gap-1 px-4 py-2.5 text-xs font-black text-stone-900 hover:text-amber-800">همه دسته‌بندی‌ها <ChevronDown className="size-3.5" /></button>{categoryOpen && <div className="absolute right-0 top-full z-50 grid w-[760px] grid-cols-3 gap-6 rounded-b-2xl border border-stone-200 bg-[#faf8f5] p-6 shadow-2xl">{parentCategories.map((parent) => <div key={parent.slug}><Link href={`/category/${parent.slug}`} className="flex items-center gap-2 border-b border-stone-200 pb-2 text-sm font-black text-stone-950 hover:text-amber-800"><span>{parent.icon}</span>{parent.name}</Link><div className="mt-3 space-y-1.5">{allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="block text-[11px] font-semibold text-stone-600 hover:text-amber-800">{category.icon} {category.name}</Link>)}</div></div>)}</div>}</div><Link href="/virtual-tryon" className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-100/60 px-3.5 py-1.5 text-xs font-black text-amber-950 shadow-sm hover:bg-amber-100"><Sparkles className="size-3.5 text-amber-700" /> پرو آنلاین سایز</Link><Link href="/blog" className="px-4 py-2.5 text-xs font-black text-stone-900 hover:text-amber-800">مجله استایل</Link><Link href="/contact" className="mr-auto px-4 py-2.5 text-xs font-bold text-stone-500 hover:text-amber-800">تماس با ما</Link></div></nav>
      {menuOpen && <div className="border-t border-stone-200 bg-[#faf8f5] p-4 shadow-xl lg:hidden"><div className="grid gap-2 sm:grid-cols-2"><Link href="/virtual-tryon" onClick={closeMobile} className="col-span-full rounded-xl bg-stone-950 p-4 text-center text-sm font-black text-amber-200 shadow-md border border-amber-500/30"><span className="flex items-center justify-center gap-2"><Sparkles className="size-4 text-amber-400" /> پرو آنلاین سایز</span><span className="mt-1 block text-[10px] font-semibold text-stone-300">انتخاب سایز دقیق کودک در چند مرحله</span></Link><Link href="/shop" onClick={closeMobile} className="rounded-xl bg-stone-900 p-3 text-center text-xs font-black text-white">همه محصولات</Link><Link href="/account?mode=register" onClick={closeMobile} className="rounded-xl bg-amber-400 p-3 text-center text-xs font-black text-stone-950">عضویت رایگان</Link></div><div className="mt-5 grid gap-4">{parentCategories.map((parent) => <div key={parent.slug}><Link href={`/category/${parent.slug}`} onClick={closeMobile} className="block border-b border-stone-200 pb-2 text-sm font-black">{parent.icon} {parent.name}</Link><div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">{allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={closeMobile} className="text-[11px] font-semibold text-stone-500">{category.icon} {category.name}</Link>)}</div></div>)}</div></div>}
    </header>
  );
}
