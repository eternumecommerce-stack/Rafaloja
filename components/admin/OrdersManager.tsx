"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundOrder, saveOrderNotes, updateOrderStatus, updateTracking } from "@/app/admin/actions";
import Icon from "@/components/Icon";
import Media from "@/components/Media";
import { STATUS_ICON, STATUS_LABEL, TRACKER_STAGES, TRACKER_TEXT, dateTime, orderNo, usd, type OrderStatusValue } from "@/lib/admin-shared";
import { useToast } from "./Toast";
import { Card, EmptyState, PageHeader, StatusPill, btnGhost, btnPrimary, inputCls, labelCls } from "./ui";

export type AdminOrder = {
  id: string;
  number: number;
  status: OrderStatusValue;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: { line1: string; line2: string | null; city: string; state: string | null; postalCode: string; country: string } | null;
  hasAccount: boolean;
  total: number;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  notes: string | null;
  paymentIntentId: string | null;
  items: { id: string; title: string; quantity: number; unitPrice: number; image: string | null }[];
  events: { id: string; type: string; message: string; actor: string | null; createdAt: string }[];
};

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"];

/** Próximo passo natural do fluxo de entrega */
const NEXT_STEP: Partial<Record<OrderStatusValue, { to: OrderStatusValue; label: string; icon: string }>> = {
  PAID: { to: "FULFILLED", label: "Marcar como preparando o pedido", icon: "inventory_2" },
  FULFILLED: { to: "SHIPPED", label: "Marcar como enviado", icon: "local_shipping" },
  SHIPPED: { to: "DELIVERED", label: "Marcar como entregue", icon: "task_alt" },
};

function OrderDrawer({ order, onClose, stripeDashboard }: { order: AdminOrder; onClose: () => void; stripeDashboard: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.trackingCarrier ?? "USPS");
  const [markShipped, setMarkShipped] = useState(true);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [confirmRefund, setConfirmRefund] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = (fn: () => Promise<{ ok: true } | { error: string }>, success: string) =>
    startTransition(async () => {
      const res = await fn().catch(() => ({ error: "Erro de conexão." }));
      if ("error" in res) toast.show("error", res.error);
      else {
        toast.show("success", success);
        router.refresh();
      }
    });

  const next = NEXT_STEP[order.status];
  const address = order.address
    ? [order.name, order.address.line1, order.address.line2, `${order.address.city}${order.address.state ? `, ${order.address.state}` : ""} ${order.address.postalCode}`, order.address.country]
        .filter(Boolean)
        .join("\n")
    : null;
  const canRefund = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status) && order.paymentIntentId;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Pedido ${orderNo(order.number)}`}>
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col bg-[#121016] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            <p className="font-mono text-[12px] text-white/40">{orderNo(order.number)}</p>
            <h2 className="text-lg font-bold">{order.name || order.email || "Cliente"}</h2>
            <p className="text-[12px] text-white/40">{dateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <button onClick={onClose} aria-label="Fechar" className="flex size-10 items-center justify-center rounded-xl hover:bg-white/5">
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Etapa do pedido: as mesmas do rastreio do cliente (Track Your Order) */}
          <section>
            <p className={labelCls}>Etapa no rastreio do cliente</p>
            {TRACKER_STAGES.includes(order.status) ? (
              <>
                {next && (
                  <button disabled={pending} onClick={() => run(() => updateOrderStatus(order.id, next.to), `Etapa: ${STATUS_LABEL[next.to]}`)} className={`${btnPrimary} mb-3 w-full`}>
                    <Icon name={next.icon} size={18} />
                    {next.label}
                  </button>
                )}
                <ol className="space-y-1.5">
                  {TRACKER_STAGES.map((s, i) => {
                    const reached = TRACKER_STAGES.indexOf(order.status) >= i;
                    const current = s === order.status;
                    return (
                      <li key={s}>
                        <button
                          disabled={pending || current}
                          onClick={() => run(() => updateOrderStatus(order.id, s), `Etapa: ${STATUS_LABEL[s]}`)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            current ? "bg-white text-black" : reached ? "bg-white/10 text-white" : "bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon name={reached ? "check_circle" : STATUS_ICON[s]} size={18} fill={reached} />
                          <span className="flex-1">
                            <span className="block text-[13px] font-semibold">{STATUS_LABEL[s]}</span>
                            <span className={`block text-[11px] ${current ? "text-black/50" : "text-white/40"}`}>Cliente vê: “{TRACKER_TEXT[s]}”</span>
                          </span>
                          {current && <span className="text-[10px] font-bold uppercase tracking-wider">Atual</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <p className="rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-white/60">
                {order.status === "PENDING"
                  ? "Pagamento não concluído: o pedido entra nas etapas quando o Stripe confirmar o pagamento."
                  : `Pedido ${STATUS_LABEL[order.status].toLowerCase()}: fora das etapas de rastreio.`}
              </p>
            )}
          </section>

          {/* Cliente */}
          <Card className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className={labelCls + " mb-0"}>Cliente</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${order.hasAccount ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                {order.hasAccount ? "Com conta" : "Visitante"}
              </span>
            </div>
            {order.email && (
              <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-white/80 hover:text-white">
                <Icon name="mail" size={18} className="text-white/40" /> {order.email}
              </a>
            )}
            {order.phone && (
              <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-white/80 hover:text-white">
                <Icon name="call" size={18} className="text-white/40" /> {order.phone}
              </a>
            )}
            {address && (
              <div className="flex items-start gap-2">
                <Icon name="location_on" size={18} className="mt-0.5 text-white/40" />
                <p className="flex-1 whitespace-pre-line text-white/80">{address}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(address).then(() => toast.show("success", "Endereço copiado"))}
                  className="flex size-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10"
                  aria-label="Copiar endereço"
                  title="Copiar endereço (etiqueta)"
                >
                  <Icon name="content_copy" size={16} />
                </button>
              </div>
            )}
          </Card>

          {/* Itens */}
          <Card className="p-4">
            <p className={labelCls}>Itens</p>
            <ul className="space-y-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  <div className="w-12 shrink-0">
                    <Media src={i.image} alt={i.title} rounded="rounded-lg" sizes="48px" />
                  </div>
                  <span className="flex-1">
                    <span className="font-semibold">{i.quantity}×</span> {i.title}
                  </span>
                  <span className="text-white/70">{usd(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
              <span className="text-white/50">Total (frete grátis)</span>
              <span className="text-base font-bold">{usd(order.total)}</span>
            </div>
            {order.paymentIntentId && (
              <a
                href={stripeDashboard + order.paymentIntentId}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
              >
                Ver pagamento no Stripe <Icon name="open_in_new" size={14} />
              </a>
            )}
          </Card>

          {/* Entrega / rastreio */}
          <Card className="p-4">
            <p className={labelCls}>Entrega</p>
            <div className="mb-3 grid grid-cols-2 gap-2 text-[12px] text-white/50">
              <span>Enviado: {order.shippedAt ? dateTime(order.shippedAt) : "—"}</span>
              <span>Entregue: {order.deliveredAt ? dateTime(order.deliveredAt) : "—"}</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => updateTracking(order.id, tracking, carrier, markShipped), "Rastreio salvo");
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Código de rastreio" className={inputCls} />
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputCls}>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c} className="bg-[#16141b]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {["PAID", "FULFILLED"].includes(order.status) && (
                <label className="flex items-center gap-2 text-[13px] text-white/60">
                  <input type="checkbox" checked={markShipped} onChange={(e) => setMarkShipped(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                  Marcar como enviado ao salvar
                </label>
              )}
              <button disabled={pending} className={btnGhost}>
                <Icon name="local_shipping" size={18} /> Salvar rastreio
              </button>
            </form>
          </Card>

          {/* Notas internas */}
          <Card className="p-4">
            <p className={labelCls}>Notas internas</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Só a equipe vê" className={inputCls} />
            <button disabled={pending || notes === (order.notes ?? "")} onClick={() => run(() => saveOrderNotes(order.id, notes), "Notas salvas")} className={`${btnGhost} mt-2`}>
              Salvar notas
            </button>
          </Card>

          {/* Histórico */}
          <Card className="p-4">
            <p className={labelCls}>Histórico</p>
            <ol className="space-y-3 text-[13px]">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-white/85">{e.message}</p>
                    <p className="text-[11px] text-white/35">
                      {dateTime(e.createdAt)}
                      {e.actor ? ` · ${e.actor}` : ""}
                    </p>
                  </div>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-white/25" />
                <div>
                  <p className="text-white/85">Pedido criado</p>
                  <p className="text-[11px] text-white/35">{dateTime(order.createdAt)}</p>
                </div>
              </li>
            </ol>
          </Card>

          {/* Reembolso */}
          {canRefund && (
            <Card className="border-rose-500/20 p-4">
              <p className={labelCls + " text-rose-300/80"}>Reembolso</p>
              <p className="mb-3 text-[13px] text-white/50">
                Devolve {usd(order.total)} ao cliente pelo Stripe e marca o pedido como reembolsado. Não dá para desfazer. Digite
                <span className="font-mono text-white"> REEMBOLSAR </span>para confirmar.
              </p>
              <div className="flex gap-2">
                <input value={confirmRefund} onChange={(e) => setConfirmRefund(e.target.value)} className={inputCls} placeholder="REEMBOLSAR" />
                <button
                  disabled={pending || confirmRefund !== "REEMBOLSAR"}
                  onClick={() => run(() => refundOrder(order.id), "Reembolso feito")}
                  className="h-10 shrink-0 rounded-xl bg-rose-500 px-4 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  Reembolsar
                </button>
              </div>
            </Card>
          )}
        </div>
      </aside>
      {toast.node}
    </div>
  );
}

export default function OrdersManager({
  orders,
  initialStatus,
  initialOpen,
  stripeDashboard,
}: {
  orders: AdminOrder[];
  initialStatus: string;
  initialOpen: string | null;
  stripeDashboard: string;
}) {
  const [filter, setFilter] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const q = search.trim().toLowerCase().replace(/^#/, "");
  const filtered = orders.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (!q) return true;
    return [String(o.number), String(o.number).padStart(4, "0"), o.name, o.email, o.phone, o.trackingNumber]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q));
  });

  const open = orders.find((o) => o.id === openId) ?? null;
  const toShip = (counts.PAID ?? 0) + (counts.FULFILLED ?? 0);

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${orders.length} pedidos · ${toShip} aguardando envio`} />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {["ALL", ...TRACKER_STAGES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-semibold transition ${
              filter === s ? "bg-accent text-white" : "border border-white/5 bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            {s === "ALL" ? "Todos" : STATUS_LABEL[s as OrderStatusValue]} ({s === "ALL" ? orders.length : counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Icon name="search" size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nº do pedido, nome, email, telefone ou rastreio"
          className={`${inputCls} py-3 pl-11`}
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon="receipt_long" text="Nenhum pedido encontrado." />
        ) : (
          <>
            {/* Desktop: tabela */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-white/5 text-[11px] uppercase tracking-[0.12em] text-white/35">
                  <th className="px-5 py-3.5 font-semibold">Pedido</th>
                  <th className="px-5 py-3.5 font-semibold">Cliente</th>
                  <th className="px-5 py-3.5 font-semibold">Itens</th>
                  <th className="px-5 py-3.5 font-semibold">Data</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 font-mono text-[12px] text-white/45">{orderNo(o.number)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{o.name || "—"}</p>
                      <p className="text-[12px] text-white/40">{o.email}</p>
                    </td>
                    <td className="max-w-[240px] px-5 py-3.5 text-[13px] text-white/60">
                      <p className="truncate">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-white/45">{dateTime(o.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold">{usd(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: cards */}
            <ul className="divide-y divide-white/5 md:hidden">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setOpenId(o.id)} className="w-full px-4 py-3.5 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] text-white/45">{orderNo(o.number)}</span>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-1 font-semibold">{o.name || o.email || "—"}</p>
                    <div className="mt-0.5 flex justify-between text-[12px] text-white/45">
                      <span className="truncate pr-3">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</span>
                      <span className="font-semibold text-white">{usd(o.total)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {open && <OrderDrawer key={open.id + open.status + (open.trackingNumber ?? "")} order={open} onClose={() => setOpenId(null)} stripeDashboard={stripeDashboard} />}
    </>
  );
}
