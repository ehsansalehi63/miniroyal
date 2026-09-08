import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentState,
  getSiteUrl,
  toRial,
  getZarinpalApi,
  getZarinpalStartUrl,
  isZarinpalSandbox,
} from "@/app/lib/payment";
import { findOrder, updatePayment } from "@/app/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const amount = Number(body.amount);
    const description = typeof body.description === "string"
      ? body.description.slice(0, 500)
      : `پرداخت سفارش ${orderNumber}`;

    if (!orderNumber || !Number.isSafeInteger(amount) || amount < 1000) {
      return NextResponse.json({ success: false, error: "اطلاعات سفارش یا مبلغ معتبر نیست." }, { status: 200 });
    }
    const order = await findOrder(orderNumber);
    if (!order || Number(order.finalTotal) !== amount || order.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: "سفارش معتبر یا قابل پرداخت نیست." }, { status: 200 });
    }

    const state = createPaymentState(orderNumber, amount);
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    const isPlaceholderMerchant = !merchantId || merchantId.startsWith("your-");

    // In sandbox or when live merchant ID is not yet entered, route to test simulator
    if (isPlaceholderMerchant || isZarinpalSandbox()) {
      const sandboxAuth = `SANDBOX-${Date.now()}`;
      await updatePayment(orderNumber, { authority: sandboxAuth });
      const sandboxUrl = `/payment/gateway/sandbox?orderNumber=${encodeURIComponent(orderNumber)}&amount=${amount}&state=${encodeURIComponent(state)}&authority=${encodeURIComponent(sandboxAuth)}`;
      return NextResponse.json({
        success: true,
        paymentUrl: sandboxUrl,
      }, { status: 200 });
    }

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
      return NextResponse.json({
        success: false,
        error: `خطا در دریافت مجوز پرداخت زرین‌پال: ${result?.errors?.message || result?.data?.message || "پاسخ نامعتبر"}`
      }, { status: 200 });
    }
    await updatePayment(orderNumber, { authority: String(result.data.authority) });

    return NextResponse.json({
      success: true,
      paymentUrl: getZarinpalStartUrl(String(result.data.authority)),
    }, { status: 200 });
  } catch (error) {
    console.error("ZarinPal request error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "خطا در اتصال به درگاه زرین‌پال."
    }, { status: 200 });
  }
}
