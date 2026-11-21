import type { ReactNode } from "react";
import Media from "@/components/Media";

/**
 * Bloco "image with text" do tema: mídia + caixa de conteúdo unidas
 * (collapse-corners). No mobile empilha; com `mobileContentFirst` o texto vem
 * antes da mídia (image-with-text--mobile-reverse). No desktop fica 50/50.
 */
export default function ImageWithText({
  media = "image",
  src,
  poster,
  alt = "",
  ratio = "1 / 1",
  mediaRight = false,
  mobileContentFirst = true,
  boxClassName = "bg-white text-ink",
  sectionClassName = "bg-white pb-4 md:py-9",
  children,
}: {
  media?: "image" | "video";
  src?: string | null;
  poster?: string | null;
  alt?: string;
  /** Proporção da mídia no mobile (no desktop ela acompanha a altura do texto) */
  ratio?: string;
  mediaRight?: boolean;
  mobileContentFirst?: boolean;
  boxClassName?: string;
  sectionClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={`animate-section ${sectionClassName}`}>
      <div className="page-width">
        <div
          className={`flex gap-6 md:gap-0 ${
            mobileContentFirst ? "flex-col-reverse" : "flex-col"
          } ${mediaRight ? "md:flex-row-reverse" : "md:flex-row"}`}
        >
          <div className="md:w-1/2">
            <Media
              src={src}
              poster={poster}
              alt={alt}
              ratio={ratio}
              rounded="rounded-xl"
              video={media === "video"}
              sizes="(min-width: 750px) 50vw, 100vw"
              className="md:h-full md:min-h-[440px] md:aspect-auto!"
            />
          </div>
          <div
            className={`flex flex-col justify-center py-2 md:w-1/2 md:px-14 md:py-16 ${boxClassName}`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
