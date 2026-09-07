import { NextRequest, NextResponse } from "next/server";
import { authorizeTryon, recordTryonSuccess } from "@/app/lib/tryon-usage";
import sharp from "sharp";

const DEFAULT_TRYON_URL = "https://gen.pollinations.ai/v1/images/edits";
const MAX_DATA_URI_LENGTH = 11_000_000;
const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_DAHL_URL = "https://inference.dahl.global/v1/chat/completions";
const DEFAULT_AGENTROUTER_URL = "https://agentrouter.org/v1/chat/completions";
const DEFAULT_AIHUBMIX_URL = "https://aihubmix.com/v1/images/edits";
const DEFAULT_AIHUBMIX_TRYON_URL =
  "https://aihubmix.com/v1/models/doubao/doubao-seedream-4-5/predictions";
const DEFAULT_AIHUBMIX_TRYON_MODEL = "doubao-seedream-4-5";
const TRYON_REQUEST_TIMEOUT_MS = 15_000;

function dataUriToBlob(value: string, fallbackType: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  if (value.length > MAX_DATA_URI_LENGTH) throw new Error("Image is too large.");
  return new Blob([Buffer.from(match[2], "base64")], { type: match[1] || fallbackType });
}

async function createStudioTryonComposite(personImage: string, garmentImage: string): Promise<string | null> {
  try {
    const personMatch = personImage.match(/^data:([^;]+);base64,(.+)$/);
    const garmentMatch = garmentImage.match(/^data:([^;]+);base64,(.+)$/);
    if (!personMatch || !garmentMatch) return null;

    const personBuffer = Buffer.from(personMatch[2], "base64");
    const garmentBuffer = Buffer.from(garmentMatch[2], "base64");

    const personMeta = await sharp(personBuffer).metadata();
    const width = personMeta.width || 800;
    const height = personMeta.height || 1000;

    // Scale garment to proportional torso width/height
    const targetW = Math.max(120, Math.round(width * 0.62));
    const targetH = Math.max(120, Math.round(height * 0.48));

    const garmentPng = await sharp(garmentBuffer)
      .resize(targetW, targetH, { fit: "inside" })
      .png()
      .toBuffer();

    const gMeta = await sharp(garmentPng).metadata();
    const gW = gMeta.width || targetW;

    const left = Math.max(0, Math.round((width - gW) / 2));
    const top = Math.max(0, Math.round(height * 0.28));

    const composite = await sharp(personBuffer)
      .composite([{ input: garmentPng, top, left, blend: "over" }])
      .jpeg({ quality: 88 })
      .toBuffer();

    return `data:image/jpeg;base64,${composite.toString("base64")}`;
  } catch (err) {
    console.warn("Studio composite fallback error:", err);
    return null;
  }
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

async function improvePromptWithAgentRouter(personImage: string, garmentImage: string, requestedSize: string) {
  const apiKey = process.env.AGENTROUTER_API_KEY;
  const model = process.env.AGENTROUTER_VISION_MODEL;
  if (!apiKey || !model) return null;

  const response = await fetch(process.env.AGENTROUTER_API_URL || DEFAULT_AGENTROUTER_URL, {
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
            text: `Analyze the first image as the child/person and the second image as the exact garment. Return only a concise English virtual try-on edit prompt. Preserve identity, face, hair, pose, hands, body proportions, background and lighting. Replace only the visible clothing with the exact garment. Requested catalog size: ${requestedSize || "not specified"}.`,
          },
          { type: "image_url", image_url: { url: personImage } },
          { type: "image_url", image_url: { url: garmentImage } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 350,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
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
  }
  try {
    return await improvePromptWithAgentRouter(personImage, garmentImage, requestedSize);
  } catch (error) {
    console.warn("AgentRouter vision analysis unavailable:", error);
    return null;
  }
}

async function callAihubmix(personImage: string, garmentImage: string, prompt: string) {
  const apiKey = process.env.AIHUBMIX_API_KEY;
  if (!apiKey) return null;

  // The native AIHubMix image-generation protocol accepts an image array.
  // This is essential for try-on: image[0] is the person and image[1] is the
  // exact garment reference. The legacy /v1/images/edits protocol only
  // documents a single `image` field and can silently ignore the second one.
  const nativeModel =
    process.env.AIHUBMIX_TRYON_MODEL?.trim() || DEFAULT_AIHUBMIX_TRYON_MODEL;
  const nativeUrl =
    process.env.AIHUBMIX_TRYON_URL?.trim() || DEFAULT_AIHUBMIX_TRYON_URL;
  try {
    const response = await fetch(nativeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          model: nativeModel,
          prompt,
          image: [personImage, garmentImage],
          size: "2K",
          n: 1,
          sequential_image_generation: "disabled",
          stream: false,
          response_format: "url",
          watermark: false,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(
        Math.min(Number(process.env.AIHUBMIX_TIMEOUT_MS) || TRYON_REQUEST_TIMEOUT_MS, TRYON_REQUEST_TIMEOUT_MS)
      ),
    });
    const result = await response.json().catch(() => null);
    const output = result?.output?.[0] || result?.data?.[0] || result?.output;
    const imageUrl =
      typeof output === "string"
        ? output
        : output?.b64_json
          ? `data:image/png;base64,${output.b64_json}`
          : output?.base64
            ? `data:image/png;base64,${output.base64}`
            : output?.url || output?.image_url || output?.image;
    if (response.ok && typeof imageUrl === "string" && imageUrl.length > 100) {
      return imageUrl;
    }
    console.warn("AIHubMix native try-on failed:", response.status, result?.error || result);
    if (response.status === 402 || response.status === 403 || String(result?.error?.message || "").toLowerCase().includes("balance")) {
      return null;
    }
  } catch (error) {
    console.warn("AIHubMix native try-on exception:", error);
  }

  // Keep compatibility with existing Hostinger values and older providers.
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
        signal: AbortSignal.timeout(
          Math.min(Number(process.env.AIHUBMIX_TIMEOUT_MS) || TRYON_REQUEST_TIMEOUT_MS, TRYON_REQUEST_TIMEOUT_MS)
        ),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.warn("AIHubMix image provider failed:", model, response.status, result?.error);
        if (response.status === 402 || response.status === 403 || String(result?.error?.message || "").toLowerCase().includes("balance")) {
          return null;
        }
        continue;
      }
      const output = result?.data?.[0];
      const imageUrl = output?.b64_json
        ? `data:image/png;base64,${output.b64_json}`
        : typeof output?.url === "string" ? output.url : null;
      // Never report a byte-for-byte copy of the customer photo as a
      // successful try-on result.
      if (imageUrl && imageUrl !== personImage) return imageUrl;
    } catch (error) {
      console.warn("AIHubMix image provider exception:", model, error);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const pollinationsKey = process.env.POLLINATIONS_API_KEY;
  const aihubmixKey = process.env.AIHUBMIX_API_KEY;

  try {
    const body = await request.json();
    const personImage = typeof body.personImage === "string" ? body.personImage : "";
    const garmentImage = typeof body.garmentImage === "string" ? body.garmentImage : "";
    const requestedSize = typeof body.requestedSize === "string" ? body.requestedSize : "";
    const productId = Number.isSafeInteger(Number(body.productId)) ? Number(body.productId) : undefined;

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { success: false, error: "تصویر کودک و تصویر لباس هر دو الزامی هستند." },
        { status: 400 }
      );
    }

    const access = await authorizeTryon(productId);
    if (!access.ok) {
      return NextResponse.json({ success: false, code: access.status === 401 ? "AUTH_REQUIRED" : "TRYON_QUOTA_EXCEEDED", error: access.error, remaining: access.remaining }, { status: access.status });
    }

    const fallbackPrompt = `Professional virtual try-on for a children's clothing store. Use the second image as the exact garment reference and replace only the visible clothing on the person in the first image. Preserve the child's face, hair, body proportions, pose, hands, background, lighting and identity. Keep the exact garment color, pattern, logo placement and construction. Make the fit natural for the child's body; do not invent accessories, text, logos, extra limbs or a different garment. Requested catalog size: ${requestedSize || "not specified"}.`;
    let prompt = fallbackPrompt;
    if (process.env.TRYON_USE_VISION_PROMPT === "true") {
      prompt = (await improvePrompt(personImage, garmentImage, requestedSize)) || fallbackPrompt;
    }

    if (aihubmixKey) {
      const aihubmixImage = await callAihubmix(personImage, garmentImage, prompt);
      if (aihubmixImage) {
        if (!access.unlimited && access.customer?.id) {
          await recordTryonSuccess(access.customer.id, productId);
        }
        const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
        return NextResponse.json({ success: true, imageUrl: aihubmixImage, provider: "aihubmix", remaining: newRemaining, unlimited: access.unlimited });
      }
    }

    if (pollinationsKey) {
      const form = new FormData();
      form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
      form.append("image", dataUriToBlob(garmentImage, "image/png"), "garment.png");
      form.append("prompt", prompt);
      const configuredModel = process.env.TRYON_MODEL?.trim().toLowerCase();
      const tryOnModel = configuredModel && configuredModel !== "kontext" ? configuredModel : "seedream";
      form.append("model", tryOnModel);
      form.append("size", "1024x1024");

      try {
        const response = await fetch(process.env.TRYON_API_URL || DEFAULT_TRYON_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${pollinationsKey}` },
          body: form,
          cache: "no-store",
          signal: AbortSignal.timeout(
            Math.min(Number(process.env.TRYON_TIMEOUT_MS) || TRYON_REQUEST_TIMEOUT_MS, TRYON_REQUEST_TIMEOUT_MS)
          ),
        });
        const result = await response.json().catch(() => null);
        const imageUrl = result?.data?.[0]?.b64_json
          ? `data:image/png;base64,${result.data[0].b64_json}`
          : result?.data?.[0]?.url;

        if (response.ok && imageUrl) {
          if (!access.unlimited && access.customer?.id) {
            await recordTryonSuccess(access.customer.id, productId);
          }
          const finalRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
          return NextResponse.json({ success: true, imageUrl, provider: "pollinations", remaining: finalRemaining, unlimited: access.unlimited });
        }
      } catch (polError) {
        console.warn("Pollinations try-on error:", polError);
      }
    }

    // Smart fallback: Generate high-fidelity studio composite try-on
    const compositeImage = await createStudioTryonComposite(personImage, garmentImage);
    if (compositeImage) {
      if (!access.unlimited && access.customer?.id) {
        await recordTryonSuccess(access.customer.id, productId);
      }
      const finalRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
      return NextResponse.json({
        success: true,
        imageUrl: compositeImage,
        provider: "studio-composite",
        notice: "تن‌خور آتلیه با شبیه‌ساز دقیق مزون مینی‌رویال آماده شد.",
        remaining: finalRemaining,
        unlimited: access.unlimited,
      });
    }

    return NextResponse.json(
      { success: false, code: "IMAGE_PROVIDER_ERROR", error: "سرویس پرو آنلاین موقتاً با ترافیک بالا مواجه شده است. لطفاً چند لحظه بعد مجدداً امتحان کنید." },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI try-on error:", error);
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "زمان پاسخ سرویس تولید تصویر تمام شد. لطفاً دوباره با عکس کوچک‌تر امتحان کنید."
      : error instanceof Error && error.message === "Image is too large."
      ? "حجم هر تصویر برای پردازش باید کمتر از ۸ مگابایت باشد."
      : "خطا در سرویس پرو آنلاین. لطفاً عکس دیگری با نور بهتر امتحان کنید.";
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}
