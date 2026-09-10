"use client";

import { useEffect, useState } from "react";
import { toPersianDigits } from "../../lib/utils";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  CornerDownLeft,
  RefreshCw,
  AlertCircle,
  Star,
  Clock,
} from "lucide-react";

interface ReviewItem {
  id: number;
  productId: number;
  productTitle: string;
  customerId: number | null;
  authorName: string;
  rating: number;
  comment: string;
  sizeFit: "small" | "perfect" | "large";
  isVerifiedBuyer: boolean;
  isApproved: boolean;
  adminReply: string | null;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // پاسخ ادمین
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "دریافت دیدگاه‌ها ناموفق بود.");
      }
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در اتصال به دیتابیس دیدگاه‌ها.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleToggleApproval = async (review: ReviewItem) => {
    setBusyId(review.id);
    setError("");
    try {
      const nextApproved = !review.isApproved;
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, isApproved: nextApproved }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در بروزرسانی وضعیت دیدگاه.");
      }
      setReviews((curr) =>
        curr.map((r) => (r.id === review.id ? { ...r, isApproved: nextApproved } : r))
      );
      setSuccessMsg(nextApproved ? "دیدگاه با موفقیت تأیید شد." : "دیدگاه به حالت تعلیق درآمد.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات انجام نشد.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveReply = async (id: number) => {
    if (!replyText.trim()) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminReply: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ثبت پاسخ ادمین.");
      }
      setReviews((curr) =>
        curr.map((r) => (r.id === id ? { ...r, adminReply: replyText.trim() } : r))
      );
      setReplyingId(null);
      setReplyText("");
      setSuccessMsg("پاسخ مدیر با موفقیت ثبت شد.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت پاسخ انجام نشد.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("آیا از حذف دائمی این دیدگاه اطمینان دارید؟")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "حذف دیدگاه ناموفق بود.");
      }
      setReviews((curr) => curr.filter((r) => r.id !== id));
      setSuccessMsg("دیدگاه با موفقیت حذف شد.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف انجام نشد.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div dir="rtl" className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مدیریت دیدگاه‌ها و رضایت خریداران</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            بررسی نظرات خریداران، تأیید انتشار، درج پاسخ فروشگاه و تحلیل تن‌خور و قواره لباس‌ها.
          </p>
        </div>
        <button
          onClick={() => void loadReviews()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* فیلترها */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "all"
              ? "bg-stone-950 text-white shadow"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          همه دیدگاه‌ها ({toPersianDigits(reviews.length)})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`relative rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "pending"
              ? "bg-amber-600 text-white shadow"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          در انتظار بررسی ({toPersianDigits(pendingCount)})
          {pendingCount > 0 && (
            <span className="mr-1.5 inline-block size-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "approved"
              ? "bg-emerald-700 text-white shadow"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          تأیید شده ({toPersianDigits(reviews.length - pendingCount)})
        </button>
      </div>

      {/* لیست دیدگاه‌ها */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">محصول</th>
                <th className="p-3.5 font-bold">نویسنده</th>
                <th className="p-3.5 font-bold">امتیاز</th>
                <th className="p-3.5 font-bold">قواره / سایز</th>
                <th className="p-3.5 font-bold max-w-sm">دیدگاه و پاسخ</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال دریافت دیدگاه‌ها..." : "هیچ نظری در این بخش وجود ندارد."}
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 align-top">
                    <td className="p-3.5 font-bold text-stone-900 max-w-[180px]">
                      <span className="line-clamp-2">{r.productTitle}</span>
                      <span className="mt-1 block text-[10px] font-mono text-stone-400">
                        کد: #{r.productId}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-stone-800">{r.authorName}</div>
                      {r.isVerifiedBuyer ? (
                        <span className="mt-0.5 inline-block text-[10px] text-emerald-700 font-bold">
                          ✓ خریدار تأییدشده
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < r.rating ? "fill-amber-400 text-amber-500" : "text-stone-200"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          r.sizeFit === "perfect"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : r.sizeFit === "small"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {r.sizeFit === "perfect" ? "قواره استاندارد" : r.sizeFit === "small" ? "کمی تنگ/کوچک" : "کمی گشاد/بزرگ"}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm space-y-2">
                      <p className="leading-5 text-stone-700">{r.comment}</p>

                      {/* پاسخ ادمین */}
                      {r.adminReply && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-2.5 text-[11px] text-amber-900 space-y-1">
                          <span className="font-bold block text-amber-800">پاسخ مدیر فروشگاه:</span>
                          <p>{r.adminReply}</p>
                        </div>
                      )}

                      {replyingId === r.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="متن پاسخ مدیر به خریدار..."
                            className="w-full rounded-xl border border-stone-200 p-2 text-xs outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleSaveReply(r.id)}
                              disabled={busyId === r.id}
                              className="rounded-lg bg-stone-900 px-3 py-1 text-[10px] font-bold text-white hover:bg-stone-800"
                            >
                              ارسال پاسخ
                            </button>
                            <button
                              onClick={() => {
                                setReplyingId(null);
                                setReplyText("");
                              }}
                              className="rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] text-stone-600 hover:bg-stone-100"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingId(r.id);
                            setReplyText(r.adminReply || "");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800"
                        >
                          <CornerDownLeft className="size-3" />
                          <span>{r.adminReply ? "ویرایش پاسخ" : "ثبت پاسخ مدیر"}</span>
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.isApproved ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>منتشر شده</span>
                          </>
                        ) : (
                          <>
                            <Clock className="size-3" />
                            <span>در انتظار تأیید</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center space-x-1 space-x-reverse">
                      <button
                        onClick={() => void handleToggleApproval(r)}
                        disabled={busyId === r.id}
                        className={`rounded-xl px-3 py-1 text-[11px] font-bold transition ${
                          r.isApproved
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }`}
                      >
                        {r.isApproved ? "لغو تأیید" : "تأیید و انتشار"}
                      </button>
                      <button
                        onClick={() => void handleDelete(r.id)}
                        disabled={busyId === r.id}
                        className="rounded-xl p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="حذف دیدگاه"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
