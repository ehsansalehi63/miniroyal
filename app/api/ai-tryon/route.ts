import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TRYON_URL = "https://gen.pollinations.ai/v1/images/edits";
const MAX_DATA_URI_LENGTH = 11_000_000;
const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_DAHL_URL = "https://inference.dahl.global/v1/chat/completions";
const DEFAULT_AIHUBMIX_URL = "https://aihubmix.com/v1/images/edits";

function dataUriToBlob(value: string, fallbackType: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  if (value.length > MAX_DATA_URI_LENGTH) throw new Error("Image is too large.");
  return new Blob([Buffer.from(match[2], "base64")], { type: match[1] || fallbackType });
}

async function improvePromptWithOpenRouter(personImage: string, garmentImage: string, requestedSize: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(process.env.OPENROUTER_API_URL || DEFAULT_OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "https://miniroyal.shop",
      "X-Title": "MiniRoyal Virtual Try-On",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_VISION_MODEL || "openrouter/free",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze the first image as the child/person and the second image as the exact garment. Return only a concise English image-edit prompt for a virtual try-on. Preserve identity, face, hair, pose, hands, body proportions, background and lighting. Replace only visible clothing with the exact garment, including color, pattern, seams and logos. Do not invent accessories or text. Requested catalog size: ${requestedSize || "not specified"}.`,
          },
          { type: "image_url", image_url: { url: personImage } },
          { type: "image_url", image_url: { url: garmentImage } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 350,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const result = await response.json().catch(() => null);
  const prompt = result?.choices?.[0]?.message?.content;
  return typeof prompt === "string" && prompt.trim() ? prompt.trim().slice(0, 1800) : null;
}

async function improvePromptWithDahl(personImage: string, garmentImage: string, requestedSize: string) {
  const apiKey = process.env.DAHL_API_KEY;
  const model = process.env.DAHL_VISION_MODEL;
  if (!apiKey || !model) return null;

  const response = await fetch(process.env.DAHL_API_URL || DEFAULT_DAHL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze the first image as the child/person and the second image as the exact garment. Return only a concise English image-edit prompt for a children's virtual try-on. Preserve identity, face, hair, pose, hands, body proportions, background and lighting. Replace only visible clothing with the exact garment, including color, pattern, seams and logos. Do not invent accessories or text. Requested catalog size: ${requestedSize || "not specified"}.`,
          },
          { type: "image_url", image_url: { url: personImage } },
          { type: "image_url", image_url: { url: garmentImage } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 350,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const result = await response.json().catch(() => null);
  const prompt = result?.choices?.[0]?.message?.content;
  return typeof prompt === "string" && prompt.trim() ? prompt.trim().slice(0, 1800) : null;
}

async function improvePrompt(personImage: string, garmentImage: string, requestedSize: string) {
  try {
    const dahlPrompt = await improvePromptWithDahl(personImage, garmentImage, requestedSize);
    if (dahlPrompt) return dahlPrompt;
  } catch (error) {
    console.warn("Dahl vision analysis unavailable:", error);
  }
  try {
    return await improvePromptWithOpenRouter(personImage, garmentImage, requestedSize);
  } catch (error) {
    console.warn("OpenRouter vision analysis unavailable:", error);
    return null;
  }
}

async function callAihubmix(personImage: string, garmentImage: string, prompt: string) {
  const apiKey = process.env.AIHUBMIX_API_KEY;
  if (!apiKey) return null;
  const models = (process.env.AIHUBMIX_IMAGE_MODELS ||
    "gemini-3.1-flash-image-preview-free,gpt-image-2-free")
    .split(",").map((model) => model.trim()).filter(Boolean);
  for (const model of models) {
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
    form.append("image", dataUriToBlob(garmentImage, "image/png"), "garment.png");
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
        signal: AbortSignal.timeout(Number(process.env.AIHUBMIX_TIMEOUT_MS) || 120000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.warn("AIHubMix image provider failed:", model, response.status, result?.error);
        continue;
      }
      const output = result?.data?.[0];
      const imageUrl = output?.b64_json
        ? `data:image/png;base64,${output.b64_json}`
        : typeof output?.url === "string" ? output.url : null;
      if (imageUrl) return imageUrl;
    } catch (error) {
      console.warn("AIHubMix image provider exception:", model, error);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const pollinationsKey = process.env.POLLINATIONS_API_KEY;
  const aihubmixKey = process.env.AIHUBMIX_API_KEY;
  if (!pollinationsKey && !aihubmixKey) {
    return NextResponse.json(
      { success: false, code: "MISSING_PROVIDER_KEY", error: "کلید POLLINATIONS_API_KEY روی هاست تنظیم نشده است. تحلیل عکس انجام می‌شود، اما تولید تصویر نهایی بدون موتور تصویر ممکن نیست." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const personImage = typeof body.personImage === "string" ? body.personImage : "";
    const garmentImage = typeof body.garmentImage === "string" ? body.garmentImage : "";
    const requestedSize = typeof body.requestedSize === "string" ? body.requestedSize : "";

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { success: false, error: "تصویر کودک و تصویر لباس هر دو الزامی هستند." },
        { status: 400 }
      );
    }

    const fallbackPrompt = `Professional virtual try-on for a children's clothing store. Use the second image as the exact garment reference and replace only the visible clothing on the person in the first image. Preserve the child's face, hair, body proportions, pose, hands, background, lighting and identity. Keep the exact garment color, pattern, logo placement and construction. Make the fit natural for the child's body; do not invent accessories, text, logos, extra limbs or a different garment. Requested catalog size: ${requestedSize || "not specified"}.`;
    let prompt = fallbackPrompt;
    prompt = (await improvePrompt(personImage, garmentImage, requestedSize)) || fallbackPrompt;

    const aihubmixImage = await callAihubmix(personImage, garmentImage, prompt);
    if (aihubmixImage) {
      return NextResponse.json({ success: true, imageUrl: aihubmixImage, provider: "aihubmix" });
    }

    const form = new FormData();
    form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
    form.append("image", dataUriToBlob(garmentImage, "image/png"), "garment.png");
    form.append("prompt", prompt);
    form.append("model", process.env.TRYON_MODEL || "kontext");
    form.append("size", "1024x1024");

    if (!pollinationsKey) {
      return NextResponse.json(
        { success: false, code: "IMAGE_PROVIDER_ERROR", error: "AIHubMix پاسخ تصویر قابل استفاده برنگرداند." },
        { status: 502 }
      );
    }
    const response = await fetch(process.env.TRYON_API_URL || DEFAULT_TRYON_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${pollinationsKey}` },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.TRYON_TIMEOUT_MS) || 120000),
    });
    const result = await response.json().catch(() => null);
    const imageUrl = result?.data?.[0]?.b64_json
      ? `data:image/png;base64,${result.data[0].b64_json}`
      : result?.data?.[0]?.url;

    if (!response.ok || !imageUrl) {
      const providerMessage =
        typeof result?.error === "string"
          ? result.error
          : typeof result?.error?.message === "string"
            ? result.error.message
            : "";
      return NextResponse.json(
        { success: false, code: "IMAGE_PROVIDER_ERROR", error: providerMessage || `سرویس AI پاسخ ${response.status} برگرداند.` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("AI try-on error:", error);
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "زمان پاسخ سرویس تولید تصویر تمام شد. لطفاً دوباره با عکس کوچک‌تر امتحان کنید."
      : error instanceof Error && error.message === "Image is too large."
      ? "حجم هر تصویر برای پردازش باید کمتر از ۸ مگابایت باشد."
      : "خطا در سرویس پرو آنلاین. لطفاً عکس دیگری با نور بهتر امتحان کنید.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
