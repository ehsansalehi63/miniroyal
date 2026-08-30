"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function AdminBlogPage() {
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: "راهنمای جامع انتخاب سایز لباس کودک بدون خطا",
      slug: "kids-size-guide-tips",
      category: "راهنمای سایز",
      author: "تیم هوش مصنوعی مینی رویال",
      date: "۱ شهریور ۱۴۰۵",
      isPublished: true,
    },
    {
      id: 2,
      title: "بهترین پارچه‌های پنبه‌ای برای پوست حساس نوزاد",
      slug: "best-cotton-fabrics-for-babies",
      category: "جنس پارچه",
      author: "کارشناس نساجی مینی رویال",
      date: "۲۵ مرداد ۱۴۰۵",
      isPublished: true,
    },
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("راهنمای خرید");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = () => {
    if (!title) {
      alert("لطفاً ابتدا موضوع یا عنوان مقاله را وارد کنید.");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setContent(
        `این یک مقاله تخصصی تولیدشده توسط موتور هوش مصنوعی مینی رویال درباره «${title}» است.\n\n` +
          `۱. نکات مهم انتخاب پارچه و الیاف طبیعی ارگانیک\n` +
          `۲. راهنمای اندازه‌گیری و جلوگیری از خرید سایز اشتباه\n` +
          `۳. دستورالعمل شست‌وشو جهت افزایش طول عمر لباس`
      );
      setIsGenerating(false);
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    const newArt = {
      id: Date.now(),
      title,
      slug: `article-${Date.now()}`,
      category,
      author: "ادمین مینی رویال",
      date: new Date().toISOString().split("T")[0],
      isPublished: true,
    };
    setArticles([newArt, ...articles]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">مدیریت مجله و تولید محتوای AI 📝</h1>
        <p className="mt-1 text-xs text-stone-500">
          تولید خودکار مقالات آموزشی سئومحور با موتور AgentRouter AI
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900">تولید و انتشار مقاله جدید</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-stone-700">عنوان مقاله / موضوع سئو *</label>
            <input
              type="text"
              required
              placeholder="مثال: نحوه ست کردن لباس نوزاد برای عکاسی"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700">دسته‌بندی مقاله</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500 font-bold"
            >
              <option value="راهنمای خرید">راهنمای خرید</option>
              <option value="راهنمای سایز">راهنمای سایز</option>
              <option value="جنس پارچه">جنس پارچه</option>
              <option value="استایل کودک">استایل کودک</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-stone-700">متن مقاله</label>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800 hover:bg-violet-200 disabled:opacity-50"
            >
              <Sparkles className="size-3.5" />
              <span>{isGenerating ? "در حال تولید با AI..." : "تولید خودکار متن با AI"}</span>
            </button>
          </div>
          <textarea
            rows={5}
            required
            placeholder="متن مقاله را بنویسید یا دکمه تولید خودکار با AI را بزنید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-stone-200 p-2.5 text-xs outline-none focus:border-violet-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
        >
          انتشار مقاله در سایت
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="p-3.5 font-bold">عنوان مقاله</th>
              <th className="p-3.5 font-bold">دسته</th>
              <th className="p-3.5 font-bold">نویسنده</th>
              <th className="p-3.5 font-bold">تاریخ انتشار</th>
              <th className="p-3.5 font-bold">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-stone-50">
                <td className="p-3.5 font-bold">{a.title}</td>
                <td className="p-3.5">{a.category}</td>
                <td className="p-3.5 text-stone-500">{a.author}</td>
                <td className="p-3.5 text-stone-500">{a.date}</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    منتشر شده
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
