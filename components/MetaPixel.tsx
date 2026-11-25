"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { META_PIXEL_ID, trackPixel } from "@/lib/meta-pixel";

// Painel e login do admin não são rastreados
const isPrivate = (path: string) => path.startsWith("/admin") || path.startsWith("/login");

/** Carrega o Meta Pixel e dispara PageView a cada troca de página. */
export default function MetaPixel() {
  const pathname = usePathname();
  const off = !META_PIXEL_ID || isPrivate(pathname);

  useEffect(() => {
    if (!off) trackPixel("PageView");
  }, [pathname, off]);

  if (off) return null;
  return <Script id="meta-pixel" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />;
}
