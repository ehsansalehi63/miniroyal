import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { mediaLimits, readImageSource, storeImageSource } from "@/app/lib/media-storage";

const EDIT_URL = process.env.TRYON_API_URL || "https://gen.pollinations.ai/v1/images/edits";
const DEFAULT_AIHUBMIX_URL = "https://aihubmix.com/v1/images/edits";

type ImageInput = { buffer: Buffer; mime: string };

async function callAihubmix(image: ImageInput, prompt: string) {
  const apiKey = process.env.AIHUBMIX_API_KEY;
  if (!apiKey) return null;
  const models = (process.env.AIHUBMIX_IMAGE_MODELS || process.env.AIHUBMIX_IMAGE_MODEL || "gpt-image-2-free")
    .split(",").map((model) => model.trim()).filter(Boolean);

  for (const model of models) {
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("image", new Blob([new Uint8Array(image.buffer)], { type: image.mime }), "product-image");
    form.append("n", "1");
    form.append("size", process.env.AIHUBMIX_IMAGE_SIZE || "1024x1024");
    form.append("quality", process.env.AIHUBMIX_IMAGE_QUALITY || "auto");
    form.append("output_format", "png");
    try {
      const response = await fetch(process.env.AIHUBMIX_IMAGE_URL || DEFAULT_AIHUBMIX_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        cache: "no-store",
        signal: AbortSignal.timeout(Math.min(Number(process.env.AIHUBMIX_TIMEOUT_MS) || 90_000, 90_000)),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.warn("AIHubMix product image edit failed:", model, response.status, result?.error);
        continue;
      }
      const output = result?.data?.[0];
      if (output?.b64_json) return `data:image/png;base64,${output.b64_json}`;
      if (typeof output?.url === "string") return output.url;
    } catch (error) {
      console.warn("AIHubMix product image edit exception:", model, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

function providerError(result: any, status: number) {
  if (typeof result?.error === "string") return result.error;
  if (typeof result?.error?.message === "string") return result.error.message;
  return `سرویس ویرایش تصویر پاسخ ${status} برگرداند.`;
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "products.write")) return NextResponse.json({ success: false, error: "دسترسی غیرمجاز" }, { status: 403 });

  const pollinationsKey = process.env.POLLINATIONS_API_KEY;
  const aihubmixKey = process.env.AIHUBMIX_API_KEY;
  if (!pollinationsKey && !aihubmixKey) return NextResponse.json({ success: false, error: "هیچ سرویس ویرایش تصویر روی هاست تنظیم نشده است." }, { status: 503 });

  try {
    const body = await request.json();
    const source = typeof body.image === "string" ? body.image : "";
    const userPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!source) return NextResponse.json({ success: false, error: "تصویر محصول ارسال نشده است." }, { status: 400 });

    const input = await readImageSource(source, request.url);
    if (input.buffer.length > mediaLimits.maxSourceBytes) return NextResponse.json({ success: false, error: "حجم تصویر باید کمتر از ۸ مگابایت باشد." }, { status: 400 });

    const prompt = `Edit this exact children's clothing product photo for a premium e-commerce catalog and virtual try-on reference. Preserve the garment's exact color, pattern, shape, seams, material and all real design details. Remove the person, mannequin, hanger, hands and clutter. Put the complete garment front-facing on a clean neutral light background with soft studio lighting, crisp silhouette, realistic fabric texture and no cast shadow. Do not invent a different garment, logo, text or accessories. ${userPrompt}`;
    const aihubmixImage = await callAihubmix(input, prompt);
    if (aihubmixImage) {
      const imageUrl = await storeImageSource(aihubmixImage, request.url);
      return NextResponse.json({ success: true, imageUrl, provider: "aihubmix" });
    }

    if (!pollinationsKey) return NextResponse.json({ success: false, code: "IMAGE_PROVIDER_UNAVAILABLE", error: "سرویس ویرایش AI در حال حاضر پاسخ قابل استفاده نمی‌دهد؛ تصویر اصلی حفظ شده است. ذخیره عادی محصول همچنان قابل انجام است." }, { status: 503 });

    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(input.buffer)], { type: input.mime }), "product-image");
    form.append("prompt", prompt);
    form.append("model", process.env.TRYON_MODEL || "kontext");
    form.append("size", "1024x1024");
    const response = await fetch(EDIT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${pollinationsKey}` },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(Math.min(Number(process.env.TRYON_TIMEOUT_MS) || 90_000, 90_000)),
    });
    const result = await response.json().catch(() => null);
    const output = result?.data?.[0];
    const imageSource = output?.b64_json ? `data:image/png;base64,${output.b64_json}` : typeof output?.url === "string" ? output.url : null;
    if (!response.ok || !imageSource) return NextResponse.json({ success: false, code: "IMAGE_PROVIDER_UNAVAILABLE", error: `${providerError(result, response.status)} تصویر اصلی حفظ شده است و ذخیره عادی محصول وابسته به AI نیست.` }, { status: 503 });

    const imageUrl = await storeImageSource(imageSource, request.url);
    return NextResponse.json({ success: true, imageUrl, provider: "pollinations" });
  } catch (error) {
    console.error("AI product image edit error:", error);
    const message = error instanceof Error && /timeout|abort/i.test(error.message)
      ? "ویرایش تصویر بیشتر از زمان مجاز طول کشید؛ تصویر اصلی حفظ شد و می‌توانید دوباره تلاش کنید."
      : error instanceof Error ? error.message : "ویرایش تصویر محصول انجام نشد.";
    return NextResponse.json({ success: false, code: "IMAGE_PROVIDER_UNAVAILABLE", error: `${message} تصویر اصلی حفظ شده است و ذخیره عادی محصول وابسته به AI نیست.` }, { status: 503 });
  }
}
