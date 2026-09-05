import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_REMOTE_BYTES = 12 * 1024 * 1024;
const MEDIA_DIR = process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "products");
const MEDIA_PUBLIC_PREFIX = "/uploads/products";

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
