"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import useScrollLock from "@/components/useScrollLock";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/Logo";
import { menuLinks } from "@/lib/store";

const iconBtn = "flex size-11 items-center justify-center text-ink transition-transform hover:scale-105";

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden="true">
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[21px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
  </svg>
);

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[21px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" strokeLinecap="round" />
  </svg>
);

const BagIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[21px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M5 8.5h14l-.9 11.3a1.5 1.5 0 01-1.5 1.4H7.4a1.5 1.5 0 01-1.5-1.4z" strokeLinejoin="round" />
    <path d="M9 8.5V7a3 3 0 016 0v1.5" />
  </svg>
);

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen } = useCart();
  const { data: session } = authClient.useSession();
  const initial = session ? (session.user.name || session.user.email).charAt(0).toUpperCase() : null;
  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="page-width grid grid-cols-[1fr_auto_1fr] items-center py-2.5 md:py-6">
        {/* Esquerda: menu + busca */}
        <div className="-ml-2.5 flex items-center">
          <button aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className={iconBtn}>
            <MenuIcon />
          </button>
          <button aria-label="Search" className={`${iconBtn} md:ml-1`}>
            <SearchIcon />
          </button>
        </div>

        <Logo className="h-12 md:h-[72px]" />

        {/* Direita: conta + carrinho */}
        <div className="-mr-2.5 flex items-center justify-self-end">
          <Link href="/account" aria-label={session ? "My account" : "Log in"} className={iconBtn}>
            {initial ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                {initial}
              </span>
            ) : (
              <AccountIcon />
            )}
          </Link>
          <button aria-label={`Cart, ${count} items`} onClick={() => setOpen(true)} className={`${iconBtn} relative`}>
            <BagIcon />
            {count > 0 && (
              <span className="absolute bottom-1.5 right-1 flex size-[18px] items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Menu lateral (mobile e desktop) */}
      <div className={`fixed inset-0 z-50 ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-label="Menu"
          className={`absolute left-0 top-0 flex h-dvh w-full max-w-[400px] flex-col bg-white transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Menu</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className={`${iconBtn} -mr-2`}>
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            <ul>
              {menuLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center justify-between px-6 text-[17px] text-ink hover:bg-bg-2"
                  >
                    {l.label}
                    <svg viewBox="0 0 10 6" className="size-2.5 -rotate-90" aria-hidden="true">
                      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line bg-bg-2 px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            <Link href="/account" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <AccountIcon />
              {session ? "Account" : "Log in"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
