"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { searchAutocomplete } from "../lib/catalog";
import { mockCategories } from "../lib/data/mockProducts";
import { kidsCategories } from "../lib/kidsCategories";
import { formatToman, toPersianDigits } from "../lib/utils";
import { useCart } from "../lib/cart";

const allCategories = [...mockCategories, ...kidsCategories];
const parentCategories = mockCategories;

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
  const [searchResults, setSearchResults] = useState<{ products: { id: number; title: string; slug: string; image: string; price: number }[]; categories: { name: string; slug: string }[] }>({ products: [], categories: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) { setSearchResults({ products: [], categories: [] }); return; }
      setSearchResults(await searchAutocomplete(searchQuery));
      setShowSearch(true);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearch(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const totalItems = isMounted ? getTotalItems() : 0;
  const closeMobile = () => setMenuOpen(false);
  const closeTryonNotice = () => {
    localStorage.setItem("miniroyal_tryon_notice_closed", "1");
    setShowTryonNotice(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fffaf3]/95 backdrop-blur-xl">
      {showTryonNotice && <div dir="rtl" className="relative bg-gradient-to-l from-violet-800 via-fuchsia-700 to-violet-900 px-12 py-3 text-center text-xs font-bold text-white"><span>برای استفاده از خدمات پرو آنلاین لباس، لطفاً عضو سایت شوید و وارد حساب خود شوید.</span><Link href="/account?mode=register" className="mr-3 inline-flex rounded-full bg-amber-300 px-4 py-1.5 text-[11px] font-black text-stone-950 hover:bg-amber-200">عضویت رایگان</Link><button onClick={closeTryonNotice} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white" aria-label="بستن اطلاعیه"><X className="size-4" /></button></div>}
      <div className="bg-stone-950 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-amber-200">ارسال رایگان خریدهای بالای ۵۰۰ هزار تومان <span className="mx-2 text-stone-500">•</span> پرو آنلاین هوشمند برای انتخاب سایز</div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 lg:gap-8">
        <button onClick={() => setMenuOpen((value) => !value)} className="rounded-full border border-stone-300 p-2 lg:hidden" aria-label="باز کردن منو">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link href="/" className="group flex shrink-0 items-center gap-3"><span className="grid size-11 overflow-hidden rounded-full border border-amber-400 bg-stone-950 shadow-lg transition group-hover:rotate-6"><img src="/images/brand/miniroyal-logo.png" alt="لوگوی مینی رویال" className="size-full object-cover" /></span><span className="hidden leading-none sm:block"><span className="block text-xl font-black tracking-tight text-stone-950">مینی رویال</span><span className="mt-1 block text-[10px] font-bold tracking-[0.18em] text-violet-700">KIDS COUTURE</span></span></Link>
        <div ref={searchRef} className="relative flex-1 lg:max-w-md">
          <form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) { setShowSearch(false); router.push(`/search?q=${encodeURIComponent(searchQuery)}`); } }}>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onFocus={() => searchQuery && setShowSearch(true)} placeholder="جست‌وجوی لباس، سایز یا دسته‌بندی..." className="w-full rounded-full border border-stone-200 bg-white px-11 py-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
          </form>
          {showSearch && searchQuery && <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">{searchResults.categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setShowSearch(false)} className="block rounded-xl px-3 py-2 text-xs font-bold hover:bg-violet-50">{category.name}</Link>)}{searchResults.products.map((product) => <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setShowSearch(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-50"><img src={product.image} alt={product.title} className="size-10 rounded-lg object-cover" /><span className="truncate text-xs font-bold">{product.title}<small className="mt-1 block text-violet-700">{formatToman(product.price)}</small></span></Link>)}{!searchResults.categories.length && !searchResults.products.length && <p className="p-3 text-center text-xs text-stone-500">نتیجه‌ای پیدا نشد.</p>}</div>}
        </div>
        <div className="flex items-center gap-1.5"><Link href="/account?mode=login" className="hidden items-center gap-1 rounded-full border border-violet-300 px-3 py-2.5 text-[11px] font-black text-violet-800 transition hover:bg-violet-50 sm:flex"><User className="size-3.5" /> ورود</Link><Link href="/account?mode=register" className="hidden rounded-full bg-amber-300 px-3 py-2.5 text-[11px] font-black text-stone-950 transition hover:bg-amber-200 sm:flex">عضویت</Link><Link href="/virtual-tryon" className="hidden items-center gap-2 rounded-full bg-violet-100 px-3 py-2.5 text-[11px] font-black text-violet-800 transition hover:bg-violet-200 md:flex"><Sparkles className="size-4" /> پرو آنلاین</Link><Link href="/cart" className="relative grid size-11 place-items-center rounded-full bg-violet-700 text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800" aria-label="سبد خرید"><ShoppingBag className="size-5" /><span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-stone-950">{toPersianDigits(totalItems)}</span></Link></div>
      </div>
      <nav className="hidden border-t border-stone-200/70 bg-white/60 lg:block"><div className="mx-auto flex max-w-7xl items-center gap-1 px-4"><Link href="/" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-violet-700">خانه</Link><Link href="/shop" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-violet-700">فروشگاه</Link><div className="relative" onMouseEnter={() => setCategoryOpen(true)} onMouseLeave={() => setCategoryOpen(false)}><button onClick={() => setCategoryOpen((value) => !value)} className="flex items-center gap-1 px-4 py-3 text-xs font-black text-stone-900 hover:text-violet-700">همه دسته‌بندی‌ها <ChevronDown className="size-3.5" /></button>{categoryOpen && <div className="absolute right-0 top-full z-50 grid w-[760px] grid-cols-3 gap-6 rounded-b-3xl border border-stone-200 bg-[#fffaf3] p-6 shadow-2xl">{parentCategories.map((parent) => <div key={parent.slug}><Link href={`/category/${parent.slug}`} className="flex items-center gap-2 border-b border-stone-200 pb-2 text-sm font-black text-stone-950 hover:text-violet-700"><span>{parent.icon}</span>{parent.name}</Link><div className="mt-3 space-y-1.5">{allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="block text-[11px] font-semibold text-stone-500 hover:text-violet-700">{category.icon} {category.name}</Link>)}</div></div>)}</div>}</div><Link href="/virtual-tryon" className="px-4 py-3 text-xs font-black text-violet-700 hover:text-violet-900">پرو آنلاین</Link><Link href="/blog" className="px-4 py-3 text-xs font-black text-stone-900 hover:text-violet-700">مجله استایل</Link><Link href="/contact" className="mr-auto px-4 py-3 text-xs font-bold text-stone-500 hover:text-violet-700">تماس با ما</Link></div></nav>
      {menuOpen && <div className="border-t border-stone-200 bg-[#fffaf3] p-4 shadow-xl lg:hidden"><div className="grid grid-cols-2 gap-2"><Link href="/shop" onClick={closeMobile} className="rounded-xl bg-stone-950 p-3 text-center text-xs font-black text-white">همه محصولات</Link><Link href="/virtual-tryon" onClick={closeMobile} className="rounded-xl bg-violet-100 p-3 text-center text-xs font-black text-violet-800">پرو آنلاین</Link></div><div className="mt-5 grid gap-4">{parentCategories.map((parent) => <div key={parent.slug}><Link href={`/category/${parent.slug}`} onClick={closeMobile} className="block border-b border-stone-200 pb-2 text-sm font-black">{parent.icon} {parent.name}</Link><div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">{allCategories.filter((category) => category.parentSlug === parent.slug).map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={closeMobile} className="text-[11px] font-semibold text-stone-500">{category.icon} {category.name}</Link>)}</div></div>)}</div></div>}
    </header>
  );
}
