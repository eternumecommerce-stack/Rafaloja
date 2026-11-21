"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { dateShort, dateTime, orderNo, usd, type OrderStatusValue } from "@/lib/admin-shared";
import { Card, EmptyState, PageHeader, StatusPill, inputCls, labelCls } from "./ui";

export type AdminCustomer = {
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  hasAccount: boolean;
  since: string | null;
  ordersCount: number;
  spent: number;
  lastOrderAt: string | null;
  orders: { id: string; number: number; status: OrderStatusValue; total: number; createdAt: string }[];
};

type Sort = "recent" | "spent" | "orders";

function CustomerDrawer({ c, onClose }: { c: AdminCustomer; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={c.name ?? c.email}>
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-[#121016]">
        <div className="flex items-start justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-base font-bold">
              {(c.name || c.email).charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-lg font-bold">{c.name || "Sem nome"}</h2>
              <p className="text-[12px] text-white/45">{c.hasAccount ? `Conta desde ${c.since ? dateShort(c.since) : "—"}` : "Comprou como visitante"}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex size-10 items-center justify-center rounded-xl hover:bg-white/5">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className={labelCls}>Total gasto</p>
              <p className="text-xl font-bold">{usd(c.spent)}</p>
            </Card>
            <Card className="p-4">
              <p className={labelCls}>Pedidos pagos</p>
              <p className="text-xl font-bold">{c.ordersCount}</p>
            </Card>
          </div>
          <Card className="space-y-3 p-4">
            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-white/80 hover:text-white">
              <Icon name="mail" size={18} className="text-white/40" /> {c.email}
            </a>
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-white/80 hover:text-white">
                <Icon name="call" size={18} className="text-white/40" /> {c.phone}
              </a>
            )}
            {c.address && (
              <p className="flex items-start gap-2 text-white/80">
                <Icon name="location_on" size={18} className="mt-0.5 text-white/40" /> {c.address}
              </p>
            )}
          </Card>
          <div>
            <p className={labelCls}>Pedidos</p>
            {c.orders.length === 0 ? (
              <p className="text-white/40">Nenhum pedido.</p>
            ) : (
              <ul className="space-y-2">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 hover:border-white/15">
                      <span className="font-mono text-[12px] text-white/45">{orderNo(o.number)}</span>
                      <span className="flex-1 text-[12px] text-white/45">{dateTime(o.createdAt)}</span>
                      <StatusPill status={o.status} />
                      <span className="font-semibold">{usd(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function CustomersManager({ customers }: { customers: AdminCustomer[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState<AdminCustomer | null>(null);

  const q = search.trim().toLowerCase();
  const list = customers
    .filter((c) => !q || [c.name, c.email, c.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(q)))
    .sort((a, b) =>
      sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.ordersCount - a.ordersCount : (b.lastOrderAt ?? b.since ?? "").localeCompare(a.lastOrderAt ?? a.since ?? ""),
    );

  const buyers = customers.filter((c) => c.ordersCount > 0).length;
  const accounts = customers.filter((c) => c.hasAccount).length;

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${customers.length} contatos · ${buyers} compraram · ${accounts} com conta`} />
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Icon name="search" size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone" className={`${inputCls} py-3 pl-11`} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputCls} md:w-56`} aria-label="Ordenar">
          <option value="recent" className="bg-[#16141b]">Compra mais recente</option>
          <option value="spent" className="bg-[#16141b]">Quem gastou mais</option>
          <option value="orders" className="bg-[#16141b]">Mais pedidos</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon="group" text="Nenhum cliente encontrado." />
        ) : (
          <ul className="divide-y divide-white/5">
            {list.map((c) => (
              <li key={c.email}>
                <button onClick={() => setOpen(c)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] md:px-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[13px] font-bold text-white/60">
                    {(c.name || c.email).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold">
                      {c.name || "Sem nome"}
                      {c.hasAccount && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Conta</span>}
                    </p>
                    <p className="truncate text-[12px] text-white/40">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                  </div>
                  <div className="hidden text-right text-[12px] text-white/45 sm:block">
                    <p>{c.ordersCount} pedido{c.ordersCount === 1 ? "" : "s"}</p>
                    <p>{c.lastOrderAt ? dateShort(c.lastOrderAt) : "—"}</p>
                  </div>
                  <span className="w-24 text-right font-semibold">{usd(c.spent)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {open && <CustomerDrawer c={open} onClose={() => setOpen(null)} />}
    </>
  );
}
