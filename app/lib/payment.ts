import { createHmac, timingSafeEqual } from "crypto";

export const ZARINPAL_LIVE_API = "https://payment.zarinpal.com/pg/v4/payment";
export const ZARINPAL_LIVE_START = "https://www.zarinpal.com/pg/StartPay";

export function getSiteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function toRial(amountInToman: number) {
  return Math.round(amountInToman * 10);
}

export function createPaymentState(orderNumber: string, amount: number) {
  const secret = process.env.PAYMENT_STATE_SECRET;
  if (!secret) throw new Error("PAYMENT_STATE_SECRET is not configured.");
  return createHmac("sha256", secret).update(`${orderNumber}:${amount}`).digest("hex");
}

export function isValidPaymentState(orderNumber: string, amount: number, state: string) {
  try {
    const expected = Buffer.from(createPaymentState(orderNumber, amount), "utf8");
    const received = Buffer.from(state, "utf8");
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
