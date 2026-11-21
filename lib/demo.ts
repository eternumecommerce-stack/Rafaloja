import "server-only";
import type { CollectionCard, ProductPageData } from "@/lib/data";
import { catalogFaqs, catalogOffers, catalogProducts, photoUrl } from "@/lib/catalog";

/**
 * Modo demonstração: com STORE_DEMO=1 no .env a loja roda sem banco, usando o catálogo de
 * lib/catalog.ts. Dá para navegar, escolher variações e montar o carrinho; criar pedido,
 * pagar, login e painel continuam precisando do banco.
 */
export const DEMO = process.env.STORE_DEMO === "1";

/** Id fixo de cada pacote no modo demo: "demo-<handle>-<quantidade>" */
const demoOfferId = (handle: string, quantity: number) => `demo-${handle}-${quantity}`;

export function demoProductPage(handle: string): ProductPageData | null {
  const p = catalogProducts.find((x) => x.handle === handle);
  if (!p) return null;
  return {
    product: {
      id: p.handle,
      title: p.title,
      subtitle: p.subtitle,
      price: p.price,
      compareAt: p.compareAtPrice,
      image: p.photos[0] ? photoUrl(p.handle, p.photos[0]) : undefined,
      ratingLabel: p.ratingLabel ?? null,
      colors: p.colors.map((c) => c.name),
      sizes: p.sizes,
      colorImages: Object.fromEntries(p.colors.map((c) => [c.name, photoUrl(p.handle, c.photo)])),
      gallery: p.photos.map((f) => ({ url: photoUrl(p.handle, f), alt: p.title })),
      ugc: [],
      features: [],
      accordions: [],
    },
    offers: catalogOffers(p).map((o) => ({
      id: `offer:${demoOfferId(p.handle, o.quantity)}`,
      title: o.title,
      subtitle: o.gifts.join(" + ") || undefined,
      price: o.price,
      compareAt: o.compareAtPrice,
      image: undefined,
      quantity: o.quantity,
      caption: o.caption,
      badge: o.badge ?? null,
      gifts: o.gifts,
      giftValue: o.giftValue,
      isDefault: o.isDefault,
    })),
    addon: null,
    bundle: null,
    blocks: [],
    faqs: catalogFaqs.map((f, i) => ({ id: `faq-${i}`, ...f })),
    testimonials: [],
    reviews: [],
    reviewsSummary: { average: "0.00", count: 0 },
  };
}

export function demoCollections(handles: readonly string[]): Record<string, CollectionCard[]> {
  return Object.fromEntries(
    handles.map((h) => [
      h,
      catalogProducts
        .filter((p) => p.collection === h)
        .sort((a, b) => a.position - b.position)
        .map((p) => ({ handle: p.handle, title: p.title, price: p.price, compareAt: p.compareAtPrice, image: p.photos[0] ? photoUrl(p.handle, p.photos[0]) : null })),
    ]),
  );
}

/** Linhas do carrinho no formato que o checkout espera (preços como número) */
export function demoCartRows(handles: string[], offerIds: string[]) {
  const products = catalogProducts
    .filter((p) => handles.includes(p.handle))
    .map((p) => ({
      id: p.handle,
      handle: p.handle,
      title: p.title,
      subtitle: p.subtitle ?? null,
      image: p.photos[0] ? photoUrl(p.handle, p.photos[0]) : null,
      price: p.price,
      colors: p.colors.map((c) => c.name),
      sizes: p.sizes,
    }));
  const offers = catalogProducts.flatMap((p) =>
    catalogOffers(p)
      .filter((o) => offerIds.includes(demoOfferId(p.handle, o.quantity)))
      .map((o) => ({
        id: demoOfferId(p.handle, o.quantity),
        productId: p.handle,
        title: o.title,
        gifts: o.gifts,
        quantity: o.quantity,
        price: o.price,
        product: {
          image: p.photos[0] ? photoUrl(p.handle, p.photos[0]) : null,
          title: p.title,
          colors: p.colors.map((c) => c.name),
          sizes: p.sizes,
        },
      })),
  );
  return { products, offers };
}
