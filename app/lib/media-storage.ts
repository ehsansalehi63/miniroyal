import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_REMOTE_BYTES = 12 * 1024 * 1024;
// On Hostinger Node.js apps, HOME is already `<account>/domains/<domain>`,
// so the previous `path.join(HOME, "domains", ...)` produced a doubled
// `.../domains/<domain>/domains/<domain>/...` path. Detect both layouts and
// prefer the one that exists, so uploads always land in the real
// public_html/uploads/products of the site root.
const LOCAL_FALLBACK_DIR = path.join(process.cwd(), "public", "uploads", "products");
const HOME_CANDIDATE_DIRS = process.env.HOME
  ? [
      path.join(process.env.HOME, "public_html", "uploads", "products"),
      path.join(process.env.HOME, "domains", "miniroyal.shop", "public_html", "uploads", "products"),
    ]
  : [];
// Resolve at runtime: prefer MEDIA_UPLOAD_DIR, then the first candidate
// directory that already exists (works on both Hostinger layouts), then the
// layout that exists with a symlinked base, then local fallback.
function resolveMediaDir() {
  if (process.env.MEDIA_UPLOAD_DIR) return process.env.MEDIA_UPLOAD_DIR;
  for (const candidate of HOME_CANDIDATE_DIRS) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      // ignore fs errors and keep probing
    }
  }
  for (const candidate of HOME_CANDIDATE_DIRS) {
    try {
      const parent = path.dirname(candidate);
      if (existsSync(parent)) return candidate;
    } catch {
      // ignore fs errors and keep probing
    }
  }
  return LOCAL_FALLBACK_DIR;
}
const MEDIA_DIR = process.env.NODE_ENV === "production" ? resolveMediaDir() : LOCAL_FALLBACK_DIR;
const MEDIA_PUBLIC_PREFIX = "/uploads/products";

export function mediaFilePath(filename: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) return null;
  return path.join(MEDIA_DIR, filename);
}

/** Older deployments (doubled `domains/<domain>/domains/<domain>` layout)
 * keep their files in a different directory. Serving checks these too so
 * images uploaded before the path fix keep working. */
export function legacyMediaFilePaths(filename: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) return [] as string[];
  if (!process.env.HOME) return [] as string[];
  const home = process.env.HOME;
  if (home.endsWith(path.join("domains", "miniroyal.shop"))) {
    // HOME already ends with domains/<domain>: the legacy code appended
    // domains/<domain> again.
    return [path.join(home, "domains", "miniroyal.shop", "public_html", "uploads", "products", filename)];
  }
  return [] as string[];
}

function extensionForMime() {
  return "webp";
}

function parseDataUri(value: string) {
  const match = value.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2], "base64") };
}

async function fetchWithLimit(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`رسانه با وضعیت ${response.status} دریافت نشد.`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_REMOTE_BYTES) throw new Error("حجم تصویر دریافتی بیش از حد مجاز است.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_REMOTE_BYTES) throw new Error("حجم تصویر دریافتی بیش از حد مجاز است.");
  return { mime: response.headers.get("content-type")?.split(";")[0] || "image/jpeg", buffer };
}

export async function readImageSource(source: string, requestUrl?: string) {
  if (source.startsWith("data:")) {
    const parsed = parseDataUri(source);
    if (!parsed || parsed.buffer.length === 0) throw new Error("دادهٔ تصویر معتبر نیست.");
    return parsed;
  }
  const absoluteUrl = source.startsWith("/") && requestUrl ? new URL(source, requestUrl).toString() : source;
  if (!/^https?:\/\//i.test(absoluteUrl)) throw new Error("آدرس تصویر معتبر نیست.");
  return fetchWithLimit(absoluteUrl);
}

export async function storeImageBuffer(input: Buffer) {
  if (!input.length || input.length > MAX_SOURCE_BYTES) throw new Error("حجم تصویر باید کمتر از ۸ مگابایت باشد.");
  const format = extensionForMime();
  const processed = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  await mkdir(MEDIA_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}.${format}`;
  await writeFile(path.join(MEDIA_DIR, filename), processed);
  return `${MEDIA_PUBLIC_PREFIX}/${filename}`;
}

export async function storeImageSource(source: string, requestUrl?: string) {
  const { buffer } = await readImageSource(source, requestUrl);
  return storeImageBuffer(buffer);
}

export const mediaLimits = { maxSourceBytes: MAX_SOURCE_BYTES };
