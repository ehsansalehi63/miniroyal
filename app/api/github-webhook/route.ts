import { createHmac, timingSafeEqual } from "crypto";
import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";

const DEPLOY_BRANCH = "main";

function hasValidSignature(payload: string, signature: string | null, secret: string) {
  if (!signature?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const received = signature.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const autoDeployEnabled = process.env.AUTO_DEPLOY_WEBHOOK === "true";

    // Hostinger's Git integration is the primary deployment mechanism.
    // Keep this endpoint harmless unless explicitly enabled on the server.
    if (!autoDeployEnabled) {
      return NextResponse.json({
        success: true,
        message: "Webhook received; deployment is managed by Hostinger Git.",
      });
    }

    if (!secret || !hasValidSignature(rawBody, req.headers.get("x-hub-signature-256"), secret)) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const ref = payload.ref || "";

    if (ref === `refs/heads/${DEPLOY_BRANCH}`) {
      console.log("🚀 GitHub Webhook triggered for ref:", ref);

      // Trigger background deploy asynchronously without blocking HTTP response
      setTimeout(() => {
        exec("git pull --ff-only origin main && npm run build && pm2 restart miniroyal", (error, stdout) => {
          if (error) {
            console.error("❌ Auto-deploy background error:", error.message);
            return;
          }
          console.log("✅ Auto-deploy background success:", stdout);
        });
      }, 100);

      // Return immediate response in < 50ms to prevent any curl timeout
      return NextResponse.json({
        success: true,
        message: "GitHub webhook received successfully. Background deploy initiated!",
        ref,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received (ignored branch)",
      ref,
    });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/github-webhook",
    service: "MiniRoyal Auto-Deploy Webhook Endpoint",
    site: "miniroyal.shop",
    deployment: process.env.AUTO_DEPLOY_WEBHOOK === "true" ? "webhook" : "hostinger-git",
  });
}
