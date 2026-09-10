"use client";

import { useEffect, useState } from "react";
import { formatToman, toPersianDigits } from "../../lib/utils";
import {
  ShoppingBag,
  Printer,
  X,
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";

type OrderRecord = {
  orderNumber: string;
  recipientName: string;
  phone: string;
  finalTotal: number;
  status: string;
  paymentMethod: string;
  shippingProvider: string;
  createdAt: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  postexParcelNo?: string;
  trackingCode?: string;
  trackingStatus?: string;
};

type OrderItemDetail = {
  title: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
};

type FullOrder = OrderRecord & {
  refId?: string;
  paymentStatus?: string;
  items: OrderItemDetail[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  // مشاهده فاکتور سفارش
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

  // نمایش پیام یا رهگیری تیپاکس
  const [trackingModal, setTrackingModal] = useState<{ title: string; content: string; url?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "دریافت سفارش‌ها انجام نشد.");
      }
      setOrders(result.orders || []);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "دریافت سفارش‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleStatusChange = async (orderNumber: string, status: string) => {
    setBusy(orderNumber);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "تغییر وضعیت انجام نشد.");
      }
      setOrders((current) =>
        current.map((order) => (order.orderNumber === orderNumber ? { ...order, status } : order))
      );
      setSuccessMsg("وضعیت سفارش در دیتابیس بروز شد.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  };

  const tipaxAction = async (orderNumber: string, action: "register" | "track") => {
    setBusy(`${action}:${orderNumber}`);
    setError("");
    try {
      const response = await fetch("/api/admin/orders/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "عملیات تیپاکس انجام نشد.");
      }
      if (action === "register") {
        setSuccessMsg(`سفارش ${orderNumber} با موفقیت در سامانه تیپاکس ثبت و بارکد اختصاص یافت.`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await load();
      } else {
        const barcode = result.tracking?.trackingCode || result.identifiers?.barcode || "";
        const trackingUrl = result.trackingUrl || (barcode ? `https://tipaxco.com/tracking?id=${encodeURIComponent(barcode)}` : "");
        setTrackingModal({
          title: `وضعیت رهگیری تیپاکس (سفارش ${orderNumber})`,
          content: typeof result.tracking === "object" ? JSON.stringify(result.tracking, null, 2) : String(result.tracking || "اطلاعاتی یافت نشد."),
          url: trackingUrl,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات تیپاکس انجام نشد.");
    } finally {
      setBusy("");
    }
  };

  const handleViewInvoice = async (order: OrderRecord) => {
    setFetchingInvoice(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders?orderNumber=${encodeURIComponent(order.orderNumber)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || "اطلاعات اقلام سفارش یافت نشد.");
      }

      let parsedItems: OrderItemDetail[] = [];
      if (data.order.items_json) {
        try {
          parsedItems = data.order.items_json.split("||").map((itemStr: string) => JSON.parse(itemStr));
        } catch {}
      }

      setSelectedOrder({
        ...order,
        refId: data.order.refId,
        paymentStatus: data.order.paymentStatus,
        items: parsedItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت جزئیات سفارش.");
    } finally {
      setFetchingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = orders.filter((order) => {
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.recipientName.toLowerCase().includes(q) ||
      order.phone.includes(q)
    );
  });

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl">
      {/* هدر */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-6 text-amber-600" />
            <h1 className="text-2xl font-black text-stone-900">مدیریت سفارش‌ها و مرسولات</h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            بررسی آدرس، پرداخت، صدور فاکتور رسمی ووکامرس، ثبت خودکار سامانه پستکس و رهگیری مرسولات.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>بروزرسانی لیست</span>
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

      {/* جستجو و فیلتر وضعیت */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="text"
            placeholder="جستجو با شماره سفارش، نام خریدار یا شماره موبایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2 pr-10 pl-3 text-xs outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {[
            { id: "all", label: "همه" },
            { id: "processing", label: "در حال پردازش" },
            { id: "shipped", label: "ارسال شده" },
            { id: "delivered", label: "تحویل شده" },
            { id: "cancelled", label: "لغو شده" },
          ].map((button) => (
            <button
              key={button.id}
              onClick={() => setFilterStatus(button.id)}
              className={`rounded-xl px-4 py-2 transition ${
                filterStatus === button.id
                  ? "bg-stone-950 text-white font-black shadow-xs"
                  : "bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100"
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {/* حالت موبایل: کارت‌های کامل و لمسی سفارشات */}
      <div className="block md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-400 shadow-sm">
            {loading ? "در حال دریافت اطلاعات..." : "هیچ سفارشی مطابق جستجو یافت نشد."}
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={`mob-${order.orderNumber}`}
              className="rounded-3xl border border-stone-200 bg-white p-4.5 shadow-sm space-y-3"
            >
              {/* هدر کارت: شماره سفارش و وضعیت */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <span className="font-mono text-xs font-black text-amber-900">
                    #{order.orderNumber}
                  </span>
                  <span className="block text-[10px] text-stone-400 font-sans mt-0.5">
                    {new Date(order.createdAt).toLocaleString("fa-IR")}
                  </span>
                </div>
                <div>
                  <select
                    value={order.status}
                    disabled={busy === order.orderNumber}
                    onChange={(event) => void handleStatusChange(order.orderNumber, event.target.value)}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-black outline-none focus:border-amber-500"
                  >
                    <option value="processing">در حال پردازش</option>
                    <option value="shipped">ارسال شده 🚚</option>
                    <option value="delivered">تحویل شده ✅</option>
                    <option value="cancelled">لغو شده ❌</option>
                  </select>
                </div>
              </div>

              {/* مشخصات گیرنده */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">{order.recipientName}</span>
                  <a
                    href={`tel:${order.phone}`}
                    className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg text-[11px]"
                    dir="ltr"
                  >
                    📞 {order.phone}
                  </a>
                </div>
                <p className="text-[11px] text-stone-600 leading-5">
                  {order.province ? `${order.province}، ${order.city}، ${order.address}` : "آدرس ثبت نشده"}
                </p>
                {order.postalCode && (
                  <p className="font-mono text-[10px] text-stone-400">
                    کدپستی: {order.postalCode}
                  </p>
                )}
              </div>

              {/* مبلغ و روش پرداخت */}
              <div className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">مبلغ سفارش:</span>
                  <span className="font-black text-stone-900 text-sm">
                    {formatToman(order.finalTotal)}
                  </span>
                </div>
                <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-stone-700 border border-stone-200">
                  {order.paymentMethod === "zarinpal" ? "💳 درگاه زرین‌پال" : "💵 پرداخت در محل"}
                </span>
              </div>

              {/* تیپاکس و فاکتور */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex-1">
                  {order.postexParcelNo ? (
                    <span className="inline-block rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-mono font-bold text-amber-950">
                      تیپاکس: {order.postexParcelNo}
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 block">فاقد بارکد تیپاکس</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void tipaxAction(order.orderNumber, order.postexParcelNo ? "track" : "register")}
                    disabled={busy.includes(order.orderNumber)}
                    className="rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-black text-stone-950 hover:bg-amber-300 transition shadow-xs"
                  >
                    {busy.includes(order.orderNumber)
                      ? "..."
                      : order.postexParcelNo
                      ? "رهگیری تیپاکس"
                      : "ثبت تیپاکس"}
                  </button>
                  <button
                    onClick={() => void handleViewInvoice(order)}
                    className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold text-stone-800 hover:bg-stone-100 transition shadow-xs"
                  >
                    <FileText className="size-3.5 text-amber-600" />
                    <span>فاکتور</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* جدول سفارش‌ها برای دسکتاپ */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-3.5 font-bold">شناسه و تاریخ سفارش</th>
                <th className="p-3.5 font-bold">گیرنده و آدرس ارسال</th>
                <th className="p-3.5 font-bold">مبلغ و پرداخت</th>
                <th className="p-3.5 font-bold">وضعیت سفارش</th>
                <th className="p-3.5 font-bold">سامانه ارسال / تیپاکس (Tipax)</th>
                <th className="p-3.5 font-bold text-center">فاکتور و عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-stone-400">
                    {loading ? "در حال دریافت اطلاعات..." : "هیچ سفارشی مطابق جستجو یافت نشد."}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.orderNumber} className="align-top hover:bg-stone-50/70">
                    <td className="p-3.5 font-mono font-bold text-amber-800">
                      <div className="text-sm font-black">{order.orderNumber}</div>
                      <span className="mt-1 block font-sans text-[11px] text-stone-400 font-normal">
                        {new Date(order.createdAt).toLocaleString("fa-IR")}
                      </span>
                    </td>

                    <td className="max-w-xs p-3.5">
                      <div className="font-bold text-stone-900">{order.recipientName}</div>
                      <span className="block font-mono text-stone-500 text-[11px]" dir="ltr">
                        {order.phone}
                      </span>
                      <span className="mt-1 block text-[11px] leading-5 text-stone-600">
                        {order.province ? `${order.province}، ${order.city}، ${order.address}` : "آدرس ثبت نشده"}
                      </span>
                      {order.postalCode && (
                        <span className="block font-mono text-[10px] text-stone-400 mt-0.5">
                          کدپستی: {order.postalCode}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <strong className="text-stone-900 text-sm font-black">
                        {formatToman(order.finalTotal)}
                      </strong>
                      <span className="mt-1 block text-stone-500 text-[11px]">
                        {order.paymentMethod === "zarinpal" ? "💳 درگاه زرین‌پال" : "💵 پرداخت در محل (COD)"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={order.status}
                        disabled={busy === order.orderNumber}
                        onChange={(event) => void handleStatusChange(order.orderNumber, event.target.value)}
                        className="rounded-xl border border-stone-200 bg-white p-2 text-xs font-bold outline-none focus:border-amber-500"
                      >
                        <option value="processing">در حال پردازش</option>
                        <option value="shipped">ارسال شده 🚚</option>
                        <option value="delivered">تحویل شده ✅</option>
                        <option value="cancelled">لغو شده ❌</option>
                      </select>
                    </td>

                    <td className="p-3.5">
                      <div className="text-[11px] font-bold text-stone-700">
                        {order.postexParcelNo ? (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono text-amber-900 border border-amber-200">
                              تیپاکس: {order.postexParcelNo}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400">در انتظار صدور بارکد تیپاکس</span>
                        )}
                      </div>
                      {order.trackingCode && order.trackingCode !== order.postexParcelNo && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          کد رهگیری: {order.trackingCode}
                        </div>
                      )}
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => void tipaxAction(order.orderNumber, order.postexParcelNo ? "track" : "register")}
                          disabled={busy.includes(order.orderNumber)}
                          className="rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-black text-stone-950 hover:bg-amber-400 transition"
                        >
                          {busy.includes(order.orderNumber)
                            ? "..."
                            : order.postexParcelNo
                            ? "رهگیری تیپاکس"
                            : "ثبت در تیپاکس"}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => void handleViewInvoice(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 shadow-2xs transition"
                      >
                        <FileText className="size-3.5 text-amber-600" />
                        <span>فاکتور و اقلام</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مدال چاپ فاکتور رسمی به سبک ووکامرس */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-amber-600" />
                <h2 className="text-base font-black text-stone-900">
                  پیش‌نمایش فاکتور رسمی سفارش #{selectedOrder.orderNumber}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2 text-xs font-black text-white hover:bg-stone-800 shadow-md transition"
                >
                  <Printer className="size-3.5" />
                  <span>چاپ فاکتور (Print)</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* بدنه پرینت فاکتور */}
            <div id="invoice-printable" className="p-2 space-y-6 text-xs text-stone-800">
              {/* سربرگ */}
              <div className="flex items-center justify-between border-b-2 border-stone-900 pb-4">
                <div>
                  <div className="text-xl font-black text-stone-900">فروشگاه مینی رویال 👑</div>
                  <p className="text-[11px] text-stone-500 mt-1">تخصصی‌ترین مرکز پوشاک کودک و نوجوان</p>
                </div>
                <div className="text-left font-mono" dir="ltr">
                  <div className="font-black text-sm text-stone-900">INVOICE: #{selectedOrder.orderNumber}</div>
                  <div className="text-[11px] text-stone-500 font-sans">
                    تاریخ: {new Date(selectedOrder.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                </div>
              </div>

              {/* مشخصات گیرنده */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-stone-50 p-4 border border-stone-200">
                <div>
                  <span className="font-bold text-stone-500 block mb-1">مشخصات خریدار / تحویل‌گیرنده:</span>
                  <div className="font-black text-stone-900 text-sm">{selectedOrder.recipientName}</div>
                  <div className="font-mono text-stone-600 mt-1" dir="ltr">{selectedOrder.phone}</div>
                </div>
                <div>
                  <span className="font-bold text-stone-500 block mb-1">نشانی پستی تحویل:</span>
                  <div className="leading-5 text-stone-700">
                    {selectedOrder.province}، {selectedOrder.city}، {selectedOrder.address}
                  </div>
                  {selectedOrder.postalCode && (
                    <div className="font-mono text-stone-500 mt-1">کد پستی: {selectedOrder.postalCode}</div>
                  )}
                </div>
              </div>

              {/* جدول اقلام */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3">ردیف</th>
                      <th className="p-3">شرح کالا و مشخصه</th>
                      <th className="p-3">تعداد</th>
                      <th className="p-3">قیمت واحد</th>
                      <th className="p-3">قیمت کل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold">
                            <div>{it.title}</div>
                            {it.variantInfo && (
                              <span className="text-[11px] text-stone-500 font-normal">{it.variantInfo}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-black">{toPersianDigits(it.quantity)}</td>
                          <td className="p-3 font-mono">{formatToman(it.unitPrice)}</td>
                          <td className="p-3 font-mono font-bold">{formatToman(it.unitPrice * it.quantity)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-stone-500">
                          اطلاعات اقلام ذخیره شده در فاکتور.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* خلاصه مالی */}
              <div className="flex justify-end">
                <div className="w-64 rounded-2xl bg-stone-50 p-4 border border-stone-200 space-y-2">
                  <div className="flex justify-between font-bold text-stone-600">
                    <span>روش پرداخت:</span>
                    <span>{selectedOrder.paymentMethod === "zarinpal" ? "آنلاین (زرین‌پال)" : "در محل"}</span>
                  </div>
                  {selectedOrder.refId && (
                    <div className="flex justify-between text-[11px] font-mono text-stone-500">
                      <span>شماره پیگیری:</span>
                      <span>{selectedOrder.refId}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-sm text-stone-950">
                    <span>مبلغ کل پرداختی:</span>
                    <span className="text-amber-700">{formatToman(selectedOrder.finalTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-stone-400 border-t border-stone-100 pt-3">
                از خرید شما از مینی رویال سپاسگزاریم · جهت پیگیری با پشتیبانی سایت تماس بگیرید.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مدال وضعیت رهگیری پستی */}
      {trackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-amber-600" />
                <h3 className="text-sm font-black text-stone-900">{trackingModal.title}</h3>
              </div>
              <button
                onClick={() => setTrackingModal(null)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <pre
              className="max-h-60 overflow-auto rounded-xl bg-stone-50 p-3 text-[11px] font-mono text-stone-800"
              dir="ltr"
            >
              {trackingModal.content}
            </pre>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
              {trackingModal.url ? (
                <a
                  href={trackingModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-stone-950 hover:bg-amber-300 transition"
                >
                  <Truck className="size-3.5" />
                  <span>پیگیری زنده در سایت تیپاکس</span>
                </a>
              ) : <div />}
              <button
                onClick={() => setTrackingModal(null)}
                className="rounded-xl bg-stone-950 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
