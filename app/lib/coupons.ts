/**
 * تعریف مشترک کدهای تخفیف و هزینهٔ ارسال.
 *
 * تا پیش از این کدهای تخفیف فقط داخل استور سبد خرید (سمت مرورگر) تعریف شده بودند و
 * سرور هنگام ثبت سفارش همیشه `discount = 0` می‌گذاشت. نتیجه:
 *   • مبلغ نهایی ذخیره‌شده در دیتابیس با مبلغی که مشتری در سبد/تسویه دیده بود فرق داشت،
 *   • و چون `/api/payment/request` مبلغ ارسالی مرورگر را با مبلغ سفارش مقایسه می‌کند،
 *     هر سفارشِ دارای کد تخفیف با پیام «سفارش معتبر یا قابل پرداخت نیست» رد می‌شد.
 * این ماژول هیچ وابستگی به دیتابیس یا مرورگر ندارد تا هر دو طرف از یک منبع بخوانند.
 */
export interface Coupon {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number; // درصد (۱۰) یا مبلغ ثابت به تومان (۵۰۰۰۰)
  minOrderAmount: number;
  maxDiscount?: number | null;
}

export const BUILT_IN_COUPONS: Coupon[] = [
  { code: "MINI10", discountType: "percent", discountValue: 10, minOrderAmount: 200000 },
  { code: "ROYAL50", discountType: "fixed", discountValue: 50000, minOrderAmount: 400000 },
  { code: "WELCOME", discountType: "percent", discountValue: 15, minOrderAmount: 0 },
];

export function normalizeCouponCode(code: unknown) {
  return String(code ?? "").trim().toUpperCase();
}

export function findBuiltInCoupon(code: unknown): Coupon | null {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return BUILT_IN_COUPONS.find((coupon) => coupon.code === normalized) || null;
}

/** مبلغ تخفیف؛ اگر سفارش به حداقل مبلغ کد نرسیده باشد صفر برمی‌گردد. */
export function calculateCouponDiscount(coupon: Coupon | null, subtotal: number) {
  if (!coupon || subtotal < coupon.minOrderAmount) return 0;
  const raw = coupon.discountType === "percent"
    ? Math.round((subtotal * coupon.discountValue) / 100)
    : coupon.discountValue;
  const capped = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.max(0, Math.min(subtotal, capped));
}

/** آستانهٔ ارسال رایگان و کرایهٔ پیش‌فرض؛ سبد، تسویه و ثبت سفارش باید یکی باشند. */
export const FREE_SHIPPING_THRESHOLD = 500000;
export const DEFAULT_SHIPPING_COST = 45000;

export function baseShippingCost(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
}

/** سقف منطقی برای کرایهٔ استعلام‌شده تا مقدار نامعتبر از سمت مرورگر پذیرفته نشود. */
export const MAX_ACCEPTED_SHIPPING_COST = 3_000_000;

export function resolveShippingCost(subtotal: number, quotedCost?: number | null) {
  if (
    typeof quotedCost === "number" &&
    Number.isSafeInteger(quotedCost) &&
    quotedCost >= 0 &&
    quotedCost <= MAX_ACCEPTED_SHIPPING_COST
  ) {
    return quotedCost;
  }
  return baseShippingCost(subtotal);
}
