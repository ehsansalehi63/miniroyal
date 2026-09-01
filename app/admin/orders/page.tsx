"use client";

import { useEffect, useState } from "react";
import { formatToman } from "../../lib/utils";

interface OrderRecord {
  orderNumber: string;
  recipientName: string;
  phone: string;
  finalTotal: number;
  status: string;
  paymentMethod: string;
  shippingProvider: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("miniroyal_orders") || "[]");
      if (saved.length > 0) return saved;
    }
    return [
      {
        orderNumber: "MR-984210",
        recipientName: "زهرا حسینی",
        phone: "۰۹۱۲۳۴۵۶۷۸۹",
        finalTotal: 595000,
        status: "processing",
        paymentMethod: "zarinpal",
        shippingProvider: "tipax",
        createdAt: "2026-08-29T10:15:00.000Z",
      },
      {
        orderNumber: "MR-871204",
        recipientName: "علیرضا نوری",
        phone: "۰۹۱۹۸۷۶۵۴۳۲",
        finalTotal: 820000,
        status: "shipped",
        paymentMethod: "cod",
        shippingProvider: "post",
        createdAt: "2026-08-28T14:30:00.000Z",
      },
    ];
  });

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((response) => response.json())
      .then((result) => {
        if (result.success && Array.isArray(result.orders)) setOrders(result.orders);
      })
      .catch(() => undefined);
  }, []);

  const [filterStatus, setFilterStatus] = useState("all");

  const handleStatusChange = (orderNumber: string, newStatus: string) => {
    const updated = orders.map((o) =>
      o.orderNumber === orderNumber ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, status: newStatus }),
    }).catch(() => undefined);
    if (typeof window !== "undefined") {
      localStorage.setItem("miniroyal_orders", JSON.stringify(updated));
    }
  };

  const filtered = orders.filter((o) =>
    filterStatus === "all" ? true : o.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">مدیریت سفارش‌ها و مرسولات 📦</h1>
          <p className="mt-1 text-xs text-stone-500">
            بررسی سفارشات دریافتی، تغییر وضعیت آماده‌سازی، درج کد رهگیری پستی و چاپ فاکتور
          </p>
        </div>
      </div>

      {/* فیلتر وضعیت */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {[
          { id: "all", label: "همه سفارش‌ها" },
          { id: "processing", label: "در حال پردازش انبار ⏳" },
          { id: "shipped", label: "تحویل پست / تیپاکس 🚚" },
          { id: "delivered", label: "تحویل خریدار شده ✅" },
          { id: "cancelled", label: "لغو شده ❌" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterStatus(btn.id)}
            className={`rounded-xl px-4 py-2 transition ${
              filterStatus === btn.id
                ? "bg-violet-700 text-white shadow-md"
                : "bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* جدول سفارشات */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="p-3.5 font-bold">شماره سفارش</th>
                <th className="p-3.5 font-bold">نام خریدار</th>
                <th className="p-3.5 font-bold">تلفن</th>
                <th className="p-3.5 font-bold">مبلغ نهایی</th>
                <th className="p-3.5 font-bold">روش پرداخت</th>
                <th className="p-3.5 font-bold">وضعیت</th>
                <th className="p-3.5 font-bold">تغییر وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.map((order) => (
                <tr key={order.orderNumber} className="hover:bg-stone-50">
                  <td className="p-3.5 font-bold text-violet-700 font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="p-3.5 font-bold">{order.recipientName}</td>
                  <td className="p-3.5 text-stone-500">{order.phone}</td>
                  <td className="p-3.5 font-extrabold">{formatToman(order.finalTotal)}</td>
                  <td className="p-3.5">
                    {order.paymentMethod === "zarinpal" ? "درگاه آنلاین" : "پرداخت در محل"}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        order.status === "processing"
                          ? "bg-amber-100 text-amber-800"
                          : order.status === "shipped"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {order.status === "processing"
                        ? "در حال پردازش"
                        : order.status === "shipped"
                        ? "ارسال شده"
                        : "تحویل داده شده"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.orderNumber, e.target.value)}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-1.5 text-xs outline-none focus:border-violet-500"
                    >
                      <option value="processing">در حال پردازش</option>
                      <option value="shipped">ارسال شده به پست</option>
                      <option value="delivered">تحویل داده شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
