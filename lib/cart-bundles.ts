// Pacotes no carrinho: o cliente vê cada par (cor/tamanho) como um produto separado, mas por
// baixo os pares do mesmo produto são agrupados nos pacotes (Triple, Duo, Single) para o preço
// sair com desconto. O servidor confere o preço de cada pacote (lib/checkout.ts).

import { splitVariant, withVariant, type BundleInfo, type CartProduct } from "@/lib/product";

type Line = CartProduct & { qty: number };

/** Pares de uma linha de pacote, repetidos pela quantidade da linha */
export function picksOfLine(l: Line): string[] {
  const { variant } = splitVariant(l.id);
  if (!variant) return [];
  const one = variant.split(" | ");
  return Array.from({ length: l.qty }, () => one).flat();
}

/**
 * Monta as linhas do carrinho para uma lista de pares: usa o maior pacote que cabe
 * (Triple, depois Duo, depois Single). Ex.: 4 pares = Triple + Single.
 */
export function packPicks(picks: string[], info: BundleInfo, colorImages: Record<string, string>, fallbackImage?: string): Line[] {
  const offers = [...info.offers].sort((a, b) => b.quantity - a.quantity);
  const out: Line[] = [];
  let rest = [...picks];
  while (rest.length > 0) {
    const offer = offers.find((o) => o.quantity <= rest.length);
    if (!offer) break;
    const chunk = rest.slice(0, offer.quantity);
    rest = rest.slice(offer.quantity);
    const color = chunk[0]?.split(" / ")[0];
    out.push({
      id: withVariant(offer.id, chunk.join(" | ")),
      title: `${info.title} (${offer.title})`,
      subtitle: [chunk.join(" | "), ...offer.gifts].filter(Boolean).join(" · "),
      price: offer.price,
      compareAt: offer.compareAt,
      image: (color && colorImages[color]) || fallbackImage,
      colorImages,
      gifts: offer.gifts,
      bundle: info,
      qty: 1,
    });
  }
  return out;
}

/** Junta todos os pares de um produto que já estão no carrinho, com novos pares, e reagrupa */
export function repackProduct(lines: Line[], key: string, change: (picks: string[]) => string[], extra?: CartProduct): Line[] {
  const mine = lines.filter((l) => l.bundle?.key === key);
  const info = extra?.bundle ?? mine[0]?.bundle;
  if (!info) return lines;
  const colorImages = Object.assign({}, ...mine.map((l) => l.colorImages ?? {}), extra?.colorImages ?? {});
  const fallback = extra?.image ?? mine[0]?.image;
  const picks = change(mine.flatMap(picksOfLine));
  // Mantém o produto na mesma posição do carrinho
  const at = lines.findIndex((l) => l.bundle?.key === key);
  const others = lines.filter((l) => l.bundle?.key !== key);
  const packed = packPicks(picks, info, colorImages, fallback);
  if (at < 0) return [...others, ...packed];
  const before = lines.slice(0, at).filter((l) => l.bundle?.key !== key);
  return [...before, ...packed, ...others.slice(before.length)];
}

/** Uma linha do carrinho como o cliente vê: cada cor/tamanho é um produto; brinde é FREE */
export type CartRow =
  | {
      kind: "item";
      key: string;
      title: string;
      subtitle?: string;
      image?: string | null;
      /** preço de 1 unidade (no pacote, a parte de cada par) */
      unitPrice: number;
      unitCompare?: number;
      qty: number;
      /** linha comum do carrinho (produto sem pacote) */
      lineId?: string;
      /** par de um produto com pacote */
      bundleKey?: string;
      pick?: string;
    }
  | { kind: "gift"; key: string; title: string; qty: number };

/**
 * Transforma as linhas do carrinho nas linhas que aparecem para o cliente.
 * `priceOf` permite usar o preço conferido pelo servidor (checkout).
 */
export function cartRows(lines: Line[], priceOf: (l: Line) => number = (l) => l.price): CartRow[] {
  const rows: CartRow[] = [];
  const done = new Set<string>();
  for (const l of lines) {
    const key = l.bundle?.key;
    if (!key || splitVariant(l.id).variant === "") {
      rows.push({
        kind: "item",
        key: l.id,
        title: l.title,
        subtitle: l.subtitle,
        image: l.image,
        unitPrice: priceOf(l),
        unitCompare: l.compareAt,
        qty: l.qty,
        lineId: l.id,
      });
      continue;
    }
    if (done.has(key)) continue;
    done.add(key);
    const mine = lines.filter((x) => x.bundle?.key === key);
    const picks = mine.flatMap(picksOfLine);
    if (picks.length === 0) continue;
    // O desconto dos pacotes é dividido igualmente entre os pares do produto
    const total = mine.reduce((n, x) => n + priceOf(x) * x.qty, 0);
    const compareTotal = mine.reduce((n, x) => n + (x.compareAt ?? priceOf(x)) * x.qty, 0);
    const unit = total / picks.length;
    const unitCompare = compareTotal / picks.length;
    const colorImages = Object.assign({}, ...mine.map((x) => x.colorImages ?? {}));
    const counts = new Map<string, number>();
    for (const p of picks) counts.set(p, (counts.get(p) ?? 0) + 1);
    for (const [pick, qty] of counts) {
      rows.push({
        kind: "item",
        key: `${key}::${pick}`,
        title: l.bundle!.title,
        subtitle: pick,
        image: colorImages[pick.split(" / ")[0]] ?? l.image,
        unitPrice: unit,
        unitCompare: unitCompare > unit + 0.005 ? unitCompare : undefined,
        qty,
        bundleKey: key,
        pick,
      });
    }
    const gifts = new Map<string, number>();
    for (const x of mine) for (const g of x.gifts ?? []) gifts.set(g, (gifts.get(g) ?? 0) + x.qty);
    for (const [g, qty] of gifts) rows.push({ kind: "gift", key: `${key}::gift::${g}`, title: g, qty });
  }
  return rows;
}
