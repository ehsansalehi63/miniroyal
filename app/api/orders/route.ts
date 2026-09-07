import { NextRequest, NextResponse } from "next/server";
import { createOrder, findOrder } from "@/app/lib/orders";
import { getProductById } from "@/app/lib/catalog";

function codAllowedForCity(city: unknown) {
  const normalized = String(city || "").trim().replace(/ي/g, "ی").replace(/ك/g, "ک");
  const allowed = (process.env.COD_CITIES || "اصفهان").split(",").map((item) => item.trim().replace(/ي/g, "ی").replace(/ك/g, "ک")).filter(Boolean);
  return process.env.COD_ENABLED === "true" && allowed.some((item) => normalized === item);
}

function normalizeDigits(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = persianDigits.indexOf(char);
    if (persianIndex > -1) return String(persianIndex);
    return String(arabicDigits.indexOf(char));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.recipientName || !body.phone || !body.address || !body.postalCode ||
        !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, error: "اطلاعات سفارش کامل نیست." }, { status: 400 });
    }
    const phone = normalizeDigits(String(body.phone)).replace(/\D/g, "");
    const postalCode = normalizeDigits(String(body.postalCode)).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, error: "شماره موبایل معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(postalCode)) {
      return NextResponse.json({ success: false, error: "کد پستی باید ۱۰ رقم باشد." }, { status: 400 });
    }
    if (body.paymentMethod === "cod" && !codAllowedForCity(body.city)) {
      return NextResponse.json({ success: false, error: "پرداخت در محل فعلاً فقط برای اصفهان قابل استفاده است." }, { status: 400 });
    }
    const items = await Promise.all(body.items.map(async (item: unknown) => {
      const raw = item as { product?: { id?: unknown }; variant?: { id?: unknown }; quantity?: unknown };
      const product = await getProductById(Number(raw.product?.id));
      const variant = product?.variants.find((candidate: { id: number }) => candidate.id === Number(raw.variant?.id));
      const quantity = Number(raw.quantity);
      if (!product || !variant || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error("کالا یا تنوع سفارش معتبر نیست.");
      }
      return { product, variant, quantity };
    }));
    const result = await createOrder({
      ...body,
      phone,
      postalCode,
      items,
      subtotal: Number(body.subtotal),
      discount: Number(body.discount),
      shippingCost: Number(body.shippingCost),
      finalTotal: Number(body.finalTotal),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Create order failed:", error);
    return NextResponse.json({ success: false, error: "ثبت سفارش در دیتابیس انجام نشد." }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();
  if (!identifier) return NextResponse.json({ success: false, error: "شماره سفارش یا موبایل الزامی است." }, { status: 400 });
  try {
    const order = await findOrder(identifier);
    return NextResponse.json({ success: true, order: order ?? null });
  } catch (error) {
    console.error("Find order failed:", error);
    return NextResponse.json({ success: false, error: "دسترسی به سفارش‌ها ممکن نیست." }, { status: 503 });
  }
}
