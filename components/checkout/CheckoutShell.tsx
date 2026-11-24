import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

/** Header do checkout no estilo Shopify: logo à esquerda, sacola à direita. */
export function CheckoutHeader() {
  return (
    <header className="border-b border-[#dedede] bg-white">
      <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-5 md:h-16 md:px-8">
        <Logo className="h-11 md:h-12" />
        <Link
          href="/"
          aria-label="Back to store"
          className="flex size-11 items-center justify-center text-[#1773b0]"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z" strokeLinejoin="round" />
            <path d="M9 8V6.5a3 3 0 016 0V8" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

/**
 * Duas colunas: formulário (branco) à esquerda e resumo (cinza) à direita no desktop.
 * No mobile o resumo aparece recolhido acima do formulário (`mobileSummary`).
 */
export function CheckoutColumns({
  main,
  summary,
  mobileSummary,
}: {
  main: ReactNode;
  summary: ReactNode;
  mobileSummary?: ReactNode;
}) {
  return (
    <div className="min-h-[calc(100dvh-57px)] md:min-h-[calc(100dvh-65px)] bg-white text-[#000] md:grid md:grid-cols-2">
      {mobileSummary && <div className="md:hidden">{mobileSummary}</div>}
      <div className="flex justify-end">
        <div className="w-full max-w-[520px] px-5 pb-6 pt-4 md:px-8 md:pt-7">{main}</div>
      </div>
      <aside className="hidden border-l border-[#dedede] bg-[#f5f5f5] md:block">
        <div className="sticky top-0 max-w-[440px] px-8 py-7">{summary}</div>
      </aside>
    </div>
  );
}

export function PolicyLinks() {
  return (
    <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#dedede] pt-4 text-xs text-[#1773b0]">
      {[].map((l) => (
        <li key={l}>
          <a href="#" className="underline underline-offset-2">
            {l}
          </a>
        </li>
      ))}
    </ul>
  );
}
