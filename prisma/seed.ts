import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { catalogFaqs, catalogOffers, catalogProducts, photoUrl } from "../lib/catalog";
import { announcements } from "../lib/store";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

// O catálogo (produtos, pacotes, FAQ) fica em lib/catalog.ts: o mesmo usado no modo demonstração.

async function main() {
  await db.announcement.deleteMany();
  await db.announcement.createMany({
    data: announcements.map((text, position) => ({ text, position })),
  });

  // Produtos antigos (de outras versões da loja) saem do ar, mas continuam no banco por causa dos pedidos
  await db.product.updateMany({
    where: { handle: { notIn: catalogProducts.map((p) => p.handle) } },
    data: { active: false },
  });

  for (const p of catalogProducts) {
    // bundlePrices só serve para montar os pacotes (catalogOffers), não é coluna do produto
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { colors, photos, bundlePrices, ...fields } = p;
    const data = {
      ...fields,
      kind: "MAIN" as const,
      colors: colors.map((c) => c.name),
      active: true,
      image: photos[0] ? photoUrl(p.handle, photos[0]) : null,
    };
    const row = await db.product.upsert({ where: { handle: p.handle }, create: data, update: data });

    // Filhos do produto: recria tudo para o seed ser idempotente
    await db.$transaction([
      db.productMedia.deleteMany({ where: { productId: row.id } }),
      db.productOffer.deleteMany({ where: { productId: row.id } }),
      db.faq.deleteMany({ where: { productId: row.id } }),
      db.productOffer.createMany({
        data: catalogOffers(p).map((o, position) => ({ ...o, productId: row.id, position })),
      }),
      db.faq.createMany({
        data: catalogFaqs.map((f, position) => ({ ...f, productId: row.id, position })),
      }),
      // Galeria + uma miniatura por cor (THUMBNAIL, alt = nome da cor)
      db.productMedia.createMany({
        data: [
          ...photos.map((file, position) => ({
            productId: row.id,
            placement: "GALLERY" as const,
            url: photoUrl(p.handle, file),
            alt: p.title,
            position,
          })),
          ...colors.map((c, position) => ({
            productId: row.id,
            placement: "THUMBNAIL" as const,
            url: photoUrl(p.handle, c.photo),
            alt: c.name,
            position,
          })),
        ],
      }),
    ]);
  }

  const counts = {
    activeProducts: await db.product.count({ where: { active: true } }),
    offers: await db.productOffer.count(),
    faqs: await db.faq.count(),
  };
  console.log("Seed concluído:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
