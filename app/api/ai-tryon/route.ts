import { NextRequest, NextResponse } from "next/server";
import { authorizeTryon, recordTryonSuccess } from "@/app/lib/tryon-usage";
import { getProductById } from "@/app/lib/catalog";

/**
 * MiniRoyal Online Try-On — STRICT EDIT-ONLY + IDENTITY-VERIFIED POLICY
 * ---------------------------------------------------------------------
 * The ONLY acceptable result is a new photorealistic AI image created by
 * combining the customer's own photo (person) with the exact product photo
 * (garment/accessory) worn on the body:
 *
 *   1. The child's face, hair, skin, body, pose, background and lighting
 *      must remain the customer's real photo — never an invented person.
 *   2. The product must remain exactly the uploaded catalog item.
 *
 * Two hard guarantees are enforced in code:
 *
 *   A. ONLY edit-capable models are ever called. Text-to-image generators
 *      (z-image-turbo, flux.1-schnell, turbo, ideogram, ...) IGNORE the two
 *      photos and invent a different child — they are blacklisted by name
 *      and verified against Pollinations' live public model catalog
 *      (input_modalities must include "image"). The edits endpoint itself
 *      defaults to flux.1-schnell, so the model field is ALWAYS set
 *      explicitly here.
 *
 *   B. Every provider result passes an IDENTITY GUARD before it reaches the
 *      customer: the result image is downloaded and compared structurally
 *      against the customer's photo (region diffs, color-histogram
 *      correlation, and a normalized cross-correlation of the head zone).
 *      A model that returned an invented child/scene fails the guard and is
 *      treated as a failed provider. If every provider fails, the API
 *      answers with an honest error (success:false) — never a local
 *      composite, sticker overlay or self-invented picture, and quota is
 *      not consumed.
 */

const DEFAULT_TRYON_URL = "https://gen.pollinations.ai/v1/images/edits";
const POLLINATIONS_MODELS_URL = "https://gen.pollinations.ai/v1/models";
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

/**
 * Curated Pollinations edit models — verified against the live catalog
 * (GET https://gen.pollinations.ai/v1/models) on 2026-09-09:
 * each of these has input_modalities [text, image] → output image.
 * Ordered by identity-preservation quality for person+garment edits.
 */
const POLLINATIONS_EDIT_CANDIDATES = [
  "google/gemini-3.1-flash-image", // nanobanana-2: multi-image edit, excellent identity preservation
  "google/gemini-2.5-flash-image", // nanobanana: proven for try-on style edits
  "black-forest-labs/flux.1-kontext-pro", // instruction-based image editing
  "bytedance/seedream-4.5", // reference-image editing
  "openai/gpt-image-1-mini", // OpenAI edits, faithful but slower
];

/**
 * Model-name patterns that are TEXT-TO-IMAGE GENERATORS. They ignore input
 * photos and invent a different child — the exact bug customers reported.
 * Never call these through the try-on flow, even if TRYON_MODEL says so.
 */
const GENERATOR_MODEL_PATTERNS = [
  "z-image",
  "zimage",
  "schnell",
  "krea",
  "dreamshaper",
  "ideogram",
  "sdxl",
  "dall-e",
];

let modelCatalogCache: { at: number; editCapable: Set<string> } | null = null;

/** Pollinations' model catalog is public (no auth). Cache it for 1 hour. */
async function fetchEditCapableCatalog(): Promise<Set<string> | null> {
  if (modelCatalogCache && Date.now() - modelCatalogCache.at < 3_600_000) {
    return modelCatalogCache.editCapable;
  }
  try {
    const res = await fetch(POLLINATIONS_MODELS_URL, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return modelCatalogCache?.editCapable || null;
    const data = await res.json();
    const models = Array.isArray(data) ? data : data?.data || [];
    const set = new Set<string>();
    for (const m of models) {
      const id = String(m?.id || m?.name || "").toLowerCase();
      const input = Array.isArray(m?.input_modalities) ? m.input_modalities : [];
      const output = Array.isArray(m?.output_modalities) ? m.output_modalities : [];
      if (id && input.includes("image") && output.includes("image")) set.add(id);
    }
    if (set.size > 0) modelCatalogCache = { at: Date.now(), editCapable: set };
    return set.size > 0 ? set : modelCatalogCache?.editCapable || null;
  } catch (err) {
    console.warn("Pollinations model catalog unavailable:", err instanceof Error ? err.message : err);
    return modelCatalogCache?.editCapable || null;
  }
}

function isKnownGenerator(model: string) {
  const m = model.toLowerCase();
  return GENERATOR_MODEL_PATTERNS.some((p) => m.includes(p)) || /(^|[^a-z])turbo([^a-z]|$)/.test(m);
}

function staticEditCapable(model: string) {
  const m = model.toLowerCase();
  if (isKnownGenerator(m)) return false;
  return /kontext|nanobanana|gemini-[\d.]+.*image|gpt-image|seedream|qwen-image|mai-image|p-image-edit|wan-[\d.]+-image|nova-canvas|flux\.2/.test(m);
}

/** A model may only be used if it is NOT a known generator AND (per the live
 *  catalog when reachable) actually accepts image input. */
async function isEditCapableModel(model: string): Promise<boolean> {
  if (isKnownGenerator(model)) return false;
  const catalog = await fetchEditCapableCatalog();
  if (catalog) return catalog.has(model.toLowerCase());
  return staticEditCapable(model);
}

/** If curated candidates vanish from the catalog in the future, rebuild a
 *  candidate list from the live catalog, preferring known edit vendors. */
function candidatesFromCatalog(catalog: Set<string>): string[] {
  const ids = [...catalog];
  const pick = (re: RegExp) => ids.filter((id) => re.test(id)).slice(0, 3);
  return [
    ...pick(/^google\/gemini-[\d.]+-flash(-lite)?-image$/),
    ...pick(/^google\/gemini-[\d.]+-pro-image$/),
    ...pick(/kontext/),
    ...pick(/^bytedance\/seedream-[\d.]+$/),
    ...pick(/^openai\/gpt-image-[\d.]+(-mini)?$/),
  ];
}

function dataUriToBlob(value: string, fallbackType: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  if (value.length > MAX_DATA_URI_LENGTH) throw new Error("Image is too large.");
  return new Blob([Buffer.from(match[2], "base64")], { type: match[1] || fallbackType });
}

function decodeImageBuffer(imageUrl: string): Buffer | null {
  const match = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? Buffer.from(match[1], "base64") : null;
}

async function downloadImageBuffer(imageUrl: string): Promise<Buffer | null> {
  if (imageUrl.startsWith("data:")) return decodeImageBuffer(imageUrl);
  if (!imageUrl.startsWith("http")) return null;
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 && buf.length <= 20_000_000 ? buf : null;
  } catch {
    return null;
  }
}

/**
 * Guard #1 — basic sanity: a result is accepted only if it is a usable image
 * reference and not a byte-for-byte echo of the inputs.
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

type IdentityMetrics = { madAll: number; madTop: number; corr: number; nccTop: number };

/**
 * Guard #2 — the IDENTITY GUARD. Compares the provider result against the
 * customer's own photo:
 *  - madAll / madTop: mean absolute pixel difference (whole image / head zone)
 *  - corr: color-histogram correlation (same "color world"?)
 *  - nccTop: normalized cross-correlation of the head zone in grayscale —
 *    invariant to brightness drift but very sensitive to a different
 *    head/face position or shape, so an invented child on an identical
 *    plain background is still caught.
 * Thresholds were tuned with scripts/test/identity-experiment.mjs
 * (9/9 synthetic genuine-edit vs invented-child cases classified correctly).
 */
async function computeIdentityMetrics(personBuf: Buffer, resultBuf: Buffer): Promise<IdentityMetrics | null> {
  try {
    const sharp = (await import("sharp")).default;
    const GRID = 48;
    const loadRgb = (buf: Buffer) =>
      sharp(buf).rotate().resize(GRID, GRID, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const [A, B] = await Promise.all([loadRgb(personBuf), loadRgb(resultBuf)]);
    const n = GRID * GRID;
    let sumAll = 0;
    let sumTop = 0;
    let topCount = 0;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = (y * GRID + x) * 3;
        const d =
          (Math.abs(A.data[i] - B.data[i]) +
            Math.abs(A.data[i + 1] - B.data[i + 1]) +
            Math.abs(A.data[i + 2] - B.data[i + 2])) /
          3;
        sumAll += d;
        if (y < GRID * 0.28) {
          sumTop += d;
          topCount++;
        }
      }
    }
    const madAll = sumAll / n;
    const madTop = sumTop / Math.max(1, topCount);

    const bins = 8 * 8 * 8;
    const hA = new Float64Array(bins);
    const hB = new Float64Array(bins);
    const binIdx = (i: number, d: Buffer) => {
      const r = Math.min(7, d[i] >> 5);
      const g = Math.min(7, d[i + 1] >> 5);
      const b = Math.min(7, d[i + 2] >> 5);
      return (r * 8 + g) * 8 + b;
    };
    for (let p = 0; p < n; p++) {
      const i = p * 3;
      hA[binIdx(i, A.data)]++;
      hB[binIdx(i, B.data)]++;
    }
    const mean = (h: Float64Array) => h.reduce((s, v) => s + v, 0) / h.length;
    const mA = mean(hA);
    const mB = mean(hB);
    let num = 0;
    let dA = 0;
    let dB = 0;
    for (let k = 0; k < bins; k++) {
      num += (hA[k] - mA) * (hB[k] - mB);
      dA += (hA[k] - mA) ** 2;
      dB += (hB[k] - mB) ** 2;
    }
    const corr = dA && dB ? num / Math.sqrt(dA * dB) : 0;

    // Head-zone grayscale NCC on a finer grid.
    const HG = 64;
    const loadGray = (buf: Buffer) =>
      sharp(buf).rotate().resize(HG, HG, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const [gA, gB] = await Promise.all([loadGray(personBuf), loadGray(resultBuf)]);
    const rowsTop = Math.round(HG * 0.38);
    let sA = 0;
    let sB = 0;
    let cnt = 0;
    for (let y = 0; y < rowsTop; y++)
      for (let x = 0; x < HG; x++) {
        const i = y * HG + x;
        sA += gA.data[i];
        sB += gB.data[i];
        cnt++;
      }
    const muA = sA / cnt;
    const muB = sB / cnt;
    let nNum = 0;
    let nA = 0;
    let nB = 0;
    for (let y = 0; y < rowsTop; y++)
      for (let x = 0; x < HG; x++) {
        const i = y * HG + x;
        const da = gA.data[i] - muA;
        const db = gB.data[i] - muB;
        nNum += da * db;
        nA += da * da;
        nB += db * db;
      }
    const nccTop = nA && nB ? nNum / Math.sqrt(nA * nB) : 0;

    return {
      madAll: Math.round(madAll * 10) / 10,
      madTop: Math.round(madTop * 10) / 10,
      corr: Math.round(corr * 1000) / 1000,
      nccTop: Math.round(nccTop * 1000) / 1000,
    };
  } catch (err) {
    console.warn("Identity metrics computation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function looksGenuine(m: IdentityMetrics): boolean {
  const num = (env: string | undefined, fallback: number) => {
    const v = Number(env);
    return Number.isFinite(v) ? v : fallback;
  };
  const maxAll = num(process.env.TRYON_IDENTITY_MAX_DIFF, 40);
  const maxTop = num(process.env.TRYON_IDENTITY_MAX_HEAD_DIFF, 38);
  const minCorr = num(process.env.TRYON_IDENTITY_MIN_CORR, 0.45);
  const minNcc = num(process.env.TRYON_IDENTITY_MIN_NCC, 0.45);
  if (m.madTop > maxTop && m.madAll > maxAll) return false; // different head AND scene
  if (m.corr < minCorr && m.madAll > maxAll) return false; // completely different color world
  if (m.nccTop < minNcc) return false; // head structure does not match → invented child
  return true;
}

/** Full verification of a provider result. Unverifiable results are rejected
 *  (strict policy): better an honest error than an invented child. */
async function verifyIdentity(personImage: string, imageUrl: string, provider: string): Promise<boolean> {
  if (process.env.TRYON_IDENTITY_CHECK === "false") return true; // emergency kill-switch
  const personBuf = decodeImageBuffer(personImage);
  if (!personBuf) {
    console.warn(`[tryon-identity] ${provider}: person image undecodable; cannot verify.`);
    return false;
  }
  let resultBuf = await downloadImageBuffer(imageUrl);
  if (!resultBuf) resultBuf = await downloadImageBuffer(imageUrl); // one retry for transient URL errors
  if (!resultBuf) {
    console.warn(`[tryon-identity] ${provider}: result image undownloadable; cannot verify → rejected.`);
    return false;
  }
  const metrics = await computeIdentityMetrics(personBuf, resultBuf);
  if (!metrics) return false;
  const ok = looksGenuine(metrics);
  console.log(
    `[tryon-identity] provider=${provider} genuine=${ok} madAll=${metrics.madAll} madTop=${metrics.madTop} corr=${metrics.corr} nccTop=${metrics.nccTop}`
  );
  if (!ok) {
    console.warn(
      `[tryon-identity] REJECTED ${provider} result: not a faithful edit of the customer's photo (possible invented person).`
    );
  }
  return ok;
}

/** Choose an output size matching the customer photo's aspect ratio so the
 *  result keeps the original composition (and verifies reliably). */
async function personAspectSize(personImage: string): Promise<string> {
  try {
    const buf = decodeImageBuffer(personImage);
    if (!buf) return "1024x1024";
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buf).rotate().metadata();
    const w = meta.width || 1024;
    const h = meta.height || 1024;
    const scale = 1024 / Math.max(w, h);
    const rw = Math.max(256, Math.min(1024, Math.round((w * scale) / 16) * 16));
    const rh = Math.max(256, Math.min(1536, Math.round((h * scale) / 16) * 16));
    return `${rw}x${rh}`;
  } catch {
    return "1024x1024";
  }
}

/** Strict edit-only prompt: dress the real child from photo #1 in the exact item from photo #2. */
function buildTryonPrompt(requestedSize: string, kind: TryonKind) {
  const sizeNote = requestedSize ? `Requested catalog size: ${requestedSize}.` : "";
  if (kind === "accessory") {
    return `Photorealistic image EDIT task. You are given exactly two images. Image 1 is a real photo of a child. Image 2 is the exact accessory product (hat, bag, shoes, socks, gloves, scarf or similar). Edit image 1 by placing the EXACT accessory from image 2 on the child in the physically correct spot (e.g. hat on the head, bag in the hand or on the shoulder, shoes on the feet). Keep the accessory's exact color, pattern, material, shape, straps and logos from image 2 — do not redesign it. Keep the child's face, identity, hair, skin tone, body, pose, existing clothes, background and lighting from image 1 completely unchanged — the output must be the SAME photo as image 1, not a new rendering. Do NOT generate a new or different child, do NOT invent people, text, watermarks or extra objects. The output must look like one seamless realistic photograph of the same child wearing that exact accessory. ${sizeNote}`;
  }
  return `Photorealistic image EDIT task. You are given exactly two images. Image 1 is a real photo of a child. Image 2 is the exact garment product from our catalog. Edit image 1 by replacing ONLY the visible clothing on the child's body with the EXACT garment from image 2, fitted naturally to the child's body and pose as if the child is really wearing it. Keep the garment's exact color, pattern, fabric texture, seams, cut and logo placement from image 2 — do not redesign it. Keep the child's face, identity, hair, skin tone, hands, body proportions, pose, background and lighting from image 1 completely unchanged — the output must be the SAME photo as image 1, not a new rendering. Do NOT generate a new or different child, do NOT invent people, accessories, text, watermarks, extra limbs or a different garment. The output must look like one seamless realistic photograph of the same child wearing that exact garment. ${sizeNote}`;
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

  // The native AIHubMix protocol accepts an image array: image[0] is the
  // person photo and image[1] is the exact product reference.
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

  // Legacy /v1/images/edits compatibility (Hostinger values, older providers).
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
  const token = getReplicateToken();
  if (!token) return null;

  try {
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

    // Classify: garments can use dedicated IDM-VTON models; accessories must
    // use the general image-edit models with an accessory prompt.
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
            // Only treat as accessory when no clothing keyword exists at all
            // (e.g. "ست سرهمی و کلاه" stays a garment because سرهمی is clothing).
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

    // Output size matched to the customer photo's aspect ratio.
    const outputSize = await personAspectSize(personImage);

    // Shared success responder: validates the AI output (sanity + identity),
    // records quota and returns the photorealistic edit result.
    const respondWithResult = async (imageUrl: unknown, provider: string) => {
      if (!isValidTryonResult(imageUrl, personImage, garmentImage)) return null;
      const genuine = await verifyIdentity(personImage, imageUrl, provider);
      if (!genuine) return null;
      if (!access.unlimited && access.customer?.id) {
        await recordTryonSuccess(access.customer.id, productId);
      }
      const newRemaining = access.unlimited || access.remaining === null ? null : Math.max(0, access.remaining - 1);
      return NextResponse.json({
        success: true,
        imageUrl,
        provider,
        identityVerified: true,
        remaining: newRemaining,
        unlimited: access.unlimited,
      });
    };

    // 1. Replicate IDM-VTON — dedicated virtual try-on model. Edits the real
    //    child photo and fits the exact garment onto the body (garments only).
    if (replicateToken && tryonKind === "garment") {
      const replicateImage = await callReplicateIdmVton(personImage, garmentImage, tryonCategory);
      const response = await respondWithResult(replicateImage, "replicate-idm-vton");
      if (response) return response;
    }

    // 2. Segmind IDM-VTON — same dedicated edit-only VTON model (garments only).
    if (segmindKey && tryonKind === "garment") {
      const segmindImage = await callSegmindIdmVton(personImage, garmentImage, tryonCategory);
      const response = await respondWithResult(segmindImage, "segmind-idm-vton");
      if (response) return response;
    }

    // 3. AIHubMix — edit models that receive BOTH photos (person + product).
    //    Works for garments and accessories. Identity guard applies.
    if (aihubmixKey) {
      const aihubmixImage = await callAihubmix(personImage, garmentImage, prompt);
      const response = await respondWithResult(aihubmixImage, "aihubmix");
      if (response) return response;
    }

    // 4. Neural image-EDITING via Pollinations /v1/images/edits.
    //    Only models verified (via the public catalog) to accept image input
    //    are called. Text-to-image generators (z-image-turbo, flux schnell,
    //    turbo, ...) ignore the photos and invent a different child — they
    //    are blacklisted by name AND by catalog modality check. The model
    //    field is always set explicitly because the endpoint's own default
    //    (flux.1-schnell) is a generator.
    if (pollinationsKey) {
      const catalog = await fetchEditCapableCatalog();
      const configuredModel = process.env.TRYON_MODEL?.trim();
      const configuredOk = configuredModel ? await isEditCapableModel(configuredModel) : false;
      if (configuredModel && !configuredOk) {
        console.warn(
          `TRYON_MODEL="${configuredModel}" is a text-to-image generator or not image-input capable — skipped (it would invent a different child).`
        );
      }
      let curated = POLLINATIONS_EDIT_CANDIDATES;
      if (catalog) {
        const inCatalog = POLLINATIONS_EDIT_CANDIDATES.filter((m) => catalog.has(m.toLowerCase()));
        curated = inCatalog.length > 0 ? inCatalog : candidatesFromCatalog(catalog).slice(0, 5);
      }
      const candidateModels = [
        ...(configuredOk && configuredModel ? [configuredModel] : []),
        ...curated,
      ].filter((model, index, all) => all.indexOf(model) === index);

      for (const tryOnModel of candidateModels) {
        try {
          const form = new FormData();
          form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
          form.append("image", dataUriToBlob(garmentImage, "image/png"), "garment.png");
          form.append("prompt", prompt);
          form.append("model", tryOnModel);
          form.append("size", outputSize);
          form.append("response_format", "b64_json");

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

          if (response.ok && imageUrl) {
            const successResponse = await respondWithResult(imageUrl, `pollinations-${tryOnModel}`);
            if (successResponse) return successResponse;
            // Provider answered but the result failed sanity or the identity
            // guard (echo of an input / invented child) → next model.
            console.warn(`Pollinations ${tryOnModel} result rejected by verification; trying next model.`);
            continue;
          }
          // 402/403/404/5xx on one model → try the next candidate.
          console.warn(`Pollinations try-on ${tryOnModel} failed:`, response.status, result?.error || "");
        } catch (polError) {
          console.warn(`Pollinations try-on error with ${tryOnModel}:`, polError);
        }
      }
    }

    // ✋ STRICT POLICY: no local composite, no sticker overlay, no invented
    // image. If no edit provider returned a verified edit of the customer's
    // own photo, answer honestly. Quota is NOT consumed.
    console.error(
      "AI try-on unavailable: no provider returned a verified edit of the customer photo.",
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
