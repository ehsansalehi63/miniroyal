/**
 * نرخ محلی روش‌های ارسال (تومان).
 *
 * پستکس در پنل خودش قیمت را برمی‌گرداند، ولی برای تیپاکس/پست/پیک نرخ ثابت فروشگاه
 * استفاده می‌شود. پیش از این هر سه گزینه در صفحهٔ تسویه یک مبلغ یکسان نشان می‌دادند
 * (اغلب «رایگان») که هم گمراه‌کننده بود و هم با فاکتور نهایی نمی‌خواند.
 *
 * مقادیر با متغیرهای محیطی قابل تنظیم‌اند تا برای تغییر تعرفه نیازی به تغییر کد نباشد.
 */
export type ShippingProviderId = "postex" | "tipax" | "post" | "peyk";

function tariff(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

export const LOCAL_SHIPPING_TARIFFS: Record<Exclude<ShippingProviderId, "postex">, number> = {
  tipax: tariff(process.env.NEXT_PUBLIC_SHIPPING_TARIFF_TIPAX, 65000),
  post: tariff(process.env.NEXT_PUBLIC_SHIPPING_TARIFF_POST, 45000),
  peyk: tariff(process.env.NEXT_PUBLIC_SHIPPING_TARIFF_PEYK, 90000),
};
