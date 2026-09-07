const MAX_MEDIA_URL_LENGTH = 500;

export function validateMediaUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "آدرس تصویر الزامی است.";
  const url = value.trim();
  if (url.length > MAX_MEDIA_URL_LENGTH) return "آدرس تصویر بیش از حد طولانی است؛ ابتدا تصویر را آپلود کنید.";
  if (url.startsWith("data:")) return "ذخیرهٔ Base64 مجاز نیست؛ ابتدا تصویر را در فضای رسانه آپلود کنید.";
  if (!url.startsWith("/") && !/^https?:\/\//i.test(url)) return "آدرس تصویر معتبر نیست.";
  return null;
}

export const mediaUrlLimit = MAX_MEDIA_URL_LENGTH;
