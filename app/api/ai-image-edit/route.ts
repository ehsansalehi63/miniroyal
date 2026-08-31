import { NextRequest, NextResponse } from "next/server";

const EDIT_URL = process.env.TRYON_API_URL || "https://gen.pollinations.ai/v1/images/edits";
const MAX_DATA_URI_LENGTH = 11_000_000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "کلید POLLINATIONS_API_KEY روی هاست تنظیم نشده است." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const image = typeof body.image === "string" ? body.image : "";
    const userPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!image || !image.startsWith("data:")) {
      return NextResponse.json({ success: false, error: "تصویر محصول معتبر نیست." }, { status: 400 });
    }
    if (image.length > MAX_DATA_URI_LENGTH) {
      return NextResponse.json({ success: false, error: "حجم تصویر باید کمتر از ۸ مگابایت باشد." }, { status: 400 });
    }

    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data.");

    const form = new FormData();
    form.append("image", new Blob([Buffer.from(match[2], "base64")], { type: match[1] }), "product.jpg");
    form.append(
      "prompt",
      `Edit this exact children's clothing product photo for a premium e-commerce catalog and virtual try-on reference. Preserve the garment's exact color, pattern, shape, seams, material and all real design details. Remove the person, mannequin, hanger, hands and clutter. Put the complete garment front-facing on a clean neutral light background with soft studio lighting, crisp silhouette, realistic fabric texture and no cast shadow. Do not invent a different garment, logo, text or accessories. ${userPrompt}`
    );
    form.append("model", process.env.TRYON_MODEL || "kontext");
    form.append("size", "1024x1024");

    const response = await fetch(EDIT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    const imageUrl = result?.data?.[0]?.b64_json
      ? `data:image/png;base64,${result.data[0].b64_json}`
      : result?.data?.[0]?.url;
    if (!response.ok || !imageUrl) {
      const providerMessage = typeof result?.error === "string"
        ? result.error
        : typeof result?.error?.message === "string" ? result.error.message : "";
      return NextResponse.json(
        { success: false, error: providerMessage || `سرویس ویرایش تصویر پاسخ ${response.status} برگرداند.` },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("AI product image edit error:", error);
    return NextResponse.json(
      { success: false, error: "ویرایش تصویر محصول انجام نشد. لطفاً عکس واضح‌تری امتحان کنید." },
      { status: 500 }
    );
  }
}
