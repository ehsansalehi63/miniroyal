"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { adminBaseFromPathname } from "../lib/admin-path";

/**
 * لینک داخلی پنل که همیشه روی مسیر پایهٔ فعلی پنل ساخته می‌شود
 * (چه `/admin` باشد چه مسیر دلخواه ADMIN_PANEL_PATH).
 */
export default function AdminPanelLink({
  to,
  className,
  children,
}: {
  /** مسیر نسبی داخل پنل، مثل "/products" یا "/products?edit=12" */
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const base = adminBaseFromPathname(usePathname());
  const suffix = to.startsWith("/") ? to : `/${to}`;
  return (
    <Link href={`${base}${suffix}`} className={className}>
      {children}
    </Link>
  );
}
