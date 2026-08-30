import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LiveChatWidget from "./components/LiveChatWidget";
import { vazirmatn } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "مینی رویال | فروشگاه پوشاک کودک و نوجوان با پرو آنلاین لباس",
  description: "خرید شیک‌ترین لباس‌های دخترانه، پسرانه و نوزاد با پرو آنلاین، جدول سایز سانتی‌متری و ارسال سریع به سراسر کشور.",
  metadataBase: new URL("https://miniroyal.shop"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-stone-50/50 text-stone-900 font-sans antialiased flex flex-col selection:bg-violet-100 selection:text-violet-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <LiveChatWidget />
      </body>
    </html>
  );
}
