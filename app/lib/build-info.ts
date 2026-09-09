import { readFile } from "node:fs/promises";
import path from "node:path";

import { geminiKeys } from "./tryon-gemini";

export interface BuildInfo {
  commit: string | null;
  branch: string | null;
  builtAt: string | null;
}

let cached: BuildInfo | undefined;

/** Build metadata written by scripts/write-build-info.mjs during `npm run build`.
 *  Missing file (e.g. `next dev` without a build) → all nulls, never throws. */
export async function getBuildInfo(): Promise<BuildInfo> {
  if (cached !== undefined) return cached;
  try {
    const raw = await readFile(path.join(process.cwd(), "build-info.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<BuildInfo>;
    cached = {
      commit: typeof parsed.commit === "string" ? parsed.commit : null,
      branch: typeof parsed.branch === "string" ? parsed.branch : null,
      builtAt: typeof parsed.builtAt === "string" ? parsed.builtAt : null,
    };
  } catch {
    cached = { commit: null, branch: null, builtAt: null };
  }
  return cached;
}

/** AI try-on provider wiring as visible to THIS process. Booleans and the
 *  configured model NAME only — never key material. Safe for public status. */
export function describeTryonWiring() {
  return {
    geminiFree: geminiKeys().length,
    replicate: Boolean(
      process.env.REPLICATE_API_TOKEN ||
        process.env.REPLICATE_API_KEY ||
        process.env.REPLICATE_TOKEN ||
        process.env.REPLICATE_KEY ||
        process.env.REPLICATEKEY ||
        process.env.REPLICATE
    ),
    segmind: Boolean(process.env.SEGMIND_API_KEY),
    aihubmix: Boolean(process.env.AIHUBMIX_API_KEY),
    pollinations: Boolean(process.env.POLLINATIONS_API_KEY),
    tryonModel: process.env.TRYON_MODEL?.trim() || null,
    visionPrompt: process.env.TRYON_USE_VISION_PROMPT === "true",
  };
}
