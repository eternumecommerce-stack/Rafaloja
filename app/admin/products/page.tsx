import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import ProductsManager, { type AdminOffer, type AdminProduct, type AdminReview } from "@/components/admin/ProductsManager";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";

const KIND_ORDER = ["MAIN", "BUNDLE", "ADDON", "UPSELL", "WARRANTY"];

async function AdminProductsPageContent() {
  await requireAdminPage();
  const [products, offers, reviews] = await Promise.all([
    db.product.findMany({ orderBy: [{ position: "asc" }] }),
    db.productOffer.findMany({ orderBy: { position: "asc" }, include: { product: { select: { title: true } } } }),
    db.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: { select: { title: true } } } }),
  ]);

  const p: AdminProduct[] = products
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.position - b.position)
    .map((x) => ({
      id: x.id,
      handle: x.handle,
      kind: x.kind,
      title: x.title,
      subtitle: x.subtitle,
      price: x.price.toNumber(),
      compareAtPrice: x.compareAtPrice?.toNumber() ?? null,
      image: x.image,
      active: x.active,
    }));
  const o: AdminOffer[] = offers.map((x) => ({
    id: x.id,
    productTitle: x.product.title,
    title: x.title,
    quantity: x.quantity,
    price: x.price.toNumber(),
    compareAtPrice: x.compareAtPrice?.toNumber() ?? null,
    badge: x.badge,
    gifts: x.gifts,
    active: x.active,
  }));
  const r: AdminReview[] = reviews.map((x) => ({
    id: x.id,
    productTitle: x.product.title,
    author: x.author,
    body: x.body,
    rating: x.rating,
    photoUrl: x.photoUrl,
    published: x.published,
    createdAt: x.createdAt.toISOString(),
  }));

  return <ProductsManager products={p} offers={o} reviews={r} />;
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminProductsPageContent />
    </Suspense>
  );
}
