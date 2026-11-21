"use client";

import { useRef, useState } from "react";
import Media from "@/components/Media";
import Stars from "@/components/Stars";
import type { ProductPageData } from "@/lib/data";

export default function ReviewsCarousel({
  reviews,
  summary,
}: {
  reviews: ProductPageData["reviews"];
  summary: ProductPageData["reviewsSummary"];
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // Largura de um passo: o card + o espaço entre cards (0 no mobile, 16px no desktop)
  const step = () => {
    const track = trackRef.current;
    const card = track?.children[0] as HTMLElement | undefined;
    if (!track || !card) return 300;
    return card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  };

  const scrollBy = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (track) setActive(Math.round(track.scrollLeft / step()));
  };

  const arrow = (dir: -1 | 1) => (
    <button
      aria-label={dir < 0 ? "Previous reviews" : "Next reviews"}
      onClick={() => scrollBy(dir)}
      className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white md:flex"
    >
      <svg viewBox="0 0 10 6" className={`size-3 ${dir < 0 ? "rotate-90" : "-rotate-90"}`} aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );

  if (reviews.length === 0) return null;

  return (
    <section className="animate-section bg-white py-8 text-black md:py-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="px-4 text-center">
          <h2 className="text-[24px] md:text-[28px]">Real Results. Real Customers</h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[15px]">
            <span className="flex items-center gap-1.5">
              <Stars rating={Number(summary.average)} color="var(--review-star)" size={18} />
              <span>
                {summary.average} <span className="text-review-star">★</span> ({summary.count})
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm text-[#108474]">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M12 1l2.6 2.2 3.4-.4.9 3.3 3 1.7-1.2 3.2 1.2 3.2-3 1.7-.9 3.3-3.4-.4L12 23l-2.6-2.2-3.4.4-.9-3.3-3-1.7L3.3 13 2.1 9.8l3-1.7.9-3.3 3.4.4zm-1.3 14.6l6-6-1.4-1.4-4.6 4.6-2.3-2.3-1.4 1.4z" />
              </svg>
              Verified
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 md:px-4">
          {arrow(-1)}
          {/* Mobile: um card por vez, centralizado; desktop: 3 por vez */}
          <ul
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:gap-4"
          >
            {reviews.map((r) => (
              <li
                key={r.id}
                className="w-full shrink-0 snap-center px-4 md:w-[calc((100%-2rem)/3)] md:snap-start md:px-0"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-lg bg-[#f9f9f9]">
                  <Media
                    src={r.photoUrl}
                    alt={`Review photo by ${r.author}`}
                    rounded="rounded-none"
                    sizes="(min-width: 750px) 350px, calc(100vw - 2rem)"
                  />
                  <div className="flex flex-1 flex-col p-4 text-base">
                    <Stars rating={r.rating} color="var(--review-star)" size={16} />
                    <p className="line-clamp-4 mt-2 text-[15px] leading-relaxed">{r.body}</p>
                    <p className="mt-auto pt-3 text-sm font-semibold">{r.author}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {arrow(1)}
        </div>

        {/* Setas + contador no mobile (sem a "espiada" do próximo card) */}
        <div className="mt-3 flex items-center justify-center gap-4 text-sm md:hidden">
          <button
            aria-label="Previous review"
            onClick={() => scrollBy(-1)}
            disabled={active === 0}
            className="flex size-11 items-center justify-center disabled:opacity-30"
          >
            <svg viewBox="0 0 10 6" className="size-3 rotate-90" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <span className="min-w-12 text-center tabular-nums">
            {Math.min(active + 1, reviews.length)} / {reviews.length}
          </span>
          <button
            aria-label="Next review"
            onClick={() => scrollBy(1)}
            disabled={active >= reviews.length - 1}
            className="flex size-11 items-center justify-center disabled:opacity-30"
          >
            <svg viewBox="0 0 10 6" className="size-3 -rotate-90" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
