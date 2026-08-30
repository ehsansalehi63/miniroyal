export const metadata = {
  title: "تماس با ما | مینی رویال",
  description: "راه ارتباطی با پشتیبانی فروشگاه مینی رویال، شماره تلفن، آدرس و فرم تماس.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black text-stone-900">تماس با پشتیبانی مینی رویال 📞</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4 text-xs sm:text-sm text-stone-700">
          <h2 className="font-bold text-base text-stone-900">اطلاعات تماس miniroyal.shop</h2>
          <p><strong>📍 آدرس مرکز توزیع:</strong> تهران، خیابان بهار شمالی، پلاک ۱۲۰، واحد ۴</p>
          <p><strong>📞 تلفن پشتیبانی:</strong> ۰۲۱-۸۸۸۸۹۹۰۰ (شنبه تا پنج‌شنبه ۹ الی ۱۸)</p>
          <p><strong>💬 پشتیبانی تلگرام و ایتا:</strong> @miniroyal_admin</p>
          <p><strong>✉️ ایمیل پشتیبانی:</strong> info@miniroyal.shop</p>
        </div>

        <form className="rounded-3xl border border-violet-100 bg-violet-50/40 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-stone-900">ارسال پیام به پشتیبانی</h2>
          <div>
            <label className="block text-xs font-bold text-stone-700">نام و نام خانوادگی</label>
            <input type="text" className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700">شماره موبایل</label>
            <input type="tel" className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700">متن پیام</label>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500" required />
          </div>
          <button type="submit" className="w-full rounded-xl bg-violet-700 py-3 text-xs font-bold text-white shadow-md hover:bg-violet-800">
            ارسال پیام
          </button>
        </form>
      </div>
    </div>
  );
}
