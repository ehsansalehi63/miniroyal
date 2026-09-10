import { GET as tipaxCitiesGet } from "@/app/api/shipping/tipax/cities/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return tipaxCitiesGet();
}
