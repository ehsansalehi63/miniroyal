import Link from "next/link";
import ProductCard from "./ProductCard";
import { SuggestedSet } from "../lib/sets";

export default function SuggestedSets({ sets }: { sets: SuggestedSet[] }) {
  if (!sets.length) return null;
  return (
    <section dir="rtl" className="mx-auto site-container px-4">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-xl font-black text-stone-900 sm:text-2xl">ست‌های پیشنهادی مینی رویال</h2>
        <p className="mt-1 text-xs text-stone-500">پیشنهاد خودکار بر اساس هماهنگی گروه سنی، مخاطب، موجودی و محبوبیت</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {sets.map((set) => (
          <div key={set.id} className="rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-stone-900">{set.title}</h3>
                <p className="mt-1 text-[11px] text-stone-500">{set.reason}</p>
              </div>
              <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[10px] font-black text-fuchsia-800">پیشنهاد هوشمند</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {set.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <Link href={`/shop?set=${set.id}`} className="mt-4 block rounded-xl bg-fuchsia-700 py-2.5 text-center text-xs font-black text-white hover:bg-fuchsia-800">
              مشاهده این ست
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
