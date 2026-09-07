import { NextResponse } from "next/server";
import { getCategories } from "@/app/lib/catalog";

export async function GET() {
  try {
    return NextResponse.json({ success: true, categories: await getCategories() });
  } catch (error) {
    console.error("Catalog categories failed:", error);
    return NextResponse.json({ success: false, categories: [] }, { status: 503 });
  }
}
