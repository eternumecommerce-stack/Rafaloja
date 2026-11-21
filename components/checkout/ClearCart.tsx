"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartContext";

/** Esvazia o carrinho depois que o pagamento foi confirmado. */
export default function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
