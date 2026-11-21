"use client";

import { useEffect, useState } from "react";
import { shipsInBusinessDays } from "@/lib/store";

/** Data de envio = hoje + N dias úteis (calculada no navegador, no fuso do visitante) */
function shipDate(days: number) {
  const d = new Date();
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ShipBadge() {
  const [date, setDate] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- a data depende do relógio do visitante, só existe no cliente
  useEffect(() => setDate(shipDate(shipsInBusinessDays)), []);

  return (
    <div role="status" className="mt-5 flex items-center justify-between gap-3 rounded-md bg-bg-2 p-2.5 text-[13px] leading-snug text-ink">
      <span className="flex items-center gap-2.5">
        <span className="ship-dot ml-1 size-2 shrink-0 rounded-full bg-sale" aria-hidden="true" />
        <span>
          Ships by <strong className="font-semibold">{date ?? "—"}</strong>
        </span>
      </span>
      <strong className="font-semibold">Fast Shipping</strong>
    </div>
  );
}
