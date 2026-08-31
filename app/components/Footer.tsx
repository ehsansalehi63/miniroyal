import Link from "next/link";
import { mockCategories } from "../lib/data/mockProducts";
import { kidsCategories } from "../lib/kidsCategories";

const categories = [...mockCategories, ...kidsCategories];
const services = [
  ["/returns", "شرایط بازگشت کالا"],
  ["/privacy", "حریم خصوصی"],
  ["/terms", "قوانین و مقررات"],
  ["/about", "درباره مینی رویال"],
  ["/order/track", "پیگیری سفارش"],
  ["/faq", "سؤالات متداول"],
  ["/contact", "تماس با ما"],
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-[#17131d] text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-amber-400 bg-stone-950 text-xl text-amber-300">♛</span><span className="text-xl font-black text-white">مینی رویال</span></div>
            <p className="mt-5 max-w-sm text-sm leading-8 text-stone-400">بوتیک آنلاین پوشاک کودک و نوجوان؛ انتخابی باکیفیت، خوش‌دوخت و متفاوت برای استایل روزمره و لحظه‌های خاص.</p>
            <Link href="/virtual-tryon" className="mt-6 inline-flex rounded-full bg-amber-400 px-5 py-3 text-xs font-black text-stone-950 transition hover:bg-amber-300">پرو آنلاین لباس</Link>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-black text-amber-300">همه دسته‌بندی‌ها</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">{categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="text-xs font-semibold text-stone-400 transition hover:text-white">{category.icon} {category.name}</Link>)}</div>
          </div>
          <div>
            <h3 className="mb-5 text-sm font-black text-amber-300">خدمات مشتریان</h3>
            <div className="grid gap-3">{services.map(([href, label]) => <Link key={href} href={href} className="text-xs font-semibold text-stone-400 transition hover:text-white">{label}</Link>)}</div>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500 sm:flex-row"><span>© {new Date().getFullYear()} مینی رویال — همه حقوق محفوظ است.</span><span>ارسال سریع سراسر کشور • بازگشت ۷ روزه • پرداخت امن</span></div>
      </div>
    </footer>
  );
}
