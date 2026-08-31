import { NextRequest, NextResponse } from "next/server";
import {
  acquireDeployLock,
  checkRateLimit,
  getClientIp,
  isGitHubIp,
  isAllowedEvent,
  isDeployLocked,
  releaseDeployLock,
  verifyGitHubSignature,
} from "@/app/lib/webhook-security";
import { getLastDeployStatus, performDeploy } from "@/app/lib/deploy";
import { getRecentAuditLogs, logWebhookEvent } from "@/app/lib/webhook-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const deliveryId = request.headers.get("x-github-delivery") || "unknown";
  await logWebhookEvent({ timestamp: new Date().toISOString(), event: "webhook_received", metadata: { deliveryId }, ip });

  if (!checkRateLimit(`ip:${ip}`)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "rate_limited", metadata: { deliveryId }, ip });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  if (!isAllowedEvent(request)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "invalid_event", metadata: { deliveryId }, ip });
    return NextResponse.json({ error: "Only push events are accepted" }, { status: 400 });
  }
  if (process.env.ENFORCE_GITHUB_IP === "true" && !isGitHubIp(request)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "webhook_rejected", metadata: { reason: "ip_not_allowed", deliveryId }, ip });
    return NextResponse.json({ error: "Unauthorized IP" }, { status: 403 });
  }

  const rawBody = await request.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !verifyGitHubSignature(request, rawBody, secret)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "signature_invalid", metadata: { deliveryId }, ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  await logWebhookEvent({ timestamp: new Date().toISOString(), event: "signature_valid", metadata: { deliveryId }, ip });

  let payload: {
    ref?: string;
    after?: string;
    head_commit?: { message?: string; author?: { username?: string; name?: string } };
    sender?: { login?: string };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const branch = payload.ref?.replace("refs/heads/", "");
  const allowedBranches = (process.env.ALLOWED_BRANCHES || "main").split(",").map((item) => item.trim()).filter(Boolean);
  if (!branch || !allowedBranches.includes(branch)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "invalid_branch", metadata: { branch, deliveryId }, ip });
    return NextResponse.json({ success: true, message: "Branch ignored", branch });
  }

  if (process.env.AUTO_DEPLOY_WEBHOOK !== "true") {
    return NextResponse.json({ success: true, message: "Received; deployment is managed by Hostinger Git", branch });
  }

  const commit = payload.after || "";
  if (!commit || !acquireDeployLock(commit)) {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "lock_denied", metadata: { commit: commit.slice(0, 7), deliveryId }, ip });
    return NextResponse.json({ error: "Another deployment is already in progress" }, { status: 409 });
  }

  const author = payload.head_commit?.author?.username || payload.head_commit?.author?.name || payload.sender?.login || "unknown";
  const message = payload.head_commit?.message || "No commit message";
  await logWebhookEvent({ timestamp: new Date().toISOString(), event: "lock_acquired", metadata: { commit: commit.slice(0, 7), branch, deliveryId }, ip });

  setImmediate(async () => {
    await logWebhookEvent({ timestamp: new Date().toISOString(), event: "deploy_started", metadata: { commit: commit.slice(0, 7), branch }, ip });
    try {
      const result = await performDeploy({ commit, branch, author, message });
      await logWebhookEvent({
        timestamp: new Date().toISOString(),
        event: result.success ? "deploy_success" : "deploy_failed",
        metadata: { commit: commit.slice(0, 7), branch, duration: result.duration, error: result.error },
        ip,
      });
    } finally {
      releaseDeployLock();
    }
  });

  return NextResponse.json({ success: true, message: "Deployment queued", deliveryId, commit: commit.slice(0, 7), branch });
}

export async function GET(request: NextRequest) {
  const token = process.env.DEPLOY_STATUS_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [lastDeploy, recentActivity] = await Promise.all([getLastDeployStatus(), getRecentAuditLogs(20)]);
  return NextResponse.json({ locked: isDeployLocked(), lastDeploy, recentActivity, serverTime: new Date().toISOString() });
}
