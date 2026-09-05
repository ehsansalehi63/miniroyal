import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentState,
  getSiteUrl,
  toRial,
  getZarinpalApi,
  getZarinpalStartUrl,
} from "@/app/lib/payment";
import { findOrder, updatePayment } from "@/app/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    if (!merchantId || merchantId.startsWith("your-")) {
      return NextResponse.json({ success: false, error: "درگاه پرداخت هنوز در هاست تنظیم نشده است." }, { status: 503 });
    }

    const body = await req.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const description = typeof body.description === "string"
      ? body.description.slice(0, 500)
      : `پرداخت سفارش ${orderNumber}`;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "شمارهٔ سفارش معتبر نیست." }, { status: 400 });
    }
    const order = await findOrder(orderNumber);
    if (!order) {
      return NextResponse.json({ success: false, error: "سفارش پیدا نشد." }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: "این سفارش قبلاً پرداخت شده است." }, { status: 400 });
    }
    /*
      مبلغ پرداخت فقط از روی سفارش ذخیره‌شده خوانده می‌شود. قبلاً مبلغ ارسالی مرورگر
      با مبلغ سفارش مقایسه می‌شد و چون سرور تخفیف/کرایهٔ استعلامی را ذخیره نمی‌کرد،
      هر سفارش دارای کد تخفیف با پیام «سفارش معتبر یا قابل پرداخت نیست» رد می‌شد.
    */
    const amount = Number(order.finalTotal);
    if (!Number.isSafeInteger(amount) || amount < 1000) {
      return NextResponse.json({ success: false, error: "مبلغ سفارش برای پرداخت آنلاین معتبر نیست." }, { status: 400 });
    }

    const state = createPaymentState(orderNumber, amount);
    const callbackUrl = new URL(`${getSiteUrl()}/api/payment/verify`);
    callbackUrl.searchParams.set("orderNumber", orderNumber);
    callbackUrl.searchParams.set("amount", String(amount));
    callbackUrl.searchParams.set("state", state);

    const response = await fetch(`${getZarinpalApi()}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: toRial(amount),
        callback_url: callbackUrl.toString(),
        description,
        metadata: { order_id: orderNumber },
      }),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || Number(result?.data?.code) !== 100 || !result?.data?.authority) {
      console.error("ZarinPal request failed:", result);
      return NextResponse.json({ success: false, error: "دریافت مجوز پرداخت از زرین‌پال انجام نشد." }, { status: 502 });
    }
    await updatePayment(orderNumber, { authority: String(result.data.authority) });

    return NextResponse.json({
      success: true,
      paymentUrl: getZarinpalStartUrl(String(result.data.authority)),
    });
  } catch (error) {
    console.error("ZarinPal request error:", error);
    return NextResponse.json({ success: false, error: "خطا در اتصال به درگاه زرین‌پال." }, { status: 500 });
  }
}
