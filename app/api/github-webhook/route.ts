import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const ref = payload.ref || "";

    if (!ref || ref.includes("main") || ref.includes("arena/01a04d03-miniroyal")) {
      console.log("🚀 GitHub Webhook triggered for ref:", ref || "manual/push");

      // Trigger background deploy asynchronously without blocking HTTP response
      setTimeout(() => {
        exec("git pull origin main && npm run build && pm2 restart miniroyal", (error, stdout, stderr) => {
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
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process webhook" },
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
  });
}
