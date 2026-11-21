"use client";

import { useEffect, useState } from "react";
import Media from "@/components/Media";

/** Foto do brinde pelo texto (as ofertas 1x e 2x usam a mesma imagem) */
const giftImage = (gift: string) =>
  /polishing/i.test(gift)
    ? "/midia/brindes/oferta1-polishing-head.png"
    : /gloves/i.test(gift)
      ? "/midia/brindes/oferta1-gloves.png"
      : null;
import type { ProductPageData } from "@/lib/data";
import { formatMoney } from "@/lib/product";

export type Offer = ProductPageData["offers"][number];

/** Contagem até a meia-noite (horário do visitante). Só roda no cliente. */
function OfferCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const text =
    left === null
      ? "--:--:--"
      : `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;

  return (
    <p className="rounded-lg bg-[#fdeee6] px-3 py-3 text-center text-[15px] font-bold md:text-base">
      Hurry! Offer expires in <span className="tabular-nums">{text}</span>{" "}
      <span aria-hidden="true">⏰</span>
    </p>
  );
}

export default function QuantityBreaks({
  offers,
  selectedId,
  onSelect,
}: {
  offers: Offer[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-[3px] flex-1 rounded-full bg-[#fcd9c5]" />
        <h2 className="text-[15px] font-bold tracking-[0.04em] md:text-base">Buy More, Save More</h2>
        <span className="h-[3px] flex-1 rounded-full bg-[#fcd9c5]" />
      </div>

      <div className="mt-3">
        <OfferCountdown />
      </div>

      <div role="radiogroup" aria-label="Choose a bundle" className="mt-4 space-y-4">
        {offers.map((o) => {
          const selected = o.id === selectedId;
          return (
            <label
              key={o.id}
              className={`relative block cursor-pointer rounded-lg border-2 transition-colors ${
                selected ? "border-accent bg-white" : "border-[#fcd3c0] bg-[#fff5f1]"
              }`}
            >
              <input
                type="radio"
                name="offer"
                value={o.id}
                checked={selected}
                onChange={() => onSelect(o.id)}
                className="peer sr-only"
              />

              {o.badge && (
                <span className="absolute -top-2.5 right-3 z-10 rounded-sm bg-accent px-2 py-0.5 text-[11.5px] font-bold leading-tight text-white shadow-sm">
                  {/* "orelhas" da fita */}
                  <span className="absolute -left-1.5 bottom-0 border-b-[6px] border-l-[6px] border-b-[#b04f06] border-l-transparent" aria-hidden="true" />
                  <span className="absolute -right-1.5 bottom-0 border-b-[6px] border-r-[6px] border-b-[#b04f06] border-r-transparent" aria-hidden="true" />
                  {o.badge}
                </span>
              )}

              {/* Linha principal */}
              <div className="flex items-center gap-2.5 rounded-t-md px-3.5 py-2.5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent md:px-5">
                <span
                  aria-hidden="true"
                  className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                    selected ? "border-accent" : "border-[#fcd3c0]"
                  }`}
                >
                  {selected && <span className="size-3 rounded-full bg-accent" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold leading-tight md:text-[19px]">{o.title}</p>
                  <p className="text-[10px] uppercase tracking-normal text-[#555] md:text-[11px]">
                    {o.caption}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-bold leading-tight md:text-[18px]">{formatMoney(o.price)}</p>
                  {o.compareAt && o.compareAt > o.price && (
                    <s className="text-[12px] text-[#555] md:text-[13px]">{formatMoney(o.compareAt)}</s>
                  )}
                </div>
              </div>

              {/* Brindes */}
              {o.gifts.length > 0 && (
                <ul
                  className={`overflow-hidden rounded-b-md ${
                    selected ? "divide-y divide-white/60 bg-[#f97a2e] text-white" : "divide-y divide-white bg-[#fdeee6] text-foreground"
                  }`}
                >
                  {o.gifts.map((gift) => (
                    <li key={gift} className="flex min-h-[44px] items-center gap-2.5 px-2 py-1.5 md:px-3">
                      <div className="w-8 shrink-0">
                        <Media src={giftImage(gift)} alt={gift} rounded="rounded-md" sizes="32px" fit="contain" className="bg-white" />
                      </div>
                      <span className="text-[12.5px] font-bold leading-snug md:text-[13px]">{gift}</span>
                    </li>
                  ))}
                </ul>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
