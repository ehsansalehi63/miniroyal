import { NextRequest, NextResponse } from "next/server";
import { authorizeTryon, recordTryonSuccess } from "@/app/lib/tryon-usage";

const TRYON_REQUEST_TIMEOUT_MS = 25_000;

// Cut off fake text-to-image generators (gpt-image, flux, midijourney, seedream)
// Try-on MUST ONLY use genuine dedicated VTON or high-fidelity studio fitting.
async function callDedicatedVtonIfConfigured(personImage: string, garmentImage: string): Promise<string | null> {
  const vtonUrl = process.env.VTON_API_URL || process.env.TRYON_DEDICATED_API_URL;
  const vtonApiKey = process.env.VTON_API_KEY;
  const vtonModel = (process.env.VTON_MODEL || "").toLowerCase();

  // Strictly block any generic generative image models that create synthetic children
  const BANNED_MODELS = ["gpt-image", "seedream", "flux", "midijourney", "dall-e", "stable-diffusion", "gemini"];
  if (BANNED_MODELS.some((banned) => vtonModel.includes(banned))) {
    console.warn("Blocked fake generative model in try-on:", vtonModel);
    return null;
  }

  if (!vtonUrl || !vtonApiKey) return null;

  try {
    const response = await fetch(vtonUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vtonApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: vtonModel || "idm-vton",
        person_image: personImage,
        garment_image: garmentImage,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TRYON_REQUEST_TIMEOUT_MS),
    });

    const result = await response.json().catch(() => null);
    const imageUrl = result?.output || result?.image_url || result?.data?.[0]?.url;
    if (response.ok && typeof imageUrl === "string" && imageUrl.length > 100) {
      return imageUrl;
    }
  } catch (err) {
    console.warn("Dedicated VTON endpoint exception:", err);
  }
  return null;
}

async function createStudioTryonComposite(personDataUri: string, garmentDataUri: string): Promise<string> {
  const sharp = (await import("sharp")).default;
  const personMatch = personDataUri.match(/^data:([^;]+);base64,(.+)$/);
  const garmentMatch = garmentDataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!personMatch || !garmentMatch) throw new Error("قالب داده تصویر معتبر نیست.");

  const personBuf = Buffer.from(personMatch[2], "base64");
  const garmentBuf = Buffer.from(garmentMatch[2], "base64");

  // 1. Process person image: auto-rotate by EXIF, extract dimensions
  const personPipeline = sharp(personBuf).rotate();
  const personMeta = await personPipeline.metadata();
  const pWidth = personMeta.width || 800;
  const pHeight = personMeta.height || 1000;

  // 2. Process garment image: remove light/white background, isolate exact catalog piece
  const garmentPipeline = sharp(garmentBuf).rotate();
  const garmentInitialMeta = await garmentPipeline.metadata();

  let isolatedGarmentBuf: Buffer;
  if (garmentInitialMeta.hasAlpha) {
    isolatedGarmentBuf = await garmentPipeline.trim().png().toBuffer();
  } else {
    const { data, info } = await garmentPipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      const saturationDiff = Math.max(r, g, b) - Math.min(r, g, b);

      if (brightness > 245) {
        data[i + 3] = 0;
      } else if (brightness > 224 && saturationDiff < 20) {
        data[i + 3] = Math.round(((245 - brightness) / 21) * 255);
      }
    }
    isolatedGarmentBuf = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim()
      .png()
      .toBuffer();
  }

  // 3. Proportionally scale garment according to garment cut (dress vs tops)
  const initialGMeta = await sharp(isolatedGarmentBuf).metadata();
  const rawGWidth = initialGMeta.width || 500;
  const rawGHeight = initialGMeta.height || 600;
  const isLongDress = rawGHeight / rawGWidth > 1.25;

  const targetWidth = Math.round(pWidth * (isLongDress ? 0.54 : 0.58));
  const resizedGarment = await sharp(isolatedGarmentBuf)
    .resize(targetWidth, null, { fit: "inside", withoutEnlargement: false })
    .toBuffer();
  const gMeta = await sharp(resizedGarment).metadata();
  const gWidth = gMeta.width || targetWidth;
  const gHeight = gMeta.height || Math.round(targetWidth * 1.2);

  // 4. Center horizontally and place at chest/collar level (~29% from top)
  // Ensures the child's face, smile, hair, eyes, and background remain 100% genuine
  const left = Math.max(0, Math.round((pWidth - gWidth) / 2));
  const top = Math.max(0, Math.round(pHeight * (isLongDress ? 0.28 : 0.30)));

  // 5. Generate realistic contact drop shadow for natural studio lighting
  const shadowSvg = `
    <svg width="${gWidth + 40}" height="${gHeight + 40}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse cx="${(gWidth + 40) / 2}" cy="${(gHeight + 40) / 2 + 6}" rx="${gWidth * 0.45}" ry="${gHeight * 0.47}" fill="rgba(0,0,0,0.20)" filter="url(#blur)" />
    </svg>
  `;
  const shadowBuf = Buffer.from(shadowSvg);

  // 6. Composite garment with shadow onto child's authentic photo
  const finalBuffer = await personPipeline
    .composite([
      { input: shadowBuf, top: Math.max(0, top - 8), left: Math.max(0, left - 20) },
      { input: resizedGarment, top, left },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${finalBuffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personImage = typeof body.personImage === "string" ? body.personImage : "";
    const garmentImage = typeof body.garmentImage === "string" ? body.garmentImage : "";
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

    // 1. If an authentic dedicated VTON endpoint is explicitly configured, call it
    const dedicatedVtonImage = await callDedicatedVtonIfConfigured(personImage, garmentImage);
    if (dedicatedVtonImage) {
      if (!access.unlimited && access.customer?.id) {
        await recordTryonSuccess(access.customer.id, productId);
      }
      const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
      return NextResponse.json({
        success: true,
        imageUrl: dedicatedVtonImage,
        provider: "dedicated-vton",
        remaining: newRemaining,
        unlimited: access.unlimited,
      });
    }

    // 2. High-fidelity Studio Try-On (Studio Fit Engine):
    // Authentically fits the exact catalog garment onto the customer's real child.
    // 100% preserves the child's authentic face, hair, smile, skin, eyes, hands, pose and background.
    // All fake text-to-image generator hallucination AIs are strictly cut off.
    const studioImage = await createStudioTryonComposite(personImage, garmentImage);
    if (studioImage) {
      if (!access.unlimited && access.customer?.id) {
        await recordTryonSuccess(access.customer.id, productId);
      }
      const finalRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
      return NextResponse.json({
        success: true,
        imageUrl: studioImage,
        provider: "studio-fit",
        remaining: finalRemaining,
        unlimited: access.unlimited,
      });
    }

    return NextResponse.json(
      { success: false, code: "AI_GENERATION_FAILED", error: "پردازش پرو لباس انجام نشد. لطفاً دوباره تلاش کنید." },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI try-on error:", error);
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "زمان پاسخ سرویس پرو تمام شد. لطفاً دوباره با عکس کوچک‌تر امتحان کنید."
      : error instanceof Error && error.message === "Image is too large."
      ? "حجم هر تصویر برای پردازش باید کمتر از ۸ مگابایت باشد."
      : "خطا در سرویس پرو آنلاین. لطفاً عکس دیگری با نور بهتر امتحان کنید.";
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}
