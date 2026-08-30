export const metadata = {
  title: "درباره ما | مینی رویال",
  description: "درباره فروشگاه پوشاک کودک و نوجوان مینی رویال؛ تنها فروشگاه دارنده پرو آنلاین و تضمین سایز در ایران.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">
        درباره فروشگاه مینی رویال (Mini Royal) 👑
      </h1>

      <div className="mt-6 space-y-6 text-sm leading-8 text-stone-700">
        <p>
          <strong>مینی رویال</strong>، اولین فروشگاه تخصصی پوشاک کودک و نوجوان در ایران است که خرید آنلاین لباس برای فرزندان را به تجربه‌ای آسان، بی‌خطا و لذت‌بخش تبدیل کرده است.
        </p>

        <h2 className="text-xl font-bold text-stone-900 pt-4">چرا مینی رویال متفاوت است؟</h2>
        <ul className="list-disc list-inside space-y-2 text-stone-800">
          <li><strong>پرو آنلاین و توصیه‌گر سایز هوشمند (Smart Fit):</strong> قبل از خرید، دقیق‌ترین سایز متناسب با قد و وزن فرزندتان را مشاهده کنید.</li>
          <li><strong>تضمین تعویض سایز 7 روزه:</strong> در صورت کوچک یا بزرگ بودن سایز، بدون هزینه اضافی تعویض می‌شود.</li>
          <li><strong>پارچه‌های ۱۰۰٪ پنبه ارگانیک:</strong> بافت‌های نرم و ضد حساسیت مخصوص پوست حساس کودکان.</li>
          <li><strong>ارسال سریع به سراسر کشور:</strong> با هم‌کاری پست پیشتاز و تیپاکس.</li>
        </ul>
      </div>
    </div>
  );
}
