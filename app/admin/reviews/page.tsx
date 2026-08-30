"use client";

import { useState } from "react";
import { toPersianDigits } from "../../lib/utils";
import { MessageSquare, CheckCircle, XCircle } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      productTitle: "تیشرت نخ‌پنبه پسرانه طرح خرس رویال",
      authorName: "زهرا م.",
      rating: 5,
      comment: "جنس پارچه‌اش عالیه، دخترم هم عاشق طرحشه. سایز ۴-۵ سال دقیقاً اندازه بود.",
      sizeFit: "perfect",
      isApproved: true,
      createdAt: "1405/05/25",
    },
    {
      id: 2,
      productTitle: "پیراهن دخترانه گل‌دار بهاری مینی رز",
      authorName: "سارا حسینی",
      rating: 5,
      comment: "بسیار پیراهن نازیه! دخترم ۳ سالشه تنش عالی نشست.",
      sizeFit: "perfect",
      isApproved: true,
      createdAt: "1405/05/28",
    },
    {
      id: 3,
      productTitle: "شلوار کتان اسپرت پسرانه کمر کشی",
      authorName: "علی نوری",
      rating: 4,
      comment: "کیفیت کتان خوب بود ولی کمی دیر به دستم رسید.",
      sizeFit: "small",
      isApproved: false,
      createdAt: "1405/06/01",
    },
  ]);

  const toggleApproval = (id: number) => {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">تأیید نظرات و تحلیل سایز خریداران 💬</h1>
        <p className="mt-1 text-xs text-stone-500">
          مدیریت دیدگاه‌های ارسالی مشتریان، بررسی بازخورد سایز (size_fit) و انتشار روی سایت
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="p-3.5 font-bold">محصول مربوطه</th>
              <th className="p-3.5 font-bold">نام نویسنده</th>
              <th className="p-3.5 font-bold">امتیاز</th>
              <th className="p-3.5 font-bold">بازخورد سایز</th>
              <th className="p-3.5 font-bold max-w-sm">متن نظر</th>
              <th className="p-3.5 font-bold">وضعیت</th>
              <th className="p-3.5 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-800">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="p-3.5 font-bold">{r.productTitle}</td>
                <td className="p-3.5">{r.authorName}</td>
                <td className="p-3.5 text-amber-500 font-bold">{"★".repeat(r.rating)}</td>
                <td className="p-3.5">
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-bold">
                    {r.sizeFit === "perfect" ? "مناسب" : r.sizeFit === "small" ? "کوچک" : "بزرگ"}
                  </span>
                </td>
                <td className="p-3.5 max-w-xs leading-5 text-stone-600">{r.comment}</td>
                <td className="p-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      r.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.isApproved ? "تأیید شده" : "در انتظار تأیید"}
                  </span>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => toggleApproval(r.id)}
                    className={`rounded-xl px-3 py-1 text-[11px] font-bold ${
                      r.isApproved
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    {r.isApproved ? "عدم تأیید" : "تأیید و انتشار"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
