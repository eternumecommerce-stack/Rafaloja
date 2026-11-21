import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Card, EmptyState, PageHeader, StatCard, StatusPill } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin";
import { SALE_STATUSES, dateTime, orderNo, usd, type OrderStatusValue } from "@/lib/admin-shared";
import { db } from "@/lib/db";

/** Data de N dias atrás (a página roda no request, depois da checagem de login) */
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function AdminDashboardContent() {
  await requireAdminPage();
  const since30 = daysAgo(30);

  const [sales, sales30, customers, toShip, inTransit, awaitingPayment, newMessages, recent] = await Promise.all([
    db.order.aggregate({ where: { status: { in: SALE_STATUSES } }, _sum: { subtotal: true }, _count: true }),
    db.order.aggregate({ where: { status: { in: SALE_STATUSES }, createdAt: { gte: since30 } }, _sum: { subtotal: true }, _count: true }),
    db.order.findMany({ where: { status: { in: SALE_STATUSES } }, distinct: ["email"], select: { email: true } }),
    db.order.count({ where: { status: { in: ["PAID", "FULFILLED"] } } }),
    db.order.count({ where: { status: "SHIPPED" } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { select: { title: true, quantity: true } } },
    }),
  ]);

  const revenue = sales._sum.subtotal?.toNumber() ?? 0;
  const avg = sales._count ? revenue / sales._count : 0;

  const actions = [
    { href: "/admin/orders?status=PAID", icon: "inventory_2", label: "Pedidos para enviar", value: toShip, tone: "text-amber-300" },
    { href: "/admin/orders?status=SHIPPED", icon: "local_shipping", label: "Em trânsito", value: inTransit, tone: "text-sky-300" },
    { href: "/admin/messages", icon: "mail", label: "Mensagens novas", value: newMessages, tone: "text-accent" },
    { href: "/admin/orders?status=PENDING", icon: "schedule", label: "Pagamentos não concluídos", value: awaitingPayment, tone: "text-white/50" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da loja" />

      <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard label="Faturamento" value={usd(revenue)} icon="payments" hint={`${usd(sales30._sum.subtotal?.toNumber() ?? 0)} nos últimos 30 dias`} />
        <StatCard label="Pedidos pagos" value={String(sales._count)} icon="shopping_bag" hint={`${sales30._count} nos últimos 30 dias`} />
        <StatCard label="Ticket médio" value={usd(avg)} icon="trending_up" />
        <StatCard label="Clientes" value={String(customers.length)} icon="group" hint="com pelo menos 1 compra" />
      </div>

      <h2 className="mb-3 mt-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Precisa de ação</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.label} href={a.href} className="group">
            <Card className="flex items-center gap-4 p-4 transition group-hover:border-white/15">
              <Icon name={a.icon} size={24} className={a.tone} />
              <div className="flex-1">
                <p className="text-2xl font-bold">{a.value}</p>
                <p className="text-[12px] text-white/45">{a.label}</p>
              </div>
              <Icon name="chevron_right" size={20} className="text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-base font-semibold">Últimos pedidos</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[12px] font-semibold text-white/45 hover:text-white">
            Ver todos <Icon name="chevron_right" size={18} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="receipt_long" text="Nenhum pedido ainda." />
        ) : (
          <ul className="divide-y divide-white/5">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders?open=${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-white/[0.02]">
                  <span className="w-14 font-mono text-[12px] text-white/40">{orderNo(o.number)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.customerName || o.email || "—"}</p>
                    <p className="truncate text-[12px] text-white/40">
                      {o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")} · {dateTime(o.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={o.status as OrderStatusValue} />
                  <span className="w-24 text-right text-sm font-semibold">{usd(o.subtotal.toNumber())}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
