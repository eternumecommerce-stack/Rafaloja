import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { splitVariant } from "@/lib/product";
import { after } from "next/server";
import { sendOrderToUtmify } from "@/lib/utmify";
import { DEMO, demoCartRows } from "@/lib/demo";

export type CheckoutItemInput = { id: string; qty: number };

/** Linhas do carrinho com id `offer:<id>` são ofertas por quantidade (ProductOffer). */
export const OFFER_PREFIX = "offer:";

/** Modo demonstração (sem banco): mesmas linhas, vindas de lib/catalog.ts */
function demoRows(handles: string[], offerIds: string[]) {
  const { products, offers } = demoCartRows(handles, offerIds);
  return [
    products.map((p) => ({ ...p, price: new Prisma.Decimal(p.price) })),
    offers.map((o) => ({ ...o, price: new Prisma.Decimal(o.price) })),
  ] as const;
}

/**
 * Confere a variação enviada pelo navegador: uma escolha "Cor / Tamanho" por unidade do pacote,
 * só com cores e tamanhos que existem no produto. Produto sem variações não aceita variação.
 */
function assertVariant(variant: string, product: { colors: string[]; sizes: string[] }, units: number) {
  const hasOptions = product.colors.length > 0 || product.sizes.length > 0;
  if (!hasOptions) {
    if (variant) throw new Error("Invalid product option");
    return;
  }
  if (variant.length > 300) throw new Error("Invalid product option");
  const picks = variant.split(" | ");
  if (picks.length !== units) throw new Error("Please choose a color and size for every item");
  for (const pick of picks) {
    const parts = pick.split(" / ");
    const color = product.colors.length ? parts.shift() : undefined;
    const size = product.sizes.length ? parts.shift() : undefined;
    if (
      parts.length > 0 ||
      (product.colors.length && !product.colors.includes(color ?? "")) ||
      (product.sizes.length && !product.sizes.includes(size ?? ""))
    ) {
      throw new Error("Please choose a color and size for every item");
    }
  }
}

/**
 * Recalcula o carrinho com os preços do banco. O cliente só informa id + quantidade;
 * preço, título e disponibilidade sempre vêm do servidor.
 */
export async function priceCart(items: CheckoutItemInput[]) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error("Invalid cart");
  }
  const qtyById = new Map<string, number>();
  for (const item of items) {
    if (typeof item?.id !== "string" || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      throw new Error("Invalid cart item");
    }
    qtyById.set(item.id, (qtyById.get(item.id) ?? 0) + item.qty);
  }

  // Cada id pode trazer a variação escolhida: "offer:abc::Grey / 9 | Black / 10"
  const ids = [...qtyById.keys()];
  const parsed = ids.map((id) => ({ id, ...splitVariant(id) }));
  const offerIds = [...new Set(parsed.filter((p) => p.baseId.startsWith(OFFER_PREFIX)).map((p) => p.baseId.slice(OFFER_PREFIX.length)))];
  const handles = [...new Set(parsed.filter((p) => !p.baseId.startsWith(OFFER_PREFIX)).map((p) => p.baseId))];

  const [products, offers] = DEMO ? demoRows(handles, offerIds) : await Promise.all([
    handles.length
      ? db.product.findMany({ where: { handle: { in: handles }, active: true } })
      : [],
    offerIds.length
      ? db.productOffer.findMany({
          where: { id: { in: offerIds }, active: true, product: { active: true } },
          include: { product: { select: { image: true, title: true, colors: true, sizes: true } } },
        })
      : [],
  ]);
  if (products.length !== handles.length || offers.length !== offerIds.length) {
    throw new Error("Some products are unavailable");
  }
  const productByHandle = new Map(products.map((p) => [p.handle, p]));
  const offerById = new Map(offers.map((o) => [o.id, o]));

  const lines = parsed.map(({ id, baseId, variant }) => {
    const quantity = qtyById.get(id)!;
    if (baseId.startsWith(OFFER_PREFIX)) {
      const o = offerById.get(baseId.slice(OFFER_PREFIX.length))!;
      assertVariant(variant, o.product, o.quantity);
      return {
        id,
        productId: o.productId,
        title: `${o.product.title} (${o.title})`,
        subtitle: [variant, ...o.gifts].filter(Boolean).join(" · ") || null,
        variant,
        image: o.product.image,
        unitPrice: o.price,
        quantity,
      };
    }
    const p = productByHandle.get(baseId)!;
    assertVariant(variant, p, 1);
    return {
      id,
      productId: p.id,
      title: p.title,
      subtitle: variant || p.subtitle,
      variant,
      image: p.image,
      unitPrice: p.price,
      quantity,
    };
  });

  const subtotal = lines.reduce(
    (sum, l) => sum.add(l.unitPrice.mul(l.quantity)),
    new Prisma.Decimal(0),
  );
  return { lines, subtotal, amountCents: subtotal.mul(100).round().toNumber() };
}

/** Marca o pedido como pago a partir de um PaymentIntent confirmado (idempotente). */
export async function markOrderPaid(pi: Stripe.PaymentIntent) {
  if (pi.status !== "succeeded") return null;
  const orderId = pi.metadata?.orderId;
  if (!orderId) return null;

  const changed = await db.order.updateMany({
    where: { id: orderId, stripePaymentIntentId: pi.id, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  // UTMify: só na primeira confirmação (webhook e página de sucesso podem chegar os dois)
  if (changed.count === 1) after(() => sendOrderToUtmify(orderId, "paid"));
  return db.order.findUnique({ where: { id: orderId }, include: { items: true } });
}
