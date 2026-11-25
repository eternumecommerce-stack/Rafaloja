"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { quoteCart, type QuotedLine } from "@/app/checkout/actions";
import { getCheckoutProfile } from "@/app/actions/account";
import type { CheckoutProfile } from "./CheckoutForm";
import { useCart } from "@/components/cart/CartContext";
import CheckoutForm from "./CheckoutForm";
import OrderSummary, { MobileOrderSummary, type SummaryLine } from "./OrderSummary";
import { cartRows } from "@/lib/cart-bundles";
import { giftImages } from "@/lib/store";
import { CheckoutColumns } from "./CheckoutShell";
import { trackPixel } from "@/lib/meta-pixel";

// Sem a chave pública (ainda não configurada) o Stripe não é carregado: o resto do checkout continua abrindo
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Visual dos campos do Stripe alinhado ao checkout Shopify (labels flutuantes, bordas #dedede).
// Compacto no desktop; no mobile mantém 16px para o iOS não dar zoom ao focar o campo.
const getAppearance = (desktop: boolean): StripeElementsOptions["appearance"] => ({
  theme: "stripe",
  labels: "floating",
  variables: {
    colorPrimary: "#f77109",
    colorText: "#000000",
    colorTextSecondary: "#707070",
    colorDanger: "#dd1d1d",
    colorBackground: "#ffffff",
    fontFamily: "Poppins, system-ui, sans-serif",
    fontSizeBase: desktop ? "14px" : "16px",
    borderRadius: "5px",
    spacingUnit: "3px",
    gridRowSpacing: "8px",
    gridColumnSpacing: "8px",
  },
  rules: {
    ".Input": { border: "1px solid #dedede", boxShadow: "none", padding: "5px 10px" },
    ".Input:focus": { border: "1px solid #f77109", boxShadow: "0 0 0 1px #f77109" },
    ".AccordionItem": { border: "1px solid #dedede", boxShadow: "none", padding: "10px 12px" },
  },
});

const fonts: StripeElementsOptions["fonts"] = [
  { cssSrc: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" },
];

export default function CheckoutClient() {
  const { lines, subtotal, ready } = useCart();

  const items = useMemo(() => lines.map((l) => ({ id: l.id, qty: l.qty })), [lines]);
  const itemsKey = JSON.stringify(items);

  // O navegador pode ter preços antigos: o resumo e o valor exibidos vêm do banco
  const [quote, setQuote] = useState<
    { key: string; lines: QuotedLine[]; total: number } | { key: string; error: string } | null
  >(null);
  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    quoteCart(items)
      .then((r) => !cancelled && setQuote({ key: itemsKey, ...r }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, items, itemsKey]);
  // undefined = carregando; null = visitante
  const [profile, setProfile] = useState<CheckoutProfile | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getCheckoutProfile()
      .catch(() => null)
      .then((p) => !cancelled && setProfile(p));
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const current = quote?.key === itemsKey ? quote : null;
  const fresh = current && "lines" in current ? current : null;
  const quoteError = current && "error" in current ? current.error : null;

  const total = fresh?.total ?? subtotal;
  // Mesmas linhas do carrinho (cada par separado, brinde FREE), com o preço conferido pelo servidor
  const quotedPrice = new Map((fresh?.lines ?? []).map((q) => [q.id, q.price]));
  const summaryLines: SummaryLine[] = cartRows(lines, (l) => quotedPrice.get(l.id) ?? l.price).map((r) =>
    r.kind === "gift"
      ? { key: r.key, title: r.title, image: giftImages[r.title], price: 0, qty: r.qty, gift: true }
      : { key: r.key, title: r.title, subtitle: r.subtitle, image: r.image, price: r.unitPrice, qty: r.qty },
  );
  const amount = Math.round(total * 100);

  // Meta Pixel: entrou no checkout com itens (uma vez por visita à página)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!ready || lines.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackPixel("InitiateCheckout", {
      content_ids: lines.map((l) => l.id),
      content_type: "product",
      num_items: lines.reduce((n, l) => n + l.qty, 0),
      value: total,
      currency: "USD",
    });
  }, [ready, lines, total]);

  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment",
      amount: Math.max(amount, 50),
      currency: "usd",
      locale: "en",
      appearance: getAppearance(
        typeof window !== "undefined" && window.matchMedia("(min-width: 750px)").matches,
      ),
      fonts,
    }),
    [amount],
  );

  if (!ready || profile === undefined) {
    return (
      <CheckoutColumns
        main={<div className="h-96 animate-pulse rounded-md bg-[#f5f5f5]" />}
        summary={<div className="h-48 animate-pulse rounded-md bg-[#ebebeb]" />}
      />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl">Your cart is empty</h1>
        <Link
          href="/"
          className="mt-6 flex h-12 items-center rounded-[5px] bg-accent px-8 font-semibold text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <CheckoutColumns
      mobileSummary={<MobileOrderSummary lines={summaryLines} total={total} />}
      summary={<OrderSummary lines={summaryLines} total={total} />}
      main={
        <>
          {quoteError && (
            <div role="alert" className="mb-5 rounded-[5px] border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
              {quoteError}.{" "}
              <Link href="/" className="underline">
                Return to store
              </Link>
            </div>
          )}
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm items={items} total={total} profile={profile} />
          </Elements>
        </>
      }
    />
  );
}
