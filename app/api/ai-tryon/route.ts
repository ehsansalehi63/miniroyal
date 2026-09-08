import { NextRequest, NextResponse } from "next/server";
import { authorizeTryon, recordTryonSuccess } from "@/app/lib/tryon-usage";

const DEFAULT_TRYON_URL = "https://gen.pollinations.ai/v1/images/edits";
const DEFAULT_POLLINATIONS_GEN_URL = "https://gen.pollinations.ai/v1/images/generations";
const MAX_DATA_URI_LENGTH = 11_000_000;
const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_DAHL_URL = "https://inference.dahl.global/v1/chat/completions";
const DEFAULT_AGENTROUTER_URL = "https://agentrouter.org/v1/chat/completions";
const DEFAULT_AIHUBMIX_URL = "https://aihubmix.com/v1/images/edits";
const DEFAULT_AIHUBMIX_TRYON_URL =
  "https://aihubmix.com/v1/models/doubao/doubao-seedream-4-5/predictions";
const DEFAULT_AIHUBMIX_TRYON_MODEL = "doubao-seedream-4-5";
const TRYON_REQUEST_TIMEOUT_MS = 25_000;

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

async function callReplicateIdmVton(personImage: string, garmentImage: string): Promise<string | null> {
  const token = (
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY ||
    process.env.REPLICATEKEY ||
    process.env.REPLICATE
  )?.trim();
  if (!token) return null;

  try {
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=40",
      },
      body: JSON.stringify({
        version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
        input: {
          human_img: personImage,
          garm_img: garmentImage,
          category: "upper_body",
          crop: false,
          steps: 30,
        },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "");
      console.warn("Replicate creation failed:", createRes.status, errText);
      return null;
    }

    let prediction = await createRes.json();
    const startTime = Date.now();

    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
      if (Date.now() - startTime > 45000) break;
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!pollRes.ok) break;
      prediction = await pollRes.json();
    }

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      if (typeof output === "string" && output.startsWith("http")) return output;
      if (Array.isArray(output) && typeof output[0] === "string" && output[0].startsWith("http")) return output[0];
    }
  } catch (err) {
    console.warn("Replicate try-on error:", err);
  }
  return null;
}

async function callSegmindIdmVton(personImage: string, garmentImage: string): Promise<string | null> {
  const segmindKey = process.env.SEGMIND_API_KEY;
  if (!segmindKey) return null;

  try {
    const res = await fetch("https://api.segmind.com/v1/idm-vton", {
      method: "POST",
      headers: {
        "x-api-key": segmindKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        human_img: personImage,
        garm_img: garmentImage,
        category: "upper_body",
        crop: false,
        steps: 30,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("Segmind call failed:", res.status, errText);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
      const buffer = await res.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64");
      return `data:${contentType};base64,${b64}`;
    }

    const json = await res.json().catch(() => null);
    if (json?.image) {
      return json.image.startsWith("data:") ? json.image : `data:image/jpeg;base64,${json.image}`;
    }
  } catch (err) {
    console.warn("Segmind try-on error:", err);
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

  // 1. Process person image: auto-rotate by EXIF, ensure dimensions
  const personPipeline = sharp(personBuf).rotate();
  const personMeta = await personPipeline.metadata();
  const pWidth = personMeta.width || 800;
  const pHeight = personMeta.height || 1000;

  // 2. Process garment image: remove light background if opaque, isolate dress
  const garmentPipeline = sharp(garmentBuf).rotate();
  const garmentInitialMeta = await garmentPipeline.metadata();

  let isolatedGarmentBuf: Buffer;
  if (garmentInitialMeta.hasAlpha) {
    isolatedGarmentBuf = await garmentPipeline.trim().png().toBuffer();
  } else {
    const { data, info } = await garmentPipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 246) {
        data[i + 3] = 0;
      } else if (brightness > 228) {
        data[i + 3] = Math.round(((246 - brightness) / 18) * 255);
      }
    }
    isolatedGarmentBuf = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim()
      .png()
      .toBuffer();
  }

  // 3. Proportionally scale garment to fit child's torso naturally (~58% of child's width)
  const targetWidth = Math.round(pWidth * 0.58);
  const resizedGarment = await sharp(isolatedGarmentBuf)
    .resize(targetWidth, null, { fit: "inside", withoutEnlargement: false })
    .toBuffer();
  const gMeta = await sharp(resizedGarment).metadata();
  const gWidth = gMeta.width || targetWidth;
  const gHeight = gMeta.height || Math.round(targetWidth * 1.2);

  // 4. Center horizontally and place at chest level (~28% from top) so face and head are completely visible
  const left = Math.max(0, Math.round((pWidth - gWidth) / 2));
  const top = Math.max(0, Math.round(pHeight * 0.28));

  // 5. Generate realistic contact drop shadow for studio lighting integration
  const shadowSvg = `
    <svg width="${gWidth + 40}" height="${gHeight + 40}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse cx="${(gWidth + 40) / 2}" cy="${(gHeight + 40) / 2 + 4}" rx="${gWidth * 0.44}" ry="${gHeight * 0.46}" fill="rgba(0,0,0,0.18)" filter="url(#blur)" />
    </svg>
  `;
  const shadowBuf = Buffer.from(shadowSvg);

  // 6. Composite garment with shadow onto child's authentic photo
  const finalBuffer = await personPipeline
    .composite([
      { input: shadowBuf, top: Math.max(0, top - 10), left: Math.max(0, left - 20) },
      { input: resizedGarment, top, left },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${finalBuffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  const replicateToken = (
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY ||
    process.env.REPLICATEKEY ||
    process.env.REPLICATE
  )?.trim();
  const segmindKey = process.env.SEGMIND_API_KEY;
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

    // 1. Replicate IDM-VTON (World standard virtual try-on, 100% preserves face and fits garment)
    if (replicateToken) {
      const replicateImage = await callReplicateIdmVton(personImage, garmentImage);
      if (replicateImage) {
        if (!access.unlimited && access.customer?.id) {
          await recordTryonSuccess(access.customer.id, productId);
        }
        const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
        return NextResponse.json({
          success: true,
          imageUrl: replicateImage,
          provider: "replicate-idm-vton",
          remaining: newRemaining,
          unlimited: access.unlimited,
        });
      }
    }

    // 2. Segmind IDM-VTON (100 free daily API calls)
    if (segmindKey) {
      const segmindImage = await callSegmindIdmVton(personImage, garmentImage);
      if (segmindImage) {
        if (!access.unlimited && access.customer?.id) {
          await recordTryonSuccess(access.customer.id, productId);
        }
        const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
        return NextResponse.json({
          success: true,
          imageUrl: segmindImage,
          provider: "segmind-idm-vton",
          remaining: newRemaining,
          unlimited: access.unlimited,
        });
      }
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
      // 1. Try multi-image neural edits with candidate models
      const configuredModel = process.env.TRYON_MODEL?.trim();
      const candidateModels = [
        ...(configuredModel && configuredModel !== "seedream" && configuredModel !== "kontext" ? [configuredModel] : []),
        "black-forest-labs/flux.1-schnell",
        "MarcosFRG/flux-1-schnell",
        "pollinations/midijourney",
      ];

      for (const tryOnModel of candidateModels) {
        try {
          const form = new FormData();
          form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
          form.append("image", dataUriToBlob(garmentImage, "image/png"), "garment.png");
          form.append("prompt", prompt);
          form.append("model", tryOnModel);
          form.append("size", "1024x1024");

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
          const rawB64 = result?.data?.[0]?.b64_json;
          const rawUrl = result?.data?.[0]?.url;
          const imageUrl = rawB64
            ? (rawB64.startsWith("data:") ? rawB64 : `data:image/jpeg;base64,${rawB64}`)
            : (typeof rawUrl === "string" && rawUrl.startsWith("http") ? rawUrl : null);

          if (response.ok && imageUrl) {
            if (!access.unlimited && access.customer?.id) {
              await recordTryonSuccess(access.customer.id, productId);
            }
            const finalRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
            return NextResponse.json({ success: true, imageUrl, provider: `pollinations-${tryOnModel}`, remaining: finalRemaining, unlimited: access.unlimited });
          }
          if (response.status === 402 || response.status === 403) {
            continue;
          }
        } catch (polError) {
          console.warn(`Pollinations try-on error with ${tryOnModel}:`, polError);
        }
      }

      // 2. High-fidelity Studio Try-On: Authentically fit the exact catalog garment onto the customer's real child
      try {
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
      } catch (studioError) {
        console.warn("Studio try-on composite error:", studioError);
      }
    }

    // Direct Studio Try-on Fallback (always preserves user's authentic child & product garment)
    try {
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
    } catch (directStudioError) {
      console.warn("Direct studio try-on error:", directStudioError);
    }

    return NextResponse.json(
      { success: false, code: "AI_GENERATION_FAILED", error: "سرویس پرو لباس در حال حاضر با ترافیک بالا مواجه است. لطفاً دوباره تلاش کنید." },
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
