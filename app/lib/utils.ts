export function toPersianDigits(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function formatToman(amount: number): string {
  const formatted = amount.toLocaleString("fa-IR");
  return `${formatted} تومان`;
}

export function calculateDiscountPercent(basePrice: number, salePrice?: number): number {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}
