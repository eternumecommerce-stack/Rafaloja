import Media from "@/components/Media";
import Stars from "@/components/Stars";
import type { ProductPageData } from "@/lib/data";

export default function Testimonials({
  testimonials,
}: {
  testimonials: ProductPageData["testimonials"];
}) {
  if (testimonials.length === 0) return null;
  return (
    <section className="animate-section bg-white py-9 text-ink">
      <div className="mx-auto max-w-[1400px] px-4 md:px-20">
        <h2 className="mb-6 text-center text-[26px] md:mb-10 md:text-[31px]">
          What Our Customers Say about Us
        </h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="flex flex-col items-center rounded-3xl bg-bg-2 px-6 py-8 text-center"
            >
              <Stars rating={t.rating} size={20} />
              <p className="mt-4 text-[15px] leading-relaxed">&quot;{t.quote}&quot;</p>
              <div className="mt-6 w-16">
                <Media src={t.avatarUrl} alt={t.author} rounded="rounded-full" sizes="64px" />
              </div>
              <p className="mt-3 text-sm font-semibold">{t.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
