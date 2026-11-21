"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/store";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { logoutAdmin } from "@/app/login/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "space_dashboard", exact: true },
  { href: "/admin/orders", label: "Pedidos", icon: "receipt_long" },
  { href: "/admin/customers", label: "Clientes", icon: "group" },
  { href: "/admin/products", label: "Produtos", icon: "inventory_2" },
  { href: "/admin/messages", label: "Mensagens", icon: "mail" },
  { href: "/admin/settings", label: "Configurações", icon: "settings" },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white" aria-hidden="true">
        {brand.name.charAt(0)}
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-wide text-white">{brand.name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
      </div>
    </div>
  );
}

export default function AdminSidebar({ admin, newMessages }: { admin: { name: string; email: string }; newMessages: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors ${
              active ? "bg-accent/15 text-white" : "text-white/45 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={icon} size={20} fill={active} className={active ? "text-accent" : ""} />
            {label}
            {href === "/admin/messages" && newMessages > 0 && (
              <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">{newMessages}</span>
            )}
            {active && !(href === "/admin/messages" && newMessages > 0) && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-white/5 pt-4">
      <div className="mb-3 flex items-center gap-3 px-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold">
          {(admin.name || admin.email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{admin.name}</p>
          <p className="truncate text-[11px] text-white/40">{admin.email}</p>
        </div>
      </div>
      <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white/45 hover:bg-white/5 hover:text-white">
        <Icon name="storefront" size={20} />
        Ver loja
      </Link>
      <form action={logoutAdmin}>
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white/45 hover:bg-white/5 hover:text-rose-300">
          <Icon name="logout" size={20} />
          Sair
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop: barra lateral fixa */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-white/5 bg-[#0b0a0e] p-5 md:flex">
        <div>
          <div className="mb-10">
            <Brand />
          </div>
          {nav}
        </div>
        {footer}
      </aside>

      {/* Mobile: barra no topo + gaveta */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#0b0a0e]/95 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="flex size-11 items-center justify-center rounded-xl bg-white/5">
          <Icon name="menu" size={22} />
        </button>
      </header>
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <div
          className={`absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-[#0b0a0e] p-5 transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div className="mb-8 flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="flex size-10 items-center justify-center">
                <Icon name="close" size={22} />
              </button>
            </div>
            {nav}
          </div>
          {footer}
        </div>
      </div>
    </>
  );
}
