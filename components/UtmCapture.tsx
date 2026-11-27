"use client";

import { useEffect } from "react";
import { TRACKING_KEYS, TRACKING_STORAGE_KEY, hasTracking, sanitizeTracking } from "@/lib/tracking";

/**
 * Guarda as UTMs com que o visitante chegou (ex.: clique num anúncio da Meta).
 * Vale o último clique: uma visita nova com UTMs substitui a anterior; sem UTMs, mantém a que havia.
 */
export default function UtmCapture() {
  useEffect(() => {
    try {
      const url = new URLSearchParams(window.location.search);
      const params = sanitizeTracking(Object.fromEntries(TRACKING_KEYS.map((k) => [k, url.get(k)])));
      if (hasTracking(params)) localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify({ at: Date.now(), params }));
    } catch {}
  }, []);
  return null;
}
