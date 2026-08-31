import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
let deployLock: { commit: string; startedAt: number } | null = null;
const GITHUB_IPV4_RANGES = [
  [0xc01efc00, 22], // 192.30.252.0/22
  [0xb9c76c00, 22], // 185.199.108.0/22
  [0x8c527000, 20], // 140.82.112.0/20
  [0x8f374000, 20], // 143.55.64.0/20
] as const;

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function verifyGitHubSignature(request: NextRequest, rawBody: string, secret: string) {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function checkRateLimit(identifier: string) {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  if (!current || now >= current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

export function isAllowedEvent(request: NextRequest) {
  return request.headers.get("x-github-event") === "push";
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const values = parts.map(Number);
  if (values.some((value) => value < 0 || value > 255)) return null;
  return ((values[0] << 24) | (values[1] << 16) | (values[2] << 8) | values[3]) >>> 0;
}

export function isGitHubIp(request: NextRequest) {
  const ip = getClientIp(request).replace(/^::ffff:/, "");
  if (ip === "unknown") return false;
  if (ip.startsWith("2a0a:a440:") || ip.startsWith("2606:50c0:")) return true;
  const numericIp = ipv4ToNumber(ip);
  if (numericIp === null) return false;
  return GITHUB_IPV4_RANGES.some(([network, prefix]) => {
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (numericIp & mask) === (network & mask);
  });
}

export function acquireDeployLock(commit: string) {
  const now = Date.now();
  if (deployLock && now - deployLock.startedAt < 10 * 60_000) return false;
  deployLock = { commit, startedAt: now };
  return true;
}

export function releaseDeployLock() {
  deployLock = null;
}

export function isDeployLocked() {
  return Boolean(deployLock);
}
