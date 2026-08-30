import Link from "next/link";

const categoryLinks = [
  { href: "/category/pesaraneh", label: "پوشاک پسرانه" },
  { href: "/category/dokhtaraneh", label: "پوشاک دخترانه" },
  { href: "/category/nozad", label: "پوشاک نوزاد" },
  { href: "/category/madreseh", label: "لباس مدرسه" },
  { href: "/category/majlesi", label: "لباس مجلسی" },
  { href: "/category/set", label: "ست‌ها" },
];

const serviceLinks = [
  { href: "/returns", label: "شرایط بازگشت کالا" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/terms", label: "قوانین و مقررات" },
  { href: "/about", label: "درباره مینی رویال" },
];

const helpLinks = [
  { href: "/virtual-tryon", label: "پرو آنلاین لباس" },
  { href: "/order/track", label: "پیگیری سفارش" },
  { href: "/faq", label: "سوالات متداول" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* برند */}
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-base">
                👑
              </span>
              <span className="text-lg font-extrabold text-stone-900">مینی رویال</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-stone-500">
              فروشگاه تخصصی پوشاک کودک و نوجوان؛ لباس‌هایی که بچه‌ها دوست دارند و
              والدین به آن اعتماد می‌کنند. قبل از خرید، لباس رو تنِ بچت ببین!
            </p>
          </div>

          {/* دسته‌ها */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-stone-900">دسته‌بندی‌ها</h3>
            <ul className="space-y-2 text-sm text-stone-500">
              {categoryLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-violet-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* خدمات */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-stone-900">خدمات مشتریان</h3>
            <ul className="space-y-2 text-sm text-stone-500">
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-violet-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* کمک */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-stone-900">راهنما و پشتیبانی</h3>
            <ul className="space-y-2 text-sm text-stone-500">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-violet-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              {["اینستاگرام", "تلگرام", "واتساپ"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-violet-300 hover:text-violet-700"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-6 text-xs text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} مینی رویال — همه حقوق محفوظ است.</p>
          <p>
            ارسال سریع به سراسر کشور | بازگشت ۷ روزه | پرداخت در محل | پارچه باکیفیت
          </p>
        </div>
      </div>
    </footer>
  );
}
