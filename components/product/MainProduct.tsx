import TrustStars from "@/components/TrustStars";
import type { ProductPageData } from "@/lib/data";
import ProductForm from "./ProductForm";
import ProductGallery from "./ProductGallery";

/** Topo da página do produto: galeria (esquerda) + avaliação, título, preço, variações e compra (direita) */
export default function MainProduct({ product, offers }: Pick<ProductPageData, "product" | "offers">) {
  // Sem fotos ainda: mostra blocos cinza no lugar
  const gallery = product.gallery.length > 0 ? product.gallery : Array.from({ length: 6 }, () => ({ url: null, alt: product.title }));

  return (
    <section className="page-width pb-10 pt-0 md:pb-16 md:pt-2">
      <div className="md:grid md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] md:gap-10">
        <div className="-mx-6 md:sticky md:top-[150px] md:mx-0 md:self-start">
          <ProductGallery images={gallery} />
        </div>

        <div className="pt-4 md:pt-6">
          {product.ratingLabel && (
            <div className="flex items-center gap-2 text-[14px]">
              <TrustStars size={15} />
              <span>({product.ratingLabel})</span>
            </div>
          )}
          <h1 className="mt-2 text-[22px] leading-[1.2] md:text-[24px]">{product.title}</h1>

          <ProductForm product={product} offers={offers} />
        </div>
      </div>
    </section>
  );
}
