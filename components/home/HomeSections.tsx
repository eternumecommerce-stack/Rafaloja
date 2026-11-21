import Link from "next/link";
import Icon from "@/components/Icon";
import Image from "next/image";
import Media from "@/components/Media";
import { benefits, hero, homeMedia, intro, mediaLogos, power, results, trustBadges } from "@/lib/home";

const PRODUCT_URL = "/";

/** Título com a segunda parte em gradiente laranja ("title-with-highlight" do tema). */
export function GradientHeading({
  title,
  highlight,
  as: Tag = "h2",
  className = "",
}: {
  title: string;
  highlight: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={`text-ink ${className}`}>
      {title} <strong className="text-gradient italic">{highlight}</strong>
    </Tag>
  );
}

/** Estrelas verdes em quadrados (estilo do selo de avaliação do hero). */
function SquareStars() {
  return (
    <svg viewBox="0 0 512 96" className="h-[18px] w-auto md:h-5" aria-hidden="true">
      {[0, 104, 208, 312, 416].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <rect width="96" height="96" fill="#00b67a" />
          <path
            fill="#fff"
            d="M48 64.7L62.6 61l6.1 18.8zm33.6-24.3H55.9L48 16.2l-7.9 24.2H14.4l20.8 15-7.9 24.2 20.8-15 12.8-9.2z"
          />
        </g>
      ))}
    </svg>
  );
}

/** Mídia + conteúdo lado a lado no desktop; no mobile a mídia vem primeiro. */
function Split({
  mediaRight = false,
  video = false,
  src,
  alt = "",
  poster,
  eager = false,
  ratio = "1 / 1",
  contentClassName = "bg-white",
  sectionClassName = "pb-4 md:py-9",
  children,
}: {
  mediaRight?: boolean;
  video?: boolean;
  src?: string;
  alt?: string;
  poster?: string;
  /** Mídia principal da página (LCP) */
  eager?: boolean;
  ratio?: string;
  contentClassName?: string;
  sectionClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`animate-section ${sectionClassName}`}>
      <div className="page-width">
        <div
          className={`flex flex-col overflow-hidden rounded-xl ${mediaRight ? "md:flex-row-reverse" : "md:flex-row"}`}
        >
          <div className="md:w-1/2">
            <Media
              src={src}
              alt={alt}
              video={video}
              poster={poster}
              playback="loop"
              eager={eager}
              rounded="rounded-none"
              ratio={ratio}
              className="md:h-full"
              sizes="(min-width: 750px) 50vw, 100vw"
            />
          </div>
          <div className={`flex flex-col justify-center px-6 py-8 md:w-1/2 md:px-14 md:py-14 ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <Split
      src={homeMedia.hero.src}
      alt={homeMedia.hero.alt}
      eager
      contentClassName="bg-[#f9f9f9] text-center md:text-left"
      sectionClassName="pb-4 pt-4 md:pb-0 md:pt-9"
    >
      <div className="flex flex-col items-center md:items-start">
        <span className="inline-flex rounded-[14px] bg-accent px-3 py-1 text-[13px] font-semibold text-[#fffdfa] md:text-sm">
          {hero.pill}
        </span>
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <SquareStars />
          <span className="whitespace-nowrap">&nbsp;{hero.rating}</span>
        </div>
        <GradientHeading
          as="h1"
          title={hero.title}
          highlight={hero.highlight}
          className="mb-8 mt-2.5 text-[34px] leading-[1.15] md:text-[52px]"
        />
      </div>
      <Link
        href={PRODUCT_URL}
        className="flex h-14 w-full items-center justify-center rounded-md bg-accent text-[17px] font-bold tracking-[0.06em] text-white transition-transform active:scale-[0.99]"
      >
        {hero.cta}
      </Link>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-sm">
        <Icon name="verified_user" size={20} />
        {hero.guarantee}
      </p>
    </Split>
  );
}

/**
 * Faixa de logos "As seen in" rolando sem fim. A lista é duplicada e a animação anda -50%;
 * o espaço fica dentro de cada item (não em `gap`) para as duas metades terem a mesma largura
 * e o loop não dar "pulo".
 */
export function LogoMarquee() {
  const n = mediaLogos.length;
  return (
    <section className="overflow-hidden py-5" aria-label="As seen in">
      <ul className="animate-marquee flex w-max items-center">
        {[...mediaLogos, ...mediaLogos].map((logo, i) => (
          <li key={i} aria-hidden={i >= n} className="shrink-0 pr-[30px] md:pr-[50px]">
            <Image
              src={logo.src}
              alt={i >= n ? "" : logo.alt}
              width={140}
              height={60}
              sizes="140px"
              unoptimized={logo.src.endsWith(".svg")}
              className="h-[42px] w-[140px] object-contain grayscale transition hover:grayscale-0 md:h-[60px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Benefits() {
  return (
    <>
      {/* No mobile o título vem antes da imagem; no desktop fica dentro do bloco */}
      <div className="page-width pb-[9px] text-center md:hidden">
        <h2 className="text-[34px] leading-tight text-ink">{intro.title}</h2>
        <p className="text-gradient text-[34px] font-bold leading-tight">{intro.highlight}</p>
      </div>
      <Split mediaRight src={homeMedia.benefits.src} alt={homeMedia.benefits.alt}>
        <div className="hidden md:block">
          <h2 className="text-[44px] leading-tight text-ink">{intro.title}</h2>
          <p className="text-gradient text-[31px] font-bold leading-tight">{intro.highlight}</p>
        </div>
        <ul className="space-y-4 md:mt-6">
          {benefits.map((b) => (
            <li key={b.title} className="flex gap-3">
              <Icon name="check_circle" size={24} fill className="mt-0.5 text-accent" />
              <div>
                <p className="text-[15px] font-bold leading-snug md:text-base">{b.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Split>
    </>
  );
}

export function TrustBadges() {
  return (
    <section className="bg-white pb-[25px] pt-2">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-2.5 gap-y-6 px-5 md:grid-cols-4 md:gap-[30px]">
        {trustBadges.map((b) => (
          <li key={b.title} className="flex flex-col items-center gap-2.5 text-center">
            <span
              className="flex size-[65px] items-center justify-center rounded-full text-white md:size-20"
              style={{ background: "linear-gradient(135deg, #f77109 0%, #ffa500 100%)" }}
            >
              <Icon name={b.icon} size={36} fill />
            </span>
            <p className="text-[13px] font-bold leading-tight md:text-base">{b.title}</p>
            <p className="text-xs leading-normal text-[#666] md:text-[13px]">{b.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Power() {
  return (
    <Split video src={homeMedia.power.src} poster={homeMedia.power.poster} alt={homeMedia.power.alt}>
      <GradientHeading
        title={power.title}
        highlight={power.highlight}
        className="text-[28px] leading-tight md:text-[40px]"
      />
      <p className="mt-5 text-sm leading-relaxed text-ink/85 md:text-[15px]">{power.text}</p>
    </Split>
  );
}

export function Results() {
  return (
    <Split mediaRight src={homeMedia.results.src} alt={homeMedia.results.alt}>
      <GradientHeading
        title={results.title}
        highlight={results.highlight}
        className="text-[28px] leading-tight md:text-[40px]"
      />
      <p className="mt-5 text-sm leading-relaxed text-ink/85 md:text-[15px]">{results.text}</p>
      <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {results.checks.map((c) => (
          <li key={c} className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="check" size={22} className="text-[#fea056]" />
            {c}
          </li>
        ))}
      </ul>
      <Link
        href={PRODUCT_URL}
        className="mt-7 flex h-14 w-full items-center justify-center rounded-md bg-red text-[17px] font-bold tracking-[0.06em] text-white transition-transform active:scale-[0.99]"
      >
        {results.cta}
      </Link>
    </Split>
  );
}
