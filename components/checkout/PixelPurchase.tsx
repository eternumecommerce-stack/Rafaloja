"use client";

import { useEffect } from "react";
import { trackPixel } from "@/lib/meta-pixel";

const STORAGE_KEY = "pixel-purchases";

/** Dispara Purchase uma vez por pedido (recarregar a página de obrigado não conta de novo). */
export default function PixelPurchase({
  orderId,
  value,
  contentIds,
  numItems,
}: {
  orderId: string;
  value: number;
  contentIds: string[];
  numItems: number;
}) {
  useEffect(() => {
    let sent: string[] = [];
    try {
      sent = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (!Array.isArray(sent)) sent = [];
    } catch {}
    if (sent.includes(orderId)) return;
    // eventID = id do pedido: deduplica com a API de Conversões, se for ligada depois
    trackPixel(
      "Purchase",
      { value, currency: "USD", content_ids: contentIds, content_type: "product", num_items: numItems },
      orderId,
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...sent, orderId].slice(-20)));
    } catch {}
  }, [orderId, value, contentIds, numItems]);
  return null;
}
