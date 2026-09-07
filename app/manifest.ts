import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مینی رویال | پوشاک کودک و نوجوان",
    short_name: "مینی رویال",
    description: "فروشگاه آنلاین پوشاک کودک و نوجوان با پرو آنلاین سایز و جدول سایز سانتی‌متری.",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f5",
    theme_color: "#5b21b6",
    categories: ["shopping", "kids", "fashion"],
    icons: [
      { src: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
