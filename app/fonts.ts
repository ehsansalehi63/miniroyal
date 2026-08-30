import localFont from "next/font/local";

/**
 * فونت وزیرمتن — فونت استاندارد فارسی (رایگان، OFL)
 * آدرس‌دهی مستقیم از پوشه public/fonts جهت سازگاری ۱۰۰٪ با Hostinger Standalone Build
 */
export const vazirmatn = localFont({
  src: [
    { path: "../public/fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Vazirmatn-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Vazirmatn-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/Vazirmatn-Black.ttf", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-vazirmatn",
});
