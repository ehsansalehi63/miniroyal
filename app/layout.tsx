import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LiveChatWidget from "./components/LiveChatWidget";
import SiteChrome from "./components/SiteChrome";
import { vazirmatn } from "./fonts";
import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";
const SITE_NAME = "مینی رویال";
const SITE_DESCRIPTION =
  "خرید شیک‌ترین لباس‌های دخترانه، پسرانه و نوزاد با پرو آنلاین، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | فروشگاه پوشاک کودک و نوجوان با پرو آنلاین لباس`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "پوشاک کودک",
    "لباس بچه",
    "لباس نوزاد",
    "لباس دخترانه",
    "لباس پسرانه",
    "پرو آنلاین لباس",
    "جدول سایز کودک",
    "خرید لباس کودک آنلاین",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | فروشگاه پوشاک کودک و نوجوان`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/hero-poster.webp", width: 1600, height: 893, alt: `${SITE_NAME} — پوشاک کودک و نوجوان` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | فروشگاه پوشاک کودک و نوجوان`,
    description: SITE_DESCRIPTION,
    images: ["/images/hero-poster.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      {/*
        فونت وزیرمتن به‌صورت لوکال با next/font/local بارگذاری می‌شود.
        لینک قبلی به fonts.googleapis.com (Anton و Inter) حذف شد: آن دو فونت هیچ‌جا
        استفاده نمی‌شدند و فقط یک درخواست render-blocking به دامنهٔ خارجی بودند
        که از داخل ایران هم کند و ناپایدار است.

        ریست پایه (margin بدنه، رنگ لینک و box-sizing) قبلاً به‌صورت <style> داخل
        <head> تزریق می‌شد. آن استایل «بدون لایه» بود و در Tailwind v4 هر قانون
        بدون لایه بر تمام کلاس‌های @layer utilities برتری دارد؛ نتیجه این بود که
        روی هر <a> رنگِ کلاس‌هایی مثل text-white یا text-violet-800 نادیده گرفته
        می‌شد و لینک رنگ والد را ارث می‌برد (مثلاً متن دکمهٔ «شروع پرو آنلاین»
        سفیدِ روی پس‌زمینهٔ سفید و نامرئی می‌شد). همان ریست حالا در globals.css
        داخل @layer base قرار دارد تا کلاس‌های Tailwind دوباره کار کنند.
      */}
      <body className="min-h-screen bg-stone-50/50 text-stone-900 font-sans antialiased flex flex-col selection:bg-violet-100 selection:text-violet-900">
        <SiteChrome header={<Header />} footer={<Footer />} chat={<LiveChatWidget />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
