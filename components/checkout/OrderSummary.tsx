"use client";

import { useState } from "react";
import Media from "@/components/Media";
import { formatMoney } from "@/lib/product";

export type SummaryLine = {
  key: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  price: number;
  qty: number;
  /** brinde do pacote (mostra FREE) */
  gift?: boolean;
};

export default function OrderSummary({
  lines,
  total,
}: {
  lines: SummaryLine[];
  total: number;
}) {
  return (
    <div className="text-sm">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-3.5">
            <div className="relative w-16 shrink-0">
              <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
                <Media src={l.image} alt={l.title} rounded="rounded-none" sizes="64px" fit={l.image?.endsWith(".svg") ? "contain" : "cover"} />
              </div>
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#666] px-1.5 text-xs font-semibold text-white">
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{l.title}</p>
              {l.subtitle && <p className="text-xs text-[#707070]">{l.subtitle}</p>}
            </div>
            <span className="tabular-nums">{l.gift ? "FREE" : formatMoney(l.price * l.qty)}</span>
          </li>
        ))}
      </ul>


      <dl className="mt-5 space-y-2">
        <div className="flex justify-between">
          <dt>Subtotal · {lines.reduce((n, l) => n + (l.gift ? 0 : l.qty), 0)} items</dt>
          <dd className="tabular-nums">{formatMoney(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="font-medium">FREE</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-[19px] font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">
            <span className="mr-2 text-xs font-normal text-[#707070]">USD</span>
            {formatMoney(total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Barra "Order summary" recolhível do topo no mobile. */
export function MobileOrderSummary({ lines, total }: { lines: SummaryLine[]; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#dedede] bg-[#f5f5f5]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-16 w-full items-center justify-between px-5 text-sm"
      >
        <span className="flex items-center gap-1.5 text-[#1773b0]">
          Order summary
          <svg viewBox="0 0 10 6" className={`size-2.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="text-[17px] font-semibold tabular-nums">{formatMoney(total)}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <OrderSummary lines={lines} total={total} />
        </div>
      )}
    </div>
  );
}
