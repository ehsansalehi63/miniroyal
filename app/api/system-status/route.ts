import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.2.0",
    buildDate: "2026-08-29",
    buildTime: new Date().toISOString(),
    status: "online",
    environment: process.env.NODE_ENV || "production",
    site: "miniroyal.shop",
    features: {
      smsGateway: true,
      zarinpalSandbox: true,
      customAdminPassword: true,
      userAuthSession: true,
    },
  });
}
