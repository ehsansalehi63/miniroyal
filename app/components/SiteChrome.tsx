"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminPathname } from "../lib/admin-path";

/**
 * چیدمان مشترک سایت.
 *
 * هدر، فوتر و ویجت چت فروشگاه روی صفحه‌های پنل مدیریت (/admin/*) هم رندر می‌شدند؛
 * یعنی مدیر بالای پنل نوار تبلیغاتی و دکمهٔ «سبد خرید» می‌دید، پایین صفحه کل فوتر
 * دسته‌بندی‌ها می‌آمد و حباب شناور چت روی منوی کناری پنل می‌افتاد و کلیک روی
 * آیتم‌های منو را می‌گرفت. اینجا فقط برای مسیرهای مدیریتی این سه بخش حذف می‌شوند.
 *
 * هدر/فوتر به‌صورت slot پاس داده می‌شوند تا سرور-کامپوننت بودن فوتر حفظ شود.
 */
export default function SiteChrome({
  header,
  footer,
  chat,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  chat: ReactNode;
  children: ReactNode;
}) {
  const isAdminArea = isAdminPathname(usePathname());

  if (isAdminArea) return <main className="flex-1">{children}</main>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {chat}
    </>
  );
}
