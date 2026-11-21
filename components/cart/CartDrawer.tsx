"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import useScrollLock from "@/components/useScrollLock";
import Media from "@/components/Media";
import { formatMoney } from "@/lib/product";
import { cartRows } from "@/lib/cart-bundles";
import { freeShippingThreshold, giftImages, shippingNote } from "@/lib/store";

const CloseIcon = ({ className = "size-3" }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const TruckIcon = () => (
  <svg viewBox="0 0 24 16" className="h-[13px] w-5 fill-white" aria-hidden="true">
    <path d="M1 1h13v10H1zM15 4h4l3 3.5V11h-7z" />
    <circle cx="5" cy="13" r="2" />
    <circle cx="18" cy="13" r="2" />
  </svg>
);

/** Barra "frete grátis": enche conforme o subtotal chega no valor mínimo */
function ShippingProgress({ subtotal }: { subtotal: number }) {
  const left = Math.max(0, freeShippingThreshold - subtotal);
  const pct = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  return (
    <div className="border-b border-[#dedede] px-5 pb-[15px] pt-3">
      <p className="text-center text-[15px] font-semibold text-[#1e161b] md:text-base">
        {left === 0 ? (
          <>
            You unlocked Free Shipping <span aria-hidden="true">🎉</span>
          </>
        ) : (
          <>You&apos;re {formatMoney(left)} away from Free Shipping</>
        )}
      </p>
      <div className="relative mt-3 h-2.5 rounded-full bg-[#ececec]">
        <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
        <span
          className="absolute top-1/2 flex size-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink transition-[left] duration-500"
          style={{ left: `min(${pct}%, calc(100% - 13px))` }}
          aria-hidden="true"
        >
          <TruckIcon />
        </span>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { lines, open, setOpen, count, subtotal, setQty, remove, setPick } = useCart();
  useScrollLock(open);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`absolute right-0 top-0 flex h-dvh w-full max-w-[440px] flex-col bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#dedede] px-[15px]">
          <h2 className="text-[18px] font-semibold uppercase text-[#1e161b]">
            Your cart<span className="sr-only"> ({count} items)</span>
          </h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="flex size-[30px] items-center justify-center text-[#1e161b]">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <p className="text-[15px] text-[#1e161b]">
                Free Shipping above {formatMoney(freeShippingThreshold)}
              </p>
              <h3 className="mt-3 text-[20px]">Your cart is empty</h3>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 h-[50px] w-full rounded-[4px] bg-accent text-[15px] font-semibold uppercase text-white"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <>
              <ShippingProgress subtotal={subtotal} />
              <ul>
                {cartRows(lines).map((r) =>
                  r.kind === "gift" ? (
                    // Brinde do pacote: entra junto, de graça
                    <li key={r.key} className="flex items-center border-b border-[#dedede] p-[15px]">
                      <div className="w-20 shrink-0">
                        <Media src={giftImages[r.title]} alt={r.title} rounded="rounded-none" sizes="80px" />
                      </div>
                      <div className="min-w-0 flex-1 pl-5">
                        <p className="text-[15px] font-semibold leading-snug text-[#1e161b] md:text-base">{r.title}</p>
                        <p className="mt-1 text-[13px] text-[#737373]">Qty: {r.qty}</p>
                      </div>
                      <span className="text-[14px] font-semibold text-[#0fa958]">FREE</span>
                    </li>
                  ) : (
                    <li key={r.key} className="flex border-b border-[#dedede] p-[15px]">
                      <div className="w-20 shrink-0">
                        <Media src={r.image} alt={r.title} rounded="rounded-none" sizes="80px" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col pl-5">
                        <div className="relative pr-[30px]">
                          <p className="text-[15px] font-semibold leading-snug text-[#1e161b] md:text-base">{r.title}</p>
                          {r.subtitle && <p className="mt-1 text-[13px] leading-snug text-[#737373]">{r.subtitle}</p>}
                          <button
                            aria-label={`Remove ${r.title} ${r.subtitle ?? ""}`}
                            onClick={() => (r.bundleKey ? setPick(r.bundleKey, r.pick!, 0) : remove(r.lineId!))}
                            className="absolute -top-0.5 right-0 flex size-[25px] items-center justify-center rounded-[4px] text-[#1e161b] hover:bg-black/5"
                          >
                            <CloseIcon className="size-[11px]" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2.5">
                          <div className="flex h-8 w-[88px] items-center justify-between rounded-full border-[0.8px] border-[#3d3d3d] text-[14px] text-[#3d3d3d]">
                            <button
                              aria-label="Decrease quantity"
                              onClick={() => (r.bundleKey ? setPick(r.bundleKey, r.pick!, r.qty - 1) : setQty(r.lineId!, r.qty - 1))}
                              className="flex h-full w-[26px] items-center justify-center text-base"
                            >
                              −
                            </button>
                            <span className="tabular-nums">{r.qty}</span>
                            <button
                              aria-label="Increase quantity"
                              onClick={() => (r.bundleKey ? setPick(r.bundleKey, r.pick!, r.qty + 1) : setQty(r.lineId!, r.qty + 1))}
                              className="flex h-full w-[26px] items-center justify-center text-base"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-right leading-tight">
                            {r.unitCompare !== undefined && r.unitCompare > r.unitPrice && (
                              <s className="block text-[12px] text-[#737373]">{formatMoney(r.unitCompare * r.qty)}</s>
                            )}
                            <span className="text-[14px] font-semibold text-[#0fa958]">{formatMoney(r.unitPrice * r.qty)}</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </>
          )}
        </div>

        {/* Rodapé */}
        {lines.length > 0 && (
          <div className="shrink-0 border-t border-[#dedede] bg-white p-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between text-[18px] text-[#0fa958]">
              <span className="font-black">Total:</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <p className="mt-2.5 text-center text-[13px] text-[#55414c]">{shippingNote}</p>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/checkout");
              }}
              className="mt-1 flex h-[53px] w-full items-center justify-center gap-2 rounded-[4px] bg-accent text-base font-bold uppercase text-white transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 13 18" className="h-[18px] w-[13px] fill-current" aria-hidden="true">
                <path d="M11 7.5V5a4.5 4.5 0 00-9 0v2.5H1a1 1 0 00-1 1V17a1 1 0 001 1h11a1 1 0 001-1V8.5a1 1 0 00-1-1zM4 5a2.5 2.5 0 015 0v2.5H4z" />
              </svg>
              Checkout →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
