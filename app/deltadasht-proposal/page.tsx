import type { Metadata } from "next";
import ProposalView from "./ProposalView";

export const metadata: Metadata = {
  title: "پروپوزال بازطراحی پورتال دلتا دشت | کاتالوگ رسمی ارائه به کارفرما",
  description:
    "کاتالوگ رسمی پروپوزال بازطراحی کامل پورتال سازمانی دلتا دشت (deltadasht.com): هویت بصری سینمایی، کاتالوگ هوشمند، پیش‌فاکتور آنلاین، نسخه چهارزبانه و سئوی جهانی — اجرا در ۸ هفته.",
  robots: { index: false, follow: false },
};

export default function DeltaDashtProposalPage() {
  return <ProposalView />;
}
