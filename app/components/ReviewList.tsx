"use client";

import { useState } from "react";
import { ProductReview } from "../lib/types/catalog";
import { toPersianDigits } from "../lib/utils";

interface ReviewListProps {
  productId: number;
  reviews?: ProductReview[];
}

export default function ReviewList({ productId, reviews = [] }: ReviewListProps) {
  const [list, setList] = useState<ProductReview[]>(reviews);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [sizeFit, setSizeFit] = useState<"small" | "perfect" | "large">("perfect");
  const [comment, setComment] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !name.trim()) return;

    const newRev: ProductReview = {
      id: Date.now(),
      productId,
      authorName: name,
      rating,
      comment,
      sizeFit,
      isVerifiedBuyer: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setList([newRev, ...list]);
    setShowForm(false);
    setSuccessMsg(true);
    setName("");
    setComment("");
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-stone-900">
          نظرات مشتریان ({toPersianDigits(list.length)})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-violet-800"
        >
          {showForm ? "بستن فرم" : "ثبت نظر جدید ✍️"}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800">
          ✅ نظر شما با موفقیت ثبت شد و پس از بررسی ادمین نمایش داده می‌شود.
        </div>
      )}

      {/* فرم ثبت نظر */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-violet-100 bg-violet-50/40 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900">ثبت نظر و تجربه سایز خرید</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700">نام و نام خانوادگی</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مریم احمدی"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700">امتیاز شما</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (عالی)</option>
                <option value={4}>⭐⭐⭐⭐ (خوب)</option>
                <option value={3}>⭐⭐⭐ (متوسط)</option>
                <option value={2}>⭐⭐ (ضعیف)</option>
                <option value={1}>⭐ (بد)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-stone-700">سایز خرید به تن کودک چطور بود؟</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {[
                { id: "small" as const, label: "کوچک بود" },
                { id: "perfect" as const, label: "کاملاً اندازه بود" },
                { id: "large" as const, label: "گشاد/بزرگ بود" },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-1.5 text-xs text-stone-700">
                  <input
                    type="radio"
                    name="sizeFit"
                    value={item.id}
                    checked={sizeFit === item.id}
                    onChange={() => setSizeFit(item.id)}
                    className="accent-violet-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-stone-700">متن نظر شما</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="درباره جنس پارچه، ثبات رنگ، تعویض سایز و تن‌خور بنویسید..."
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
          >
            ثبت نهایی نظر
          </button>
        </form>
      )}

      {/* لیست نظرات */}
      {list.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500">
          هنوز نظری ثبت نشده است. اولین خریدار باشید که نظر می‌دهید!
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-800">{rev.authorName}</span>
                  {rev.isVerifiedBuyer && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ✓ خریدار تأیید شده
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-400">{toPersianDigits(rev.createdAt)}</span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-amber-500 font-bold">
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(5 - rev.rating)}
                </span>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                  سایز:{" "}
                  {rev.sizeFit === "perfect"
                    ? "کاملاً مناسب"
                    : rev.sizeFit === "small"
                    ? "کوچک"
                    : "بزرگ"}
                </span>
              </div>

              <p className="mt-3 text-xs leading-6 text-stone-700">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
