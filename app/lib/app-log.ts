import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

export type AppLogLevel = "debug" | "info" | "warn" | "error";
export type AppLog = { timestamp: string; level: AppLogLevel; event: string; route?: string; method?: string; statusCode?: number; message?: string; requestId?: string; ip?: string; context?: Record<string, unknown> };
const LOG_FILE = process.env.APP_LOG_FILE || path.join(process.cwd(), ".application.log");
const sensitive = /password|secret|token|key|authorization|cookie|session|credit.?card/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? "[REDACTED]" : redact(item)]));
  return value;
}

export async function logAppEvent(event: Omit<AppLog, "timestamp">) {
  const record: AppLog = { timestamp: new Date().toISOString(), ...event, context: event.context ? redact(event.context) as Record<string, unknown> : undefined };
  try { await appendFile(LOG_FILE, `${JSON.stringify(record)}\n`, "utf8"); } catch (error) { console.error("Failed to write application log:", error); }
  if (event.level === "error") console.error(`[${event.event}]`, event.message || "", event.context || "");
}

export async function getRecentAppLogs(limit = 200) {
  try {
    const content = await readFile(/* turbopackIgnore: true */ LOG_FILE, "utf8");
    return content.trim().split("\n").filter(Boolean).slice(-Math.min(Math.max(limit, 1), 1000)).reverse().map((line) => JSON.parse(line) as AppLog);
  } catch { return [] as AppLog[]; }
}
