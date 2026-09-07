import { NextRequest, NextResponse } from "next/server";
import { searchAutocomplete } from "@/app/lib/catalog";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  if (!query.trim()) return NextResponse.json({ products: [], categories: [] });
  try {
    return NextResponse.json(await searchAutocomplete(query));
  } catch (error) {
    console.error("Catalog search failed:", error);
    return NextResponse.json({ products: [], categories: [] }, { status: 503 });
  }
}
