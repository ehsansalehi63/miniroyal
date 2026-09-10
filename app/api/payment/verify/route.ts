import { NextRequest, NextResponse } from "next/server";
import {
  getSiteUrl,
  isValidPaymentState,
  toRial,
  getZarinpalApi,
} from "@/app/lib/payment";
import { findOrder, updatePayment, updateTipaxShipment } from "@/app/lib/orders";
import { registerTipaxOrder } from "@/app/lib/tipax";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const orderNumber = params.get("orderNumber") || "";
  const amount = Number(params.get("amount"));
  const state = params.get("state") || "";
  const authority = params.get("Authority") || "";
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, getSiteUrl()));

  if (!orderNumber || !Number.isSafeInteger(amount) || !authority || !isValidPaymentState(orderNumber, amount, state)) {
    return redirectTo(`/payment/verify?status=failed&orderNumber=${encodeURIComponent(orderNumber)}`);
  }
  if (params.get("Status") !== "OK") {
    await updatePayment(orderNumber, { paymentStatus: "cancelled" }).catch(() => undefined);
    return redirectTo(`/payment/verify?status=cancelled&orderNumber=${encodeURIComponent(orderNumber)}`);
  }

  try {
    const order = await findOrder(orderNumber);
    if (!order || Number(order.finalTotal) !== amount) {
      return redirectTo(`/payment/verify?status=failed&orderNumber=${encodeURIComponent(orderNumber)}`);
    }

    let refId: string | null = null;
    const isSandbox = authority.startsWith("SANDBOX-") || !process.env.ZARINPAL_MERCHANT_ID || process.env.ZARINPAL_MERCHANT_ID.startsWith("your-");

    if (isSandbox) {
      refId = `SANDBOX-${Date.now().toString().slice(-8)}`;
    } else {
      const response = await fetch(`${getZarinpalApi()}/verify.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          merchant_id: process.env.ZARINPAL_MERCHANT_ID,
          amount: toRial(amount),
          authority,
        }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);
      const remoteRef = result?.data?.ref_id;

      if (!response.ok || ![100, 101].includes(Number(result?.data?.code)) || !remoteRef) {
        console.error("ZarinPal verify failed:", result);
        await updatePayment(orderNumber, { paymentStatus: "failed" }).catch(() => undefined);
        return redirectTo(`/payment/verify?status=failed&orderNumber=${encodeURIComponent(orderNumber)}`);
      }
      refId = String(remoteRef);
    }

    await updatePayment(orderNumber, { paymentStatus: "paid", refId: String(refId) });
    if (!order.postexParcelNo) {
      try {
        const tipaxResult = await registerTipaxOrder(order as Record<string, unknown>);
        await updateTipaxShipment(orderNumber, {
          barcode: tipaxResult.barcode,
          orderNo: tipaxResult.orderNo,
          trackingCode: tipaxResult.trackingCode,
          trackingStatus: tipaxResult.status,
        });
      } catch (shippingError) {
        console.error("Automatic Tipax registration after payment failed:", shippingError);
      }
    }

    return redirectTo(
      `/order/success/${encodeURIComponent(orderNumber)}?status=paid&refId=${encodeURIComponent(String(refId))}`
    );
  } catch (error) {
    console.error("ZarinPal verify error:", error);
    return redirectTo(`/payment/verify?status=failed&orderNumber=${encodeURIComponent(orderNumber)}`);
  }
}
