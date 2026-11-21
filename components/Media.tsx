import Image from "next/image";
import MediaPlaceholder from "./MediaPlaceholder";
import PlayableVideo from "./PlayableVideo";

type Props = {
  src?: string | null;
  alt?: string;
  /** Proporção do quadro, ex.: "1 / 1" ou "727 / 572" */
  ratio?: string;
  rounded?: string;
  className?: string;
  /** `sizes` do next/image: quanto da tela a imagem ocupa */
  sizes?: string;
  fit?: "cover" | "contain";
  /** Imagem principal da página (LCP): carrega antes */
  eager?: boolean;
  video?: boolean;
  poster?: string | null;
  /** Vídeo: "loop" toca sozinho, mudo; "click" começa pausado com botão de play */
  playback?: "loop" | "click";
};

/**
 * Mídia real (imagem otimizada ou vídeo) mantendo o mesmo quadro do placeholder.
 * Sem `src`, mostra o bloco cinza.
 */
export default function Media({
  src,
  alt = "",
  ratio = "1 / 1",
  rounded = "rounded-xl",
  className = "",
  sizes = "100vw",
  fit = "cover",
  eager = false,
  video = false,
  poster,
  playback = "loop",
}: Props) {
  if (!src) return <MediaPlaceholder ratio={ratio} rounded={rounded} video={video} className={className} label={alt || undefined} />;

  const frame = `relative w-full overflow-hidden bg-placeholder ${rounded} ${className}`;

  if (video) {
    return (
      <div className={frame} style={{ aspectRatio: ratio }}>
        {playback === "click" ? (
          <PlayableVideo src={src} poster={poster ?? undefined} label={alt} />
        ) : (
          <video
            src={src}
            poster={poster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={alt}
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <div className={frame} style={{ aspectRatio: ratio }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        // SVG não passa pelo otimizador de imagens
        unoptimized={src.endsWith(".svg")}
        className={fit === "contain" ? "object-contain p-[12%]" : "object-cover"}
      />
    </div>
  );
}
