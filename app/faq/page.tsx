export const metadata = {
  title: "سوالات متداول | مینی رویال",
};

export default function FAQPage() {
  const faqs = [
    { q: "چگونه سایز دقیق فرزندم را پیدا کنم؟", a: "با استفاده از جدول سایز سانتی‌متری در صفحه هر محصول یا بخش پرو آنلاین هوشمند، قد و وزن کودک را وارد کنید." },
    { q: "چقدر طول می‌کشد تا سفارش ارسال شود؟", a: "سفارشات تهران همان روز یا روز بعد با پیک ارسال می‌شود. شهرستان‌ها بین ۲ تا ۴ روز کاری با پست پیشتاز/تیپاکس به دست شما می‌رسد." },
    { q: "آیا پرداخت در محل دارید؟", a: "بله، برای کلیه شهرهای ایران امکان پرداخت در محل (COD) فراهم است." },
    { q: "اگر سایز لباس نخورد چه کنم؟", a: "تا ۷ روز فرصت دارید با پشتیبانی تماس بگیرید تا تعویض سایز انجام دهیم." },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black text-stone-900">سوالات متداول کاربران ❓</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-stone-900">{faq.q}</h2>
            <p className="mt-2 text-xs sm:text-sm leading-7 text-stone-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
