import { NextRequest, NextResponse } from "next/server";
import { canManage, currentAdmin } from "@/app/lib/admin-auth";
import { getRecentAppLogs } from "@/app/lib/app-log";

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || !canManage(admin, "settings.read")) return NextResponse.json({ success: false, error: "دسترسی مشاهدهٔ لاگ را ندارید." }, { status: 403 });
  const limit = Number(request.nextUrl.searchParams.get("limit") || 200);
  const level = request.nextUrl.searchParams.get("level") || "";
  const search = request.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const logs = (await getRecentAppLogs(limit)).filter((log) => (!level || log.level === level) && (!search || `${log.event} ${log.route || ""} ${log.message || ""}`.toLowerCase().includes(search)));
  return NextResponse.json({ success: true, logs, count: logs.length });
}
