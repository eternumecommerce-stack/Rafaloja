"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-6 z-30 flex size-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-all duration-300 md:right-8 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      } bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-[6rem]`}
    >
      <svg viewBox="0 0 10 6" className="size-3 rotate-180" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
