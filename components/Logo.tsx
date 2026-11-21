import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/store";

/**
 * Logo da loja. Com `brand.logoSrc` usa a imagem; sem ele, desenha o logo em texto
 * (palavra espaçada + tagline pequena embaixo). A altura vem do className.
 */
export default function Logo({ className = "h-12 md:h-[72px]", link = true }: { className?: string; link?: boolean }) {
  const mark = brand.logoSrc ? (
    <Image
      src={brand.logoSrc}
      alt={brand.name}
      width={360}
      height={144}
      sizes="180px"
      loading="eager"
      unoptimized={brand.logoSrc.endsWith(".svg")}
      className={`w-auto ${className}`}
    />
  ) : (
    <span className={`flex flex-col items-center justify-center leading-none text-ink ${className}`}>
      <span className="text-[26px] font-medium tracking-[0.32em] md:text-[34px]">{brand.wordmark}</span>
      <span className="mt-1 text-[6px] font-semibold tracking-[0.18em] text-brand md:text-[7.5px]">
        {brand.tagline}
      </span>
    </span>
  );

  return link ? (
    <Link href="/" aria-label={brand.name} className="block w-fit">
      {mark}
    </Link>
  ) : (
    mark
  );
}
