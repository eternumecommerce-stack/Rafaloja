"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import Media from "@/components/Media";
import type { ProductPageData } from "@/lib/data";
import { formatMoney, pickLabel, variantLabel, withVariant, type CartProduct, type VariantPick } from "@/lib/product";
import { variantLabels } from "@/lib/store";
import BundlePicker from "./BundlePicker";
import { GALLERY_SHOW_EVENT } from "./ProductGallery";
import ShipBadge from "./ShipBadge";

type Product = ProductPageData["product"];
type Offer = ProductPageData["offers"][number];

const ArrowIcon = () => (
  <svg viewBox="0 0 21 21" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4 10.5h13M12 5.5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Preço riscado + preço promocional verde + selo "SAVE $X (Y% OFF)" */
export function PriceBlock({ price, compareAt }: { price: number; compareAt?: number }) {
  const onSale = compareAt !== undefined && compareAt > price;
  return (
    <div className="mt-2">
      <div className="flex items-baseline gap-2.5">
        {onSale && <s className="text-[18px] font-medium text-black md:text-[20px]">{formatMoney(compareAt)}</s>}
        <span className={`text-[20px] font-semibold md:text-[22px] ${onSale ? "text-sale" : "text-ink"}`}>{formatMoney(price)}</span>
      </div>
      {onSale && (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-[3px] bg-sale px-2 py-1 text-[12px] font-semibold uppercase leading-none text-white">
          <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
            <path d="M19 7h-1.2A3 3 0 0015 3a3.2 3.2 0 00-3 1.7A3.2 3.2 0 009 3a3 3 0 00-2.8 4H5a2 2 0 00-2 2v2h1v8a2 2 0 002 2h12a2 2 0 002-2v-8h1V9a2 2 0 00-2-2zm-4-2a1 1 0 110 2 1 1 0 010-2zM9 5a1 1 0 110 2 1 1 0 010-2zM5 9h6v2H5zm1 4h5v6H6zm7 6v-6h5v6zm6-8h-6V9h6z" />
          </svg>
          Save {formatMoney(compareAt - price)} ({Math.round(((compareAt - price) / compareAt) * 100)}% off)
        </span>
      )}
    </div>
  );
}

export default function ProductForm({ product, offers }: { product: Product; offers: Offer[] }) {
  const { add } = useCart();
  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;
  const maxUnits = Math.max(1, ...offers.map((o) => o.quantity));

  // Botões de cor/tamanho de cima (galeria, foto da barra fixa e produto sem pacotes)
  const [main, setMain] = useState<VariantPick>({ color: product.colors[0], size: product.sizes[0] });
  // Uma escolha por par do pacote: começam em "Select", como na Stivon; os botões de cima preenchem a 1ª
  const [picks, setPicks] = useState<VariantPick[]>(() => Array.from({ length: maxUnits }, () => ({})));
  const setPick = (i: number, patch: VariantPick) =>
    setPicks((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const [offerId, setOfferId] = useState(() => (offers.find((o) => o.isDefault) ?? offers[0])?.id ?? null);
  const offer = offers.find((o) => o.id === offerId);
  const units = offer?.quantity ?? 1;
  const [error, setError] = useState<string | null>(null);

  const unitPicks = offers.length > 0 ? picks.slice(0, units) : [main];
  const image = (main.color && product.colorImages[main.color]) || product.image;

  // Trocar a cor também leva a galeria para a foto dessa cor
  const chooseColor = (c: string) => {
    setMain((m) => ({ ...m, color: c }));
    setPick(0, { color: c });
    const url = product.colorImages[c];
    if (url) window.dispatchEvent(new CustomEvent(GALLERY_SHOW_EVENT, { detail: url }));
  };

  const addToCart = () => {
    const incomplete = unitPicks.some((p) => (hasColors && !p.color) || (hasSizes && !p.size));
    if (incomplete) {
      setError("Please select a variant.");
      return;
    }
    setError(null);
    const variant = variantLabel(unitPicks);
    const item: CartProduct = offer
      ? {
          id: withVariant(offer.id, variant),
          title: `${product.title} (${offer.title})`,
          subtitle: [variant, ...offer.gifts].filter(Boolean).join(" · ") || undefined,
          price: offer.price,
          compareAt: offer.compareAt,
          image,
          // Para o carrinho mostrar cada par com a foto da cor, e o brinde como FREE
          colorImages: Object.fromEntries(
            unitPicks.flatMap((p) => (p.color && product.colorImages[p.color] ? [[p.color, product.colorImages[p.color]!]] : [])),
          ),
          gifts: offer.gifts,
          // Com variações, o carrinho mostra cada par separado e reagrupa os pacotes sozinho
          bundle:
            hasColors || hasSizes
              ? {
                  key: product.id,
                  title: product.title,
                  offers: offers.map((o) => ({
                    id: o.id,
                    quantity: o.quantity,
                    title: o.title,
                    price: o.price,
                    compareAt: o.compareAt,
                    gifts: o.gifts,
                  })),
                }
              : undefined,
        }
      : {
          id: withVariant(product.id, variant),
          title: product.title,
          subtitle: variant || product.subtitle,
          price: product.price,
          compareAt: product.compareAt,
          image,
        };
    add(item);
  };

  // Barra fixa embaixo depois que o botão principal sai da tela
  const [showSticky, setShowSticky] = useState(false);
  const atcRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const total = offer?.price ?? product.price;

  return (
    <>
      <PriceBlock price={product.price} compareAt={product.compareAt} />

      {/* Cor */}
      {hasColors && (
        <fieldset className="mt-5">
          <legend className="text-[14px] font-semibold uppercase tracking-[0.6px] text-ink">
            {variantLabels.color}: <span className="font-medium">{main.color}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const selected = main.color === c;
              return (
                <label
                  key={c}
                  title={c}
                  className={`block w-[38px] cursor-pointer overflow-hidden rounded-[6px] border-[1.6px] p-[2px] transition-colors md:w-[40px] ${
                    selected ? "border-ink" : "border-[#c9c9c9] hover:border-ink/60"
                  }`}
                >
                  <input type="radio" name="color" value={c} checked={selected} onChange={() => chooseColor(c)} className="sr-only" />
                  <Media src={product.colorImages[c]} alt={c} rounded="rounded-[4px]" sizes="40px" />
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Tamanho */}
      {hasSizes && (
        <fieldset className="mt-5">
          <legend className="text-[14px] font-semibold uppercase tracking-[0.6px] text-ink">
            {variantLabels.size}: <span className="font-medium">{main.size}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const selected = main.size === s;
              return (
                <label
                  key={s}
                  className={`flex h-[31px] min-w-[46px] cursor-pointer items-center justify-center rounded-[6px] border-[1.6px] px-2.5 text-[14px] font-semibold text-ink transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                    selected ? "border-ink bg-white" : "border-[#9b9b9b] bg-white hover:border-ink"
                  }`}
                >
                  <input type="radio" name="size" value={s} checked={selected} onChange={() => {
                      setMain((m) => ({ ...m, size: s }));
                      setPick(0, { size: s });
                    }} className="sr-only" />
                  {s}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {offers.length > 0 && offerId && (
        <BundlePicker
          offers={offers}
          selectedId={offerId}
          onSelect={setOfferId}
          picks={picks}
          onPick={setPick}
          colors={product.colors}
          sizes={product.sizes}
          colorImages={product.colorImages}
          fallbackImage={product.image}
        />
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red">
          {error}
        </p>
      )}

      <button
        ref={atcRef}
        onClick={addToCart}
        className="mt-5 flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[6px] border-[1.6px] border-accent bg-accent text-[17px] font-semibold uppercase text-white transition-opacity hover:opacity-90 active:scale-[0.99] md:text-[18px]"
      >
        Add to cart
        <ArrowIcon />
      </button>

      <ShipBadge />

      {/* Barra fixa de compra */}
      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-300 ${
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="page-width flex items-center gap-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <div className="w-11 shrink-0">
            <Media src={image} alt={product.title} rounded="rounded-md" sizes="44px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{product.title}</p>
            <p className="truncate text-[13px]">
              {offer && units > 1 ? offer.title : pickLabel(main)} · <span className="font-semibold text-ink">{formatMoney(total)}</span>
            </p>
          </div>
          <button
            onClick={addToCart}
            tabIndex={showSticky ? 0 : -1}
            className="h-11 shrink-0 rounded-[6px] bg-accent px-5 text-sm font-semibold uppercase text-white md:px-10"
          >
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
