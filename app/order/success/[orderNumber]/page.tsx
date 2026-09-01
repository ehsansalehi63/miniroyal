"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatToman } from "../../../lib/utils";
import { CheckCircle2, Printer } from "lucide-react";

interface OrderData {
  orderNumber: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  shippingProvider: string;
  paymentMethod: string;
  finalTotal: number;
  status: string;
  createdAt: string;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  useEffect(() => {
    fetch(`/api/orders?identifier=${encodeURIComponent(orderNumber)}`)
      .then((response) => response.json())
      .then((result) => setOrder(result.success ? result.order : null))
      .catch(() => setOrder(null));
  }, [orderNumber]);
  /*
  const [legacyOrder] = useState<OrderData>(() => {
    if (typeof window !== "undefined") {
      const orders = JSON.parse(localStorage.getItem("miniroyal_orders") || "[]");
      const found = orders.find((o: OrderData) => o.orderNumber === orderNumber);
      if (found) return found;
    }
    return {
      orderNumber,
      recipientName: "مشتری عزیز مینی رویال",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      province: "تهران",
      city: "تهران",
      address: "تهران، خیابان ولیعصر، خیابان فرشته، پلاک ۱۲",
      postalCode: "۱۲۳۴۵۶۷۸۹۰",
      shippingProvider: "tipax",
      paymentMethod: "zarinpal",
      finalTotal: 780000,
      status: "processing",
      createdAt: new Date().toISOString(),
    };
  });
  */

  if (!order) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl p-8">
        <div className="text-center border-b border-stone-100 pb-8">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-stone-900 sm:text-3xl">
            سفارش شما با موفقیت ثبت شد! 🎉
          </h1>
          <p className="mt-2 text-xs text-stone-600 sm:text-sm">
            کد پیگیری سفارش شما: <strong className="text-violet-700 font-extrabold">{order.orderNumber}</strong>
          </p>
        </div>

        {/* خط زمانی وضعیت سفارش */}
        <div className="my-8 rounded-2xl bg-stone-50 p-6">
          <h3 className="text-xs font-bold text-stone-700 mb-4">مراحل آماده‌سازی و ارسال سفارش:</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
            <div className="text-emerald-700">
              <span className="mx-auto grid size-8 place-items-center rounded-full bg-emerald-500 text-white mb-1">✓</span>
              ثبت سفارش
            </div>
            <div className="text-violet-700">
              <span className="mx-auto grid size-8 place-items-center rounded-full bg-violet-600 text-white mb-1">۲</span>
              پردازش انبار
            </div>
            <div className="text-stone-400">
              <span className="mx-auto grid size-8 place-items-center rounded-full bg-stone-200 mb-1">۳</span>
              تحویل به پست/تیپاکس
            </div>
            <div className="text-stone-400">
              <span className="mx-auto grid size-8 place-items-center rounded-full bg-stone-200 mb-1">۴</span>
              تحویل درب منزل
            </div>
          </div>
        </div>

        {/* مشخصات آدرس و فاکتور */}
        <div className="grid gap-6 sm:grid-cols-2 text-xs leading-7 text-stone-700">
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2 mb-2">اطلاعات تحویل گیرنده</h4>
            <p><strong>گیرنده:</strong> {order.recipientName}</p>
            <p><strong>تلفن:</strong> {order.phone}</p>
            <p><strong>نشانی:</strong> {order.province}، {order.city}، {order.address}</p>
            <p><strong>کد پستی:</strong> {order.postalCode}</p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2 mb-2">صورت‌حساب</h4>
            <p><strong>مبلغ نهایی:</strong> {formatToman(order.finalTotal)}</p>
            <p><strong>روش پرداخت:</strong> {order.paymentMethod === "zarinpal" ? "پرداخت آنلاین زرین‌پال" : "پرداخت در محل"}</p>
            <p><strong>روش ارسال:</strong> {order.shippingProvider === "tipax" ? "تیپاکس" : "پست پیشتاز"}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            <Printer className="size-4" />
            <span>چاپ فاکتور</span>
          </button>

          <Link
            href="/shop"
            className="rounded-full bg-violet-700 px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-800"
          >
            ادامه خرید از فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}
