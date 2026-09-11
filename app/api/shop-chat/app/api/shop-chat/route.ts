import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/app/lib/catalog";

type ChatProduct = {
  title: string;
  slug: string;
  image: string;
  price: number;
  sizes: string[];
  stock: number;
  category: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

function productView(product: Awaited<ReturnType<typeof getProducts>>["products"][number]): ChatProduct {
  const available = product.variants.filter((variant) => variant.stock > 0);
  return {
    title: product.title,
    slug: product.slug,
    image: product.images[0] || "/images/hero-poster.webp",
    price: product.salePrice ?? product.basePrice,
    sizes: [...new Set(available.map((variant) => variant.size))],
    stock: available.reduce((sum, variant) => sum + variant.stock, 0),
    category: product.categoryName,
  };
}

function recommend(products: Awaited<ReturnType<typeof getProducts>>["products"], query: string) {
  const q = normalize(query);
  const terms = q.split(/\s+/).filter((term) => term.length > 1);
  return products
    .filter((product) => product.status === "active" && product.images.length > 0 && product.variants.some((v) => v.stock > 0))
    .map((product) => {
      const haystack = normalize([product.title, product.categoryName, product.categorySlug, product.shortDesc, product.description, ...(product.features || [])].join(" "));
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? (product.title.includes(term) ? 5 : 2) : 0), 0);
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.product.isFeatured) - Number(a.product.isFeatured) || b.product.ratingAvg - a.product.ratingAvg)
    .slice(0, 4)
    .map(({ product }) => productView(product));
}

async function askTextModel(question: string, products: ChatProduct[]) {
  const key = (process.env.OPENROUTER_API_KEY || process.env.AGENTROUTER_API_KEY || process.env.DAHL_API_KEY || "").trim();
  if (!key) return null;
  const url = process.env.OPENROUTER_API_KEY
    ? (process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions")
    : process.env.AGENTROUTER_API_KEY
      ? (process.env.AGENTROUTER_API_URL || "https://agentrouter.org/v1/chat/completions")
      : (process.env.DAHL_API_URL || "https://inference.dahl.global/v1/chat/completions");
  const model = process.env.CHAT_MODEL || process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";
  const catalog = products.map((product) => `${product.title} | ${product.category} | ${product.price} تومان | سایزهای موجود: ${product.sizes.join(", ") || "نامشخص"} | /product/${product.slug}`).join("\n");
  const prompt = `تو مشاور تخصصی پوشاک کودک و نوجوان فروشگاه مینی رویال هستی. فقط از محصولات فهرست زیر پیشنهاد بده و هرگز محصول، قیمت، موجودی یا سایزی را اختراع نکن. پاسخ را فارسی، کوتاه و کاربردی بده. اگر کاربر درباره سایز پرسید، برای دقت بیشتر قد، وزن، سن و دور سینه کودک را درخواست کن و او را به پرو آنلاین هدایت کن. اگر محصول مناسب نبود، صادقانه بگو و پیشنهاد کن با کارشناس واتساپ صحبت کند.\n\nمحصولات واقعی موجود:\n${catalog}\n\nسؤال کاربر: ${question}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, max_tokens: 500, messages: [{ role: "system", content: prompt }, { role: "user", content: question }] }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const json = await response.json().catch(() => null);
    const text = json?.choices?.[0]?.message?.content;
    return response.ok && typeof text === "string" ? text.trim() : null;
  } catch (error) {
    console.warn("Shop chat AI unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

function fallbackReply(question: string, products: ChatProduct[]) {
  const q = normalize(question);
  if (/سایز|قد|وزن|سن|دور سینه|اندازه/.test(q)) {
    return "برای پیشنهاد سایز دقیق، قد، وزن، سن و اگر دارید دور سینه کودک را بفرستید. همچنین می‌توانید از صفحه «پرو آنلاین» عکس کودک را وارد کنید تا پیشنهاد سایز هر محصول بر اساس جدول همان لباس محاسبه شود.";
  }
  if (/واتساپ|کارشناس|پشتیبان|مشاور|تماس/.test(q)) {
    return "حتماً؛ برای بررسی انسانی موجودی، جنس و سایز، از دکمه ارتباط با کارشناس در همین چت استفاده کنید.";
  }
  if (!products.length) return "در حال حاضر محصول موجود و مناسب با این درخواست پیدا نکردم. برای بررسی دقیق‌تر با کارشناس فروش در واتساپ صحبت کنید.";
  return `برای شروع، این گزینه‌های موجود را پیشنهاد می‌کنم: ${products.map((product) => product.title).join("، ")}. برای سایز دقیق، مشخصات کودک را هم بفرستید.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 800) : "";
    if (!question) return NextResponse.json({ success: false, error: "سؤال خالی است." }, { status: 400 });
    const catalog = await getProducts({ sort: "recommended", limit: 1000 });
    const products = recommend(catalog.products, question);
    const answer = (await askTextModel(question, products)) || fallbackReply(question, products);
    const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
    const whatsappText = `سلام، برای انتخاب لباس کودک راهنمایی می‌خواهم. سؤال من: ${question}`;
    return NextResponse.json({
      success: true,
      answer,
      products,
      whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}` : null,
    });
  } catch (error) {
    console.error("Shop chat failed:", error);
    return NextResponse.json({ success: false, error: "ارتباط با مشاور فروشگاه موقتاً برقرار نشد." }, { status: 500 });
  }
}
