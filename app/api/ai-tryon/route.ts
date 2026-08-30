import { NextRequest, NextResponse } from "next/server";

const POLLINATIONS_EDIT_URL = "https://gen.pollinations.ai/v1/images/edits";

function dataUriToBlob(value: string, fallbackType: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  return new Blob([Buffer.from(match[2], "base64")], {
    type: match[1] || fallbackType,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "POLLINATIONS_API_KEY در هاست تنظیم نشده است." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const personImage = typeof body.personImage === "string" ? body.personImage : "";
    const garmentImage = typeof body.garmentImage === "string" ? body.garmentImage : "";
    if (!personImage || !garmentImage) {
      return NextResponse.json({ success: false, error: "هر دو تصویر فرد و لباس لازم است." }, { status: 400 });
    }

    const form = new FormData();
    form.append("image", dataUriToBlob(personImage, "image/jpeg"), "person.jpg");
    form.append("image", dataUriToBlob(garmentImage, "image/svg+xml"), "garment.svg");
    form.append(
      "prompt",
      "Virtual try-on: place the exact garment from the second image naturally on the person in the first image. Preserve the person's face, hair, body, pose, hands, background, lighting and identity. Replace only the clothing area. Do not add text, logos, extra limbs, or change the garment color."
    );
    form.append("model", "kontext");
    form.append("size", "1024x1024");

    const response = await fetch(POLLINATIONS_EDIT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    const image = result?.data?.[0]?.b64_json
      ? `data:image/png;base64,${result.data[0].b64_json}`
      : result?.data?.[0]?.url;

    if (!response.ok || !image) {
      console.error("Pollinations try-on failed:", result);
      return NextResponse.json({ success: false, error: "تولید تصویر پرو لباس ناموفق بود." }, { status: 502 });
    }

    return NextResponse.json({ success: true, imageUrl: image });
  } catch (error) {
    console.error("AI try-on error:", error);
    return NextResponse.json({ success: false, error: "خطا در سرویس پرو هوش مصنوعی." }, { status: 500 });
  }
}
