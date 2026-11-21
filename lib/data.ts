import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { CartProduct } from "@/lib/product";
import { OFFER_PREFIX } from "@/lib/checkout";
import { DEMO, demoCollections, demoProductPage } from "@/lib/demo";
import { announcements } from "@/lib/store";

// Converte uma linha de Product (Decimal) num objeto serializável para Client Components
function toCartProduct(p: {
  handle: string;
  title: string;
  subtitle: string | null;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  image?: string | null;
}): CartProduct {
  return {
    id: p.handle,
    title: p.title,
    subtitle: p.subtitle ?? undefined,
    price: p.price.toNumber(),
    compareAt: p.compareAtPrice?.toNumber(),
    image: p.image ?? undefined,
  };
}

const byPosition = { position: "asc" } as const;

export async function getAnnouncements() {
  "use cache";
  cacheLife("minutes");
  cacheTag("announcements");

  if (DEMO) return announcements;
  const rows = await db.announcement.findMany({
    where: { active: true },
    orderBy: byPosition,
  });
  return rows.map((r) => r.text);
}

export async function getProductPage(handle: string): Promise<ProductPageData | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${handle}`);

  return DEMO ? demoProductPage(handle) : loadProductPage(handle);
}

async function loadProductPage(handle: string) {
  const product = await db.product.findUnique({
    where: { handle },
    include: {
      offers: { where: { active: true }, orderBy: byPosition },
      media: { orderBy: byPosition },
      features: { orderBy: byPosition },
      accordions: { orderBy: byPosition },
      blocks: { orderBy: byPosition },
      faqs: { orderBy: byPosition },
      testimonials: { orderBy: byPosition },
      reviews: { where: { published: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product || !product.active) return null;

  const [addon, bundle, reviewStats] = await Promise.all([
    db.product.findFirst({
      where: { kind: "ADDON", active: true },
      orderBy: byPosition,
    }),
    db.product.findFirst({
      where: { kind: "BUNDLE", active: true },
      orderBy: byPosition,
      include: { bundleItems: { orderBy: byPosition } },
    }),
    db.review.aggregate({
      where: { productId: product.id, published: true },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return {
    product: {
      ...toCartProduct(product),
      ratingLabel: product.ratingLabel,
      colors: product.colors,
      sizes: product.sizes,
      /** Foto de cada cor (miniaturas THUMBNAIL, alt = nome da cor) */
      colorImages: Object.fromEntries(
        product.media.filter((m) => m.placement === "THUMBNAIL" && m.alt).map((m) => [m.alt!, m.url]),
      ) as Record<string, string | null>,
      gallery: product.media
        .filter((m) => m.placement === "GALLERY")
        .map((m) => ({ url: m.url, alt: m.alt ?? product.title })),
      ugc: product.media
        .filter((m) => m.placement === "UGC")
        .map((m) => ({ url: m.url, poster: m.poster, alt: m.alt ?? "Customer video" })),
      features: product.features.map(({ icon, text }) => ({ icon, text })),
      accordions: product.accordions.map(({ title, bodyHtml }) => ({ title, bodyHtml })),
    },
    offers: product.offers.map((o) => ({
      id: OFFER_PREFIX + o.id,
      title: o.title,
      subtitle: o.gifts.join(" + ") || undefined,
      price: o.price.toNumber(),
      compareAt: o.compareAtPrice?.toNumber(),
      image: product.image ?? undefined,
      quantity: o.quantity,
      caption: o.caption,
      badge: o.badge,
      gifts: o.gifts,
      giftValue: o.giftValue?.toNumber(),
      isDefault: o.isDefault,
    })),
    addon: addon ? toCartProduct(addon) : null,
    bundle: bundle
      ? {
          ...toCartProduct(bundle),
          items: bundle.bundleItems.map(({ icon, text }) => ({ icon, text })),
        }
      : null,
    blocks: product.blocks.map(({ id, heading, bodyHtml, mediaType, mediaUrl, mediaPoster, mediaRatio, italic }) => ({
      id,
      heading,
      bodyHtml,
      media: mediaType === "VIDEO" ? ("video" as const) : ("image" as const),
      mediaUrl,
      mediaPoster,
      mediaRatio: mediaRatio ?? "1 / 1",
      italic,
    })),
    faqs: product.faqs.map(({ id, question, answerHtml }) => ({ id, question, answerHtml })),
    testimonials: product.testimonials.map(({ id, quote, author, location, rating, avatarUrl }) => ({
      id,
      quote,
      author: location ? `${author}, ${location}` : author,
      rating,
      avatarUrl,
    })),
    reviews: product.reviews.map(({ id, author, body, rating, photoUrl }) => ({ id, author, body, rating, photoUrl })),
    reviewsSummary: {
      average: (reviewStats._avg.rating ?? 0).toFixed(2),
      count: reviewStats._count,
    },
  };
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof loadProductPage>>>;

export type CollectionCard = {
  handle: string;
  title: string;
  price: number;
  compareAt?: number;
  image: string | null;
};

/** Grades de produtos da home, agrupadas pela coleção do produto (ordem de `handles`). */
export async function getCollections(handles: readonly string[]): Promise<Record<string, CollectionCard[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  if (DEMO) return demoCollections(handles);
  const rows = await db.product.findMany({
    where: { kind: "MAIN", active: true, collection: { in: [...handles] } },
    orderBy: byPosition,
    include: { media: { where: { placement: "GALLERY" }, orderBy: byPosition, take: 1 } },
  });
  return Object.fromEntries(
    handles.map((h) => [
      h,
      rows
        .filter((r) => r.collection === h)
        .map((r) => ({
          handle: r.handle,
          title: r.title,
          price: r.price.toNumber(),
          compareAt: r.compareAtPrice?.toNumber(),
          image: r.media[0]?.url ?? r.image ?? null,
        })),
    ]),
  );
}

export async function getCartExtras() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  if (DEMO) return { upsells: [] as CartProduct[], warranty: null };
  const rows = await db.product.findMany({
    where: { kind: { in: ["UPSELL", "WARRANTY"] }, active: true },
    orderBy: byPosition,
  });
  const warranty = rows.find((r) => r.kind === "WARRANTY");
  return {
    upsells: rows.filter((r) => r.kind === "UPSELL").map(toCartProduct),
    warranty: warranty ? toCartProduct(warranty) : null,
  };
}
