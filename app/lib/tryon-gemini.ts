/**
 * MiniRoyal Try-On — FREE-FIRST provider: Google Gemini (AI Studio free tier).
 *
 * Gemini Developer API free tier needs no credit card, never expires and
 * (as of 2026) allows ~500 image requests/day for gemini-2.5-flash-image at
 * ~10 RPM. That makes it the ideal $0 first provider for a small shop:
 * normal days cost nothing, and if the free quota is ever exhausted the
 * try-on chain falls through to the paid providers (Replicate/AIHubMix/
 * Pollinations) automatically.
 *
 * Multiple keys (GEMINI_API_KEYS, comma-separated) are rotated on quota
 * errors to stretch the free capacity. Safety blocks stop rotation
 * immediately (they are content-based, not key-based).
 *
 * Pure fetch logic — no Next.js imports — so it is unit-testable with plain
 * node (see scripts/test/tryon-gemini-test.mjs).
 */

export type GeminiAttempt = { provider: string; status?: number; detail: string };

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 120_000;

export function geminiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/** Configured model first, then known image-output fallbacks (404 → next). */
export function geminiModels(): string[] {
  const configured = (process.env.GEMINI_IMAGE_MODEL || "").trim();
  return [...(configured ? [configured] : []), "gemini-2.5-flash-image", "gemini-3.1-flash-image"].filter(
    (m, i, all) => all.indexOf(m) === i
  );
}

function dataUriToInline(dataUri: string): { mimeType: string; data: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1] || "image/jpeg", data: match[2] };
}

function shortDetail(value: unknown, fallback: string): string {
  const text =
    typeof value === "string"
      ? value
      : typeof (value as { message?: unknown })?.message === "string"
        ? String((value as { message: string }).message)
        : "";
  return text.replace(/\s+/g, " ").trim().slice(0, 160) || fallback;
}

function isQuotaLike(status: number, message: string): boolean {
  if (status === 429) return true;
  return /quota|billing|limit|exhausted|resource_exhausted/i.test(message);
}

function isInvalidKey(status: number, message: string): boolean {
  return (
    (status === 400 || status === 403) &&
    /api[_ ]?key|api_key_invalid|key[_ ]?invalid|unauthori[sz]ed|forbidden|credential/i.test(message)
  );
}

const SAFETY_FINISH = new Set([
  "SAFETY",
  "IMAGE_SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
]);

type Parsed =
  | { kind: "image"; dataUri: string }
  | { kind: "safety"; detail: string }
  | { kind: "empty"; detail: string };

function parseGeminiResult(json: unknown): Parsed {
  const root = (json || {}) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };
  if (root.promptFeedback?.blockReason) {
    return { kind: "safety", detail: `prompt blocked (${root.promptFeedback.blockReason})` };
  }
  const candidate = root.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      return { kind: "image", dataUri: `data:${mime};base64,${part.inlineData.data}` };
    }
  }
  const finish = String(candidate?.finishReason || "");
  if (SAFETY_FINISH.has(finish)) {
    return { kind: "safety", detail: `safety-blocked (finishReason ${finish})` };
  }
  const textPart = parts.find((p) => typeof p?.text === "string" && p.text.trim())?.text;
  return {
    kind: "empty",
    detail: shortDetail(textPart, finish ? `no image returned (finishReason ${finish})` : "no image returned"),
  };
}

export async function callGeminiTryon(
  personImage: string,
  garmentImage: string,
  prompt: string,
  attempts: GeminiAttempt[] = [],
  opts: { baseUrl?: string; timeoutMs?: number } = {}
): Promise<string | null> {
  const keys = geminiKeys();
  if (keys.length === 0) return null;
  const person = dataUriToInline(personImage);
  const garment = dataUriToInline(garmentImage);
  if (!person || !garment) {
    attempts.push({ provider: "gemini-free", detail: "invalid input images" });
    return null;
  }

  const baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const timeoutMs = opts.timeoutMs || REQUEST_TIMEOUT_MS;
  const keyNote = keys.length > 1 ? " (key rotation enabled)" : "";

  for (const model of geminiModels()) {
    for (let ki = 0; ki < keys.length; ki++) {
      const label = `gemini-${model}`;
      try {
        const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": keys[ki],
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: person.mimeType, data: person.data } },
                  { inlineData: { mimeType: garment.mimeType, data: garment.data } },
                ],
              },
            ],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            // Fully-clothed catalog try-on photos must not trip the generic
            // filters; child-safety protections (if any) stay enforced
            // server-side regardless of these thresholds.
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ],
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(timeoutMs),
        });
        const json = await response.json().catch(() => null);
        if (response.ok) {
          const parsed = parseGeminiResult(json);
          if (parsed.kind === "image") return parsed.dataUri;
          attempts.push({ provider: label, status: response.status, detail: parsed.detail });
          if (parsed.kind === "safety") return null; // content-based: other keys won't help
          continue; // empty: try next key, then next model
        }
        const errMsg = shortDetail(
          (json as { error?: unknown } | null)?.error,
          `request failed (${response.status})`
        );
        if (response.status === 404) {
          attempts.push({ provider: label, status: response.status, detail: errMsg });
          break; // unknown model id: try the next model, not the next key
        }
        if (isQuotaLike(response.status, errMsg) || isInvalidKey(response.status, errMsg)) {
          attempts.push({
            provider: label,
            status: response.status,
            detail: `${errMsg}${keys.length > 1 ? ` [key ${ki + 1}/${keys.length}]` : ""}`,
          });
          continue; // next key
        }
        attempts.push({ provider: label, status: response.status, detail: errMsg });
      } catch (error) {
        attempts.push({
          provider: label,
          detail: `${shortDetail(error, "request failed")}${keyNote}`,
        });
      }
    }
  }
  return null;
}
