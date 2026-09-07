import type { Metadata, Viewport } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LiveChatWidget from "./components/LiveChatWidget";
import { vazirmatn } from "./fonts";
import "./globals.css";

const SITE_URL = process.env.SITE_URL || "https://miniroyal.shop";
const SITE_NAME = "Mini Royal";
const SITE_NAME_FA = "مینی رویال";
const SITE_DESCRIPTION =
  "فروشگاه تخصصی پوشاک کودک و نوجوان با پرو آنلاین و هوش مصنوعی توصیه سایز، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.";

export const viewport: Viewport = {
  themeColor: "#080706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | فروشگاه تخصصی پوشاک کودک و نوجوان با پرو آنلاین`,
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
    "هوش مصنوعی سایز کودک",
    "مینی رویال",
    "Mini Royal",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: `${SITE_NAME} (${SITE_NAME_FA})`,
    title: `${SITE_NAME} | فروشگاه تخصصی پوشاک کودک و نوجوان با پرو آنلاین`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/hero-poster.webp", width: 1600, height: 893, alt: `${SITE_NAME} — پوشاک کودک و نوجوان` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | فروشگاه تخصصی پوشاک کودک و نوجوان با پرو آنلاین`,
    description: SITE_DESCRIPTION,
    images: ["/images/hero-poster.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  formatDetection: { telephone: true },
};

const rootStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ClothingStore",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME_FA,
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/brand/miniroyal-logo.webp`,
      image: `${SITE_URL}/images/hero-poster.webp`,
      description: SITE_DESCRIPTION,
      priceRange: "$$",
      currenciesAccepted: "IRR",
      paymentAccepted: "کارت به کارت، درگاه بانکی شتاب",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "00:00",
          closes: "23:59",
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "پوشاک کودک و نوجوان مینی رویال",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: SITE_NAME_FA,
      inLanguage: "fa-IR",
      publisher: { "@id": `${SITE_URL}/#store` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        {/* پیش‌بارگذاری فونت‌های کلیدی وزیرمتن برای از بین بردن تأخیر نمایش متن و FCP */}
        <link
          rel="preload"
          href="/fonts/Vazirmatn-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Vazirmatn-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData) }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; padding: 0; background-color: #fbf8f5; color: #1c1917; }
          a { text-decoration: none; color: inherit; }
          * { box-sizing: border-box; }
        ` }} />
      </head>
      <body className="min-h-screen bg-stone-50/50 text-stone-900 font-sans antialiased flex flex-col selection:bg-amber-100 selection:text-amber-950">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <LiveChatWidget />
      </body>
    </html>
  );
}
