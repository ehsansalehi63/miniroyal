import { appendFile, readFile } from "fs/promises";
import path from "path";

const AUDIT_LOG_FILE = path.join(process.cwd(), ".webhook-audit.log");

export type AuditEventName =
  | "webhook_received" | "signature_valid" | "signature_invalid"
  | "rate_limited" | "invalid_event" | "invalid_branch"
  | "lock_acquired" | "lock_denied" | "deploy_started"
  | "deploy_success" | "deploy_failed" | "webhook_rejected";

export interface AuditEvent {
  timestamp: string;
  event: AuditEventName;
  metadata: Record<string, unknown>;
  ip: string;
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const sensitive = /password|secret|token|key|authorization|cookie|session|credit.?card/i;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sensitive.test(key) ? "[REDACTED]" : value])
  );
}

export async function logWebhookEvent(event: AuditEvent) {
  try {
    await appendFile(
      AUDIT_LOG_FILE,
      `${JSON.stringify({ ...event, metadata: sanitizeMetadata(event.metadata) })}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("Failed to write webhook audit log:", error);
  }
}

export async function getRecentAuditLogs(limit = 50): Promise<AuditEvent[]> {
  try {
    const content = await readFile(AUDIT_LOG_FILE, "utf8");
    return content.trim().split("\n").filter(Boolean).slice(-limit).reverse().map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
