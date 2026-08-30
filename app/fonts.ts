import localFont from "next/font/local";

/**
 * فونت وزیرمتن — فونت استاندارد فارسی (رایگان، OFL)
 * مسیرها نسبت به همین فایل (app/) سنجیده می‌شوند.
 */
export const vazirmatn = localFont({
  src: [
    { path: "../fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Vazirmatn-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/Vazirmatn-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../fonts/Vazirmatn-Black.ttf", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-vazirmatn",
});