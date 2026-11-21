"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Media from "@/components/Media";

type GalleryImage = { url: string | null; alt: string };

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 10 6" className={`size-3 ${dir === "left" ? "rotate-90" : "-rotate-90"}`} aria-hidden="true">
    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** Evento que leva a galeria até uma foto (detail = url). Usado ao trocar a cor no formulário. */
export const GALLERY_SHOW_EVENT = "product-gallery:show";

export default function ProductGallery({ images }: { images: GalleryImage[] }) {
  const mediaCount = images.length;
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(mediaCount - 1, i));
      setActive(idx);
      const track = trackRef.current;
      const slide = track?.children[idx] as HTMLElement | undefined;
      if (track && slide && track.offsetParent !== null) {
        track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
      }
      const thumbs = thumbsRef.current;
      const thumb = thumbs?.children[idx] as HTMLElement | undefined;
      // Rola só a fileira de miniaturas (sem mexer na rolagem da página)
      if (thumbs && thumb && thumbs.offsetParent !== null) {
        thumbs.scrollTo({ left: thumb.offsetLeft - thumbs.offsetLeft - (thumbs.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
      }
    },
    [mediaCount],
  );

  useEffect(() => {
    const onShow = (e: Event) => {
      const idx = images.findIndex((img) => img.url === (e as CustomEvent<string>).detail);
      if (idx >= 0) goTo(idx);
    };
    window.addEventListener(GALLERY_SHOW_EVENT, onShow);
    return () => window.removeEventListener(GALLERY_SHOW_EVENT, onShow);
  }, [images, goTo]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0] as HTMLElement | undefined;
    // Carrossel escondido (desktop) tem largura 0: não dá para calcular a foto
    if (!first || first.offsetWidth === 0) return;
    const idx = Math.round(track.scrollLeft / first.offsetWidth);
    setActive(Math.max(0, Math.min(mediaCount - 1, idx)));
  };

  return (
    <div>
      {/* Mobile: foto de borda a borda, uma por vez, com bolinhas embaixo (como na referência) */}
      <div className="md:hidden">
        <ul
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          aria-label="Product media"
        >
          {images.map((img, i) => (
            <li key={i} className="w-full shrink-0 snap-center" aria-hidden={i !== active}>
              <Media src={img.url} alt={img.alt} rounded="rounded-none" sizes="100vw" eager={i === 0} />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-center gap-0.5 py-2" role="tablist" aria-label="Choose image">
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1} of ${mediaCount}`}
              onClick={() => goTo(i)}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all ${i === active ? "size-2.5 bg-foreground" : "size-[7px] bg-foreground/25"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: main media + thumbnail slider */}
      <div className="hidden md:block">
        <Media
          src={images[active]?.url}
          alt={images[active]?.alt}
          rounded="rounded-none"
          sizes="(min-width: 1200px) 715px, 62vw"
          eager={active === 0}
        />
        <div className="relative mt-3 flex items-center gap-2">
          <button
            aria-label="Previous"
            onClick={() => goTo(active - 1)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10"
          >
            <Chevron dir="left" />
          </button>
          <ul ref={thumbsRef} className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <li key={i} className="w-[calc((100%-2rem)/5)] shrink-0">
                <button
                  onClick={() => goTo(i)}
                  aria-label={`Load image ${i + 1} in gallery view`}
                  aria-current={i === active}
                  className={`block w-full border p-0.5 transition-colors ${
                    i === active ? "border-ink" : "border-transparent hover:border-ink/30"
                  }`}
                >
                  <Media src={img.url} alt="" rounded="rounded-none" sizes="140px" />
                </button>
              </li>
            ))}
          </ul>
          <button
            aria-label="Next"
            onClick={() => goTo(active + 1)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10"
          >
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </div>
  );
}
