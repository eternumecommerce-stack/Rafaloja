import Media from "@/components/Media";
import Stars from "@/components/Stars";
import type { ProductPageData } from "@/lib/data";

/** Grid "Real Customers. Real Results": 2 colunas no mobile, 3 no desktop, nome e estrelas sobre a foto. */
export default function ReviewsGrid({
  reviews,
  summary,
}: {
  reviews: ProductPageData["reviews"];
  summary: ProductPageData["reviewsSummary"];
}) {
  if (reviews.length === 0) return null;
  return (
    <section className="animate-section bg-white py-8 md:py-12">
      <div className="mx-auto max-w-[1100px] px-4">
        <div className="text-center">
          <h2 className="text-[24px] text-black md:text-[28px]">Real Customers. Real Results</h2>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm md:text-[15px]">
            <Stars rating={Number(summary.average)} color="var(--review-star)" size={17} />
            <span className="whitespace-nowrap">
              {summary.average} out of 5 · Based on {summary.count} reviews
            </span>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
          {reviews.slice(0, 9).map((r) => (
            <li key={r.id} className="group relative overflow-hidden rounded-3xl bg-black">
              <Media src={r.photoUrl} alt={`Review photo by ${r.author}`} rounded="rounded-none" ratio="4 / 5" sizes="(min-width: 750px) 360px, 50vw" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-white md:p-4">
                <Stars rating={r.rating} color="#ffffff" size={14} />
                <p className="mt-1 text-[13px] font-semibold md:text-sm">{r.author}</p>
              </div>
              {/* No desktop o texto da review aparece ao passar o mouse */}
              <div className="absolute inset-0 hidden flex-col justify-center bg-black/80 p-5 text-[#f9f9f9] opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                <Stars rating={r.rating} color="#ffffff" size={14} />
                <p className="mt-2 line-clamp-6 text-sm leading-relaxed">{r.body}</p>
                <p className="mt-3 text-sm font-semibold">{r.author}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
