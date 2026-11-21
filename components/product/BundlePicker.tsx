"use client";

import Media from "@/components/Media";
import type { ProductPageData } from "@/lib/data";
import { formatMoney, type VariantPick } from "@/lib/product";
import { giftImages, variantLabels } from "@/lib/store";

type Offer = ProductPageData["offers"][number];

const selectCls =
  "h-8 w-[88px] min-w-0 cursor-pointer appearance-none rounded-[3px] border border-black/15 bg-white bg-[length:9px] bg-[right_8px_center] bg-no-repeat py-0 pl-[7px] pr-6 text-[14px] text-black outline-none focus:border-brand";
// Setinha do <select> (SVG inline como fundo)
const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23011618' stroke-width='1.5'/%3E%3C/svg%3E")`;

/**
 * "BUNDLE & SAVE": pacotes Single / Duo / Triple. O pacote escolhido fica branco com borda azul;
 * com 2+ pares, aparece uma linha de cor/tamanho para cada par, e o brinde do pacote embaixo.
 */
export default function BundlePicker({
  offers,
  selectedId,
  onSelect,
  picks,
  onPick,
  colors,
  sizes,
  colorImages,
  fallbackImage,
}: {
  offers: Offer[];
  selectedId: string;
  onSelect: (id: string) => void;
  picks: VariantPick[];
  onPick: (i: number, patch: VariantPick) => void;
  colors: string[];
  sizes: string[];
  /** foto de cada cor (miniatura de cada par) */
  colorImages: Record<string, string | null>;
  fallbackImage?: string;
}) {
  const hasOptions = colors.length > 0 || sizes.length > 0;

  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-ink/20" />
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">Bundle &amp; Save</h2>
        <span className="h-px flex-1 bg-ink/20" />
      </div>

      <div role="radiogroup" aria-label="Choose a bundle" className="mt-4 space-y-3">
        {offers.map((o) => {
          const selected = o.id === selectedId;
          const save = o.compareAt !== undefined && o.compareAt > o.price ? o.compareAt - o.price : 0;
          return (
            <label
              key={o.id}
              className={`relative block cursor-pointer rounded-[6px] transition-colors ${
                selected ? "bg-white shadow-[inset_0_0_0_2px_var(--brand)]" : "bg-brand-soft shadow-[inset_0_0_0_1px_rgba(45,91,143,0.3)]"
              }`}
            >
              <input type="radio" name="bundle" value={o.id} checked={selected} onChange={() => onSelect(o.id)} className="peer sr-only" />

              {o.badge && (
                <span className="absolute -top-2.5 right-3 rounded-[4px] bg-brand px-2 py-[3px] text-[10px] font-bold uppercase leading-none tracking-[0.06em] text-white">
                  {o.badge}
                </span>
              )}

              {/* Linha principal */}
              <div className="flex items-center gap-3 rounded-[6px] px-3.5 py-3.5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                <span
                  aria-hidden="true"
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] bg-white ${
                    selected ? "border-brand" : "border-ink/40"
                  }`}
                >
                  {selected && <span className="size-2.5 rounded-full bg-brand" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-bold leading-tight text-[#415052] md:text-[20px]">{o.title}</p>
                  {o.quantity > 1 && save > 0 && (
                    <span className="mt-1 inline-block rounded-[6px] bg-brand px-2 py-1 text-[12px] uppercase leading-none text-white">
                      Save {formatMoney(save)}
                    </span>
                  )}
                  <p className="text-[13px] text-[#555] md:text-[14px]">
                    {o.quantity > 1 ? `(${formatMoney(o.price / o.quantity)} each)` : o.caption}
                  </p>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-[18px] font-bold text-[#415052] md:text-[20px]">{formatMoney(o.price)}</p>
                  {o.compareAt !== undefined && o.compareAt > o.price && (
                    <s className="text-[13px] text-[#555]">{formatMoney(o.compareAt)}</s>
                  )}
                </div>
              </div>

              {/* Cor/tamanho de cada par: foto da cor escolhida + seletores (no pacote escolhido) */}
              {selected && hasOptions && (
                <div className="px-3.5 pb-3">
                  <p className="text-[11px] text-[#555]">
                    {[colors.length > 0 && variantLabels.color, sizes.length > 0 && variantLabels.size].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-1 space-y-[5px]">
                    {Array.from({ length: o.quantity }, (_, i) => {
                      const color = picks[i]?.color;
                      return (
                        <div key={i} className="flex items-center gap-[7px]">
                          <div className="w-10 shrink-0">
                            <Media
                              src={(color && colorImages[color]) || fallbackImage}
                              alt={color ? `${color} – item ${i + 1}` : `Item ${i + 1}`}
                              rounded="rounded-[3px]"
                              sizes="40px"
                            />
                          </div>
                          {colors.length > 0 && (
                            <select
                              aria-label={`${variantLabels.color} for item ${i + 1}`}
                              value={color ?? ""}
                              onChange={(e) => onPick(i, { color: e.target.value })}
                              className={selectCls}
                              style={{ backgroundImage: chevron }}
                            >
                              <option value="" disabled>
                                Select
                              </option>
                              {colors.map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                          )}
                          {sizes.length > 0 && (
                            <select
                              aria-label={`${variantLabels.size} for item ${i + 1}`}
                              value={picks[i]?.size ?? ""}
                              onChange={(e) => onPick(i, { size: e.target.value })}
                              className={selectCls}
                              style={{ backgroundImage: chevron }}
                            >
                              <option value="" disabled>
                                Select
                              </option>
                              {sizes.map((sz) => (
                                <option key={sz}>{sz}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brinde do pacote */}
              {o.gifts.length > 0 && (
                <ul
                  className={`rounded-b-[6px] py-[7px] pl-2 pr-5 ${
                    selected ? "bg-brand text-white" : "bg-[rgba(53,94,141,0.2)] text-ink"
                  }`}
                >
                  {o.gifts.map((gift) => (
                    <li key={gift} className="flex items-center gap-2.5">
                      <div className="w-[30px] shrink-0">
                        <Media src={giftImages[gift]} alt={gift} rounded="rounded-[4px]" sizes="30px" className="bg-white" />
                      </div>
                      <span className="flex-1 text-[12.5px] font-semibold leading-snug">{gift}</span>
                      {o.giftValue !== undefined && (
                        <s className={`text-[12.5px] ${selected ? "text-white/85" : "text-[#555]"}`}>{formatMoney(o.giftValue)}</s>
                      )}
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
