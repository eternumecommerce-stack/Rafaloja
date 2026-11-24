import Link from "next/link";
import Media from "@/components/Media";
import type { CollectionCard } from "@/lib/data";
import { formatMoney } from "@/lib/product";

/** `color`: abre a página do produto já com essa cor escolhida */
type Card = CollectionCard & { color?: string };

function ProductCard({ p, className }: { p: Card; className?: string }) {
  const onSale = p.compareAt !== undefined && p.compareAt > p.price;
  return (
    <li className={className}>
      <Link href={`/products/${p.handle}${p.color ? `?color=${encodeURIComponent(p.color)}` : ""}`} className="group block h-full bg-white">
        <div className="relative overflow-hidden">
          <Media
            src={p.image}
            alt={p.title}
            rounded="rounded-none"
            sizes="(min-width: 750px) 270px, 50vw"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {onSale && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#111] px-[13px] pb-[6px] pt-[5px] text-[12px] leading-none tracking-[1px] text-white">
              Sale
            </span>
          )}
        </div>
        <div className="p-2.5 pb-4">
          <h3 className="text-[13px] font-semibold leading-[1.3] tracking-[-0.3px] text-ink underline-offset-[3px] group-hover:underline">
            {p.title}
          </h3>
          <p className="mt-[7px] flex flex-wrap items-baseline tracking-[1px] text-ink">
            {onSale && (
              <>
                <span className="sr-only">Regular price</span>
                <s className="mr-2.5 text-[13px] text-body">{formatMoney(p.compareAt!)} USD</s>
                <span className="sr-only">Sale price</span>
              </>
            )}
            <span className="text-[15px] md:text-[16px]">{formatMoney(p.price)} USD</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Grade de produtos de uma coleção ("Trainers", "Premium Orthopedic Shoes"...) */
export default function FeaturedCollection({
  id,
  title,
  products,
  scheme = "light",
  mobileFiller,
}: {
  id: string;
  title: string;
  products: CollectionCard[];
  /** "blue" = faixa azul-clara com título branco */
  scheme?: "light" | "blue";
  /** Produto extra que preenche o espaço vazio na última linha da grade (mobile e desktop) */
  mobileFiller?: Card;
}) {
  if (products.length === 0) return null;
  return (
    <section id={id} className={`scroll-mt-32 py-9 ${scheme === "blue" ? "bg-[#7da6cb]" : "bg-white"}`}>
      <div className="page-width">
        <h2 className={`text-[22px] tracking-[-0.3px] md:text-[24px] ${scheme === "blue" ? "text-white" : "text-ink"}`}>{title}</h2>
        <ul className="mt-[30px] grid grid-cols-2 gap-2 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.handle} p={p} />
          ))}
          {/* Só aparece onde há buraco na última linha: 2 colunas no mobile, 4 no desktop */}
          {mobileFiller && products.length % 4 !== 0 && (
            <ProductCard
              key={`filler-${mobileFiller.handle}`}
              p={mobileFiller}
              className={products.length % 2 === 1 ? undefined : "hidden md:block"}
            />
          )}
        </ul>
      </div>
    </section>
  );
}
