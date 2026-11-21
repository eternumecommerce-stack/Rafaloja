import type { ReactNode } from "react";

export default function Accordion({
  title,
  children,
  className = "",
  titleClassName = "text-base font-semibold",
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <details className={`group border-b border-black/10 ${className}`}>
      <summary
        className={`flex min-h-12 cursor-pointer items-center justify-between gap-4 py-3 ${titleClassName}`}
      >
        <span>{title}</span>
        <svg
          viewBox="0 0 10 6"
          className="accordion-chevron size-3 shrink-0 transition-transform duration-300"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="rte pb-5 text-[0.95rem] leading-relaxed text-foreground/80">
        {children}
      </div>
    </details>
  );
}
