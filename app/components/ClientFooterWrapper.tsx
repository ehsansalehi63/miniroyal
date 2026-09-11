"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ClientFooterWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/ehsanpaneladmin") || pathname?.startsWith("/deltadasht-proposal")) {
    return null;
  }
  return <>{children}</>;
}
