import { NextRequest, NextResponse } from "next/server";
import { authorizeTryon, recordTryonSuccess } from "@/app/lib/tryon-usage";
import { getProductById } from "@/app/lib/catalog";

/**
 * MiniRoyal Online Try-On — STRICT EDIT-ONLY POLICY
 * --------------------------------------------------
 * The ONLY acceptable result is a new photorealistic AI image created by
 * combining the customer's own photo (person) with the exact product photo
 * (garment/accessory) worn on the body:
 *
 *   1. The child's face, hair, skin, body, pose, background and lighting
 *      must remain the customer's real photo — never an invented person.
 *   2. The product must remain exactly the uploaded catalog item —
 *      color, pattern, seams, logos and accessories unchanged.
 *
 * Therefore every provider below is an IMAGE-EDIT / VTON endpoint that
 * receives BOTH photos as inputs. There is no text-to-image path anywhere
 * in this file, and if the AI connection fails the API returns an explicit
 * error (success:false) — it never falls back to a local composite, sticker
 * overlay or any self-invented generated picture.
 */

const DEFAULT_TRYON_URL = "https://gen.pollinations.ai/v1/images/edits";
const MAX_DATA_URI_LENGTH = 11_000_000;
const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_DAHL_URL = "https://inference.dahl.global/v1/chat/completions";
const DEFAULT_AGENTROUTER_URL = "https://agentrouter.org/v1/chat/completions";
const DEFAULT_AIHUBMIX_URL = "https://aihubmix.com/v1/images/edits";
const DEFAULT_AIHUBMIX_TRYON_URL =
  "https://aihubmix.com/v1/models/doubao/doubao-seedream-4-5/predictions";
const DEFAULT_AIHUBMIX_TRYON_MODEL = "doubao-seedream-4-5";
const EDIT_MODEL_TIMEOUT_MS = 120_000;

type TryonKind = "garment" | "accessory";

function dataUriToBlob(value: string, fallbackType: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  if (value.length > MAX_DATA_URI_LENGTH) throw new Error("Image is too large.");
  return new Blob([Buffer.from(match[2], "base64")], { type: match[1] || fallbackType });
}

/**
 * Guard applied to EVERY provider result before it is shown to the customer.
 * A result is accepted only if it is a usable image reference and it is not a
 * byte-for-byte echo of the inputs (which would mean the model ignored the
 * product or did nothing at all).
 */
function isValidTryonResult(
  imageUrl: unknown,
  personImage: string,
  garmentImage: string
): imageUrl is string {
  if (typeof imageUrl !== "string" || imageUrl.length < 100) return false;
  const isHttp = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
  const isDataUri = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(imageUrl);
  if (!isHttp && !isDataUri) return false;
  if (imageUrl === personImage || imageUrl === garmentImage) return false;
  return true;
}

/** Strict edit-only prompt: dress the real child from photo #1 in the exact item from photo #2. */
function buildTryonPrompt(requestedSize: string, kind: TryonKind) {
  const sizeNote = requestedSize ? `Requested catalog size: ${requestedSize}.` : "";
  if (kind === "accessory") {
    return `Photorealistic image EDIT task. You are given exactly two images. Image 1 is a real photo of a child. Image 2 is the exact accessory product (hat, bag, shoes, socks, gloves, scarf or similar). Edit image 1 by placing the EXACT accessory from image 2 on the child in the physically correct spot (e.g. hat on the head, bag in the hand or on the shoulder, shoes on the feet). Keep the accessory's exact color, pattern, material, shape, straps and logos from image 2 — do not redesign it. Keep the child's face, identity, hair, skin tone, body, pose, existing clothes, background and lighting from image 1 completely unchanged. Do NOT generate a new or different child, do NOT invent people, text, watermarks or extra objects. The output must look like one seamless realistic photograph of the same child wearing that exact accessory. ${sizeNote}`;
  }
  return `Photorealistic image EDIT task. You are given exactly two images. Image 1 is a real photo of a child. Image 2 is the exact garment product from our catalog. Edit image 1 by replacing ONLY the visible clothing on the child's body with the EXACT garment from image 2, fitted naturally to the child's body and pose as if the child is really wearing it. Keep the garment's exact color, pattern, fabric texture, seams, cut and logo placement from image 2 — do not redesign it. Keep the child's face, identity, hair, skin tone, hands, body proportions, pose, background and lighting from image 1 completely unchanged. Do NOT generate a new or different child, do NOT invent people, accessories, text, watermarks, extra limbs or a different garment. The output must look like one seamless realistic photograph of the same child wearing that exact garment. ${sizeNote}`;
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
            text: `Analyze the first image as the child/person and the second image as the exact garment or accessory. Return only a concise English image-EDIT prompt for a virtual try-on that edits the first photo. Preserve identity, face, hair, pose, hands, body proportions, background and lighting of the child in the first photo. Put the exact item from the second photo on the child, including its color, pattern, seams and logos. Never describe generating a new person. Requested catalog size: ${requestedSize || "not specified"}.`,
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
            text: `Analyze the first image as the child/person and the second image as the exact garment or accessory. Return only a concise English image-EDIT prompt for a children's virtual try-on that edits the first photo. Preserve identity, face, hair, pose, hands, body proportions, background and lighting of the child in the first photo. Put the exact item from the second photo on the child, including its color, pattern, seams and logos. Never describe generating a new person. Requested catalog size: ${requestedSize || "not specified"}.`,
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
            text: `Analyze the first image as the child/person and the second image as the exact garment or accessory. Return only a concise English image-EDIT prompt for a virtual try-on that edits the first photo. Preserve identity, face, hair, pose, hands, body proportions, background and lighting of the child. Put the exact item from the second photo on the child. Never describe generating a new person. Requested catalog size: ${requestedSize || "not specified"}.`,
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
  // exact product reference. The legacy /v1/images/edits protocol only
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
        Math.min(Number(process.env.AIHUBMIX_TIMEOUT_MS) || EDIT_MODEL_TIMEOUT_MS, EDIT_MODEL_TIMEOUT_MS)
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
    if (response.ok && isValidTryonResult(imageUrl, personImage, garmentImage)) {
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
          Math.min(Number(process.env.AIHUBMIX_TIMEOUT_MS) || EDIT_MODEL_TIMEOUT_MS, EDIT_MODEL_TIMEOUT_MS)
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
      // Never report a byte-for-byte copy of an input photo as a
      // successful try-on result.
      if (isValidTryonResult(imageUrl, personImage, garmentImage)) return imageUrl;
    } catch (error) {
      console.warn("AIHubMix image provider exception:", model, error);
    }
  }
  return null;
}

// Upload image to Replicate Files API to prevent 413 Payload Too Large
async function uploadToReplicateFiles(dataUriOrUrl: string, token: string): Promise<string> {
  if (dataUriOrUrl.startsWith("http://") || dataUriOrUrl.startsWith("https://")) {
    return dataUriOrUrl;
  }
  const match = dataUriOrUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUriOrUrl;

  try {
    const mimeType = match[1] || "image/jpeg";
    const buffer = Buffer.from(match[2], "base64");
    const formData = new FormData();
    formData.append("content", new Blob([buffer], { type: mimeType }), "image.jpg");

    const uploadRes = await fetch("https://api.replicate.com/v1/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    if (uploadRes.ok) {
      const json = await uploadRes.json();
      const fileUrl = json.urls?.get || json.url;
      if (typeof fileUrl === "string" && fileUrl.startsWith("http")) {
        return fileUrl;
      }
    }
  } catch (err) {
    console.warn("Replicate file upload error, falling back to original data:", err);
  }
  return dataUriOrUrl;
}

// Replicate IDM-VTON Native Virtual Try-On Integration (garments only)
async function callReplicateIdmVton(personImage: string, garmentImage: string, category = "upper_body"): Promise<string | null> {
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
    // 1. Upload base64 images to Replicate hosted storage to prevent 413 Payload Too Large
    const [humanImg, garmImg] = await Promise.all([
      uploadToReplicateFiles(personImage, token),
      uploadToReplicateFiles(garmentImage, token),
    ]);

    const validCategory = category === "dresses" || category === "lower_body" ? category : "upper_body";
    const inputPayload = {
      human_img: humanImg,
      garm_img: garmImg,
      category: validCategory,
      crop: false,
      steps: 30,
    };

    // 2. Try official model endpoint first
    let createRes = await fetch("https://api.replicate.com/v1/models/cuuupid/idm-vton/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({ input: inputPayload }),
      signal: AbortSignal.timeout(70000),
    });

    if (!createRes.ok && createRes.status !== 422) {
      // Fallback to standard predictions endpoint with known version hash
      createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          version: "c3565f104948f25da6675a40b953d03822180879646b9a528e5784ea731518f9",
          input: inputPayload,
        }),
        signal: AbortSignal.timeout(70000),
      });
    }

    if (!createRes.ok) {
      // Fallback to older version hash
      createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
          input: inputPayload,
        }),
        signal: AbortSignal.timeout(70000),
      });
    }

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "");
      console.warn("Replicate creation failed:", createRes.status, errText);
      return null;
    }

    let prediction = await createRes.json();
    if (prediction.status === "succeeded") {
      const output = prediction.output;
      if (typeof output === "string" && output.startsWith("http")) return output;
      if (Array.isArray(output) && typeof output[0] === "string" && output[0].startsWith("http")) return output[0];
    }

    const startTime = Date.now();
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
      if (Date.now() - startTime > 75000) break;
      await new Promise((r) => setTimeout(r, 2500));
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

// Segmind IDM-VTON (garments only)
async function callSegmindIdmVton(personImage: string, garmentImage: string, category = "upper_body"): Promise<string | null> {
  const segmindKey = process.env.SEGMIND_API_KEY;
  if (!segmindKey) return null;

  try {
    const validCategory = category === "dresses" || category === "lower_body" ? category : "upper_body";
    const res = await fetch("https://api.segmind.com/v1/idm-vton", {
      method: "POST",
      headers: {
        "x-api-key": segmindKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        human_img: personImage,
        garm_img: garmentImage,
        category: validCategory,
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

function getReplicateToken() {
  return (
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY ||
    process.env.REPLICATEKEY ||
    process.env.REPLICATE
  )?.trim();
}

export async function POST(request: NextRequest) {
  const replicateToken = getReplicateToken();
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
        { success: false, error: "تصویر کودک و تصویر محصول هر دو الزامی هستند." },
        { status: 400 }
      );
    }

    const access = await authorizeTryon(productId);
    if (!access.ok) {
      return NextResponse.json({ success: false, code: access.status === 401 ? "AUTH_REQUIRED" : "TRYON_QUOTA_EXCEEDED", error: access.error, remaining: access.remaining }, { status: access.status });
    }

    // Classify the product so the right edit path is used:
    // - garments (top/bottom/dress) can use dedicated IDM-VTON models
    // - accessories (hat, bag, shoes, ...) must use the general image-edit
    //   models with an accessory prompt, because IDM-VTON only fits clothes.
    let tryonCategory = "upper_body";
    let tryonKind: TryonKind = "garment";
    if (body.category === "dresses" || body.category === "lower_body" || body.category === "upper_body") {
      tryonCategory = body.category;
    }
    if (body.kind === "accessory") {
      tryonKind = "accessory";
    }
    if (productId) {
      try {
        const p = await getProductById(productId);
        if (p) {
          if (p.tryOnAsset?.layerType === "accessory") {
            tryonKind = "accessory";
          }
          const text = `${p.title} ${p.categoryName || ""} ${p.categorySlug || ""}`.toLowerCase();
          if (!body.category && tryonKind === "garment") {
            if (/پیراهن|سارافون|سرهمی|مجلسی|dress|jumpsuit|overall/.test(text)) {
              tryonCategory = "dresses";
            } else if (/شلوار|دامن|شلوارک|pant|skirt|short/.test(text)) {
              tryonCategory = "lower_body";
            }
          }
          if (
            tryonKind === "garment" &&
            // A product is only treated as an accessory when its title/category
            // has no clothing keyword at all (e.g. "ست سرهمی و کلاه" stays a
            // garment because سرهمی is clothing).
            !/پیراهن|سارافون|سرهمی|مجلسی|شلوار|دامن|تیشرت|بلوز|کاپشن|هودی|کت|ژاکت|لباس|ست |dress|jumpsuit|overall|pant|skirt|shirt|hoodie|jacket|coat/.test(text) &&
            /کلاه|کیف|کفش|جوراب|دستکش|شال|روسری|کمربند|پاپیون|اکسسوری|hat|cap\b|bag|shoe|sock|glove|scarf|belt|accessor/.test(text)
          ) {
            tryonKind = "accessory";
          }
        }
      } catch {
        // Keep defaults (upper_body garment)
      }
    }

    // Build the strict edit-only prompt for the general edit models.
    let prompt = buildTryonPrompt(requestedSize, tryonKind);
    if (process.env.TRYON_USE_VISION_PROMPT === "true") {
      prompt = (await improvePrompt(personImage, garmentImage, requestedSize)) || prompt;
    }

    // Shared success responder: validates the AI output, records quota and
    // returns the photorealistic edit result.
    const respondWithResult = async (imageUrl: unknown, provider: string) => {
      if (!isValidTryonResult(imageUrl, personImage, garmentImage)) return null;
      if (!access.unlimited && access.customer?.id) {
        await recordTryonSuccess(access.customer.id, productId);
      }
      const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
      return NextResponse.json({
        success: true,
        imageUrl,
        provider,
        remaining: newRemaining,
        unlimited: access.unlimited,
      });
    };

    // 1. Replicate IDM-VTON — world-standard virtual try-on. Edits the real
    //    child photo and fits the exact garment onto the body (garments only).
    if (replicateToken && tryonKind === "garment") {
      const replicateImage = await callReplicateIdmVton(personImage, garmentImage, tryonCategory);
      const response = await respondWithResult(replicateImage, "replicate-idm-vton");
      if (response) return response;
    }

    // 2. Segmind IDM-VTON — same edit-only VTON model (garments only).
    if (segmindKey && tryonKind === "garment") {
      const segmindImage = await callSegmindIdmVton(personImage, garmentImage, tryonCategory);
      const response = await respondWithResult(segmindImage, "segmind-idm-vton");
      if (response) return response;
    }

    // 3. AIHubMix — edit models that receive BOTH photos (person + product)
    //    and edit the person photo. Works for garments and accessories.
    if (aihubmixKey) {
      const aihubmixImage = await callAihubmix(personImage, garmentImage, prompt);
      const response = await respondWithResult(aihubmixImage, "aihubmix");
      if (response) return response;
    }

    // 4. Neural image-EDITING via Pollinations /v1/images/edits. Only
    //    edit-capable models that actually read both input images are
    //    allowed; text-to-image models (flux schnell etc.) ignore the photos
    //    and invent a different child — the exact bug users reported. If
    //    TRYON_MODEL is unset or a known text-to-image value, the verified
    //    free edit models are used instead.
    if (pollinationsKey) {
      const configuredModel = process.env.TRYON_MODEL?.trim();
      const isEditCapable = (model: string) =>
        model.includes("z-image-turbo") ||
        model.includes("kontext") ||
        model.includes("mai-image") ||
        model.includes("gpt-image") ||
        (model.includes("seedream") && !model.includes("flux"));
      const candidateModels = [
        ...(configuredModel && isEditCapable(configuredModel.toLowerCase()) ? [configuredModel] : []),
        "tongyi-mai/z-image-turbo",
        "black-forest-labs/flux.1-kontext-pro",
        "microsoft/mai-image-2.5-flash",
      ].filter((model, index, all) => all.indexOf(model) === index);

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
              Math.min(Number(process.env.TRYON_TIMEOUT_MS) || EDIT_MODEL_TIMEOUT_MS, EDIT_MODEL_TIMEOUT_MS)
            ),
          });
          const result = await response.json().catch(() => null);
          const rawB64 = result?.data?.[0]?.b64_json;
          const rawUrl = result?.data?.[0]?.url;
          const imageUrl = rawB64
            ? (rawB64.startsWith("data:") ? rawB64 : `data:image/jpeg;base64,${rawB64}`)
            : (typeof rawUrl === "string" && rawUrl.startsWith("http") ? rawUrl : null);

          if (response.ok) {
            const successResponse = await respondWithResult(imageUrl, `pollinations-${tryOnModel}`);
            if (successResponse) return successResponse;
            if (imageUrl) {
              // The provider answered but echoed an input or returned junk —
              // never show that to the customer, try the next model.
              console.warn(`Pollinations try-on ${tryOnModel} returned an unusable echo of the inputs; skipping.`);
            }
          }
          // 402/403/404 on one model → try the next candidate.
          console.warn(`Pollinations try-on ${tryOnModel} failed:`, response.status, result?.error || "");
        } catch (polError) {
          console.warn(`Pollinations try-on error with ${tryOnModel}:`, polError);
        }
      }
    }

    // ✋ STRICT POLICY: if the AI connection could not be established with ANY
    // edit provider, we return an explicit failure. There is deliberately NO
    // local composite, NO sticker overlay and NO self-generated image here —
    // the customer must only ever see a real AI edit of their own photo with
    // the exact product, or a clear honest error. Quota is NOT consumed.
    console.error(
      "AI try-on unavailable: every edit provider failed.",
      JSON.stringify({
        replicate: Boolean(replicateToken),
        segmind: Boolean(segmindKey),
        aihubmix: Boolean(aihubmixKey),
        pollinations: Boolean(pollinationsKey),
        kind: tryonKind,
      })
    );
    return NextResponse.json(
      {
        success: false,
        code: "AI_TRYON_UNAVAILABLE",
        error:
          "اتصال به سرویس هوش مصنوعی پرو آنلاین در حال حاضر برقرار نشد و هیچ تصویری تولید نشد. ما فقط عکس واقعی کودک شما را با همان محصول ترکیب می‌کنیم و هرگز عکس جایگزین یا ساختگی نمایش نمی‌دهیم. لطفاً لحظاتی دیگر دوباره تلاش کنید.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI try-on error:", error);
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "زمان پاسخ سرویس هوش مصنوعی تمام شد و تصویری تولید نشد. لطفاً دوباره با عکس کوچک‌تر امتحان کنید."
      : error instanceof Error && error.message === "Image is too large."
      ? "حجم هر تصویر برای پردازش باید کمتر از ۸ مگابایت باشد."
      : "خطا در اتصال به سرویس هوش مصنوعی پرو آنلاین؛ هیچ تصویری تولید نشد. لطفاً دوباره تلاش کنید.";
    return NextResponse.json({ success: false, code: "AI_TRYON_UNAVAILABLE", error: message }, { status: 200 });
  }
}
