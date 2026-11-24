import type { Metadata } from "next";
import Media from "@/components/Media";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import Newsletter from "@/components/home/Newsletter";
import { getCollections } from "@/lib/data";
import { brand, collections } from "@/lib/store";

export const metadata: Metadata = {
  title: { absolute: brand.name },
  description: brand.description,
};

export default async function HomePage() {
  const grids = await getCollections(collections.map((c) => c.handle));
  // O Skyline Max aparece de novo na versão White, fechando a última linha dos ortopédicos
  const skyline = grids.orthopedic?.find((p) => p.handle === "skyline-max-triple-waterproof");
  const skylineWhite = skyline && { ...skyline, image: "/midia/produtos/skyline-max-triple-waterproof/07-white.webp", color: "White" };

  return (
    <>
      {/* Banner principal (imagem de borda a borda) */}
      <section aria-label="Banner">
        <Media
          src="/midia/home/banner.png"
          alt="Orthopedic comfort, advanced support and all-day performance"
          rounded="rounded-none"
          ratio="1720 / 855"
          sizes="100vw"
          eager
        />
      </section>

      {collections.map((c) => (
        <FeaturedCollection
          key={c.handle}
          id={c.handle}
          title={c.title}
          scheme={c.scheme}
          products={grids[c.handle] ?? []}
          mobileFiller={c.handle === "orthopedic" ? skylineWhite : undefined}
        />
      ))}

      <Newsletter />
    </>
  );
}
