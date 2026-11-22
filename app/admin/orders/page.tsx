import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import OrdersManager, { type AdminOrder } from "@/components/admin/OrdersManager";
import { requireAdminPage } from "@/lib/admin";
import { TRACKER_STAGES, type OrderStatusValue } from "@/lib/admin-shared";
import { db } from "@/lib/db";

async function AdminOrdersPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && TRACKER_STAGES.includes(sp.status as OrderStatusValue) ? sp.status : "ALL";
  const open = typeof sp.open === "string" ? sp.open : null;

  // Checkouts sem pagamento não são pedidos (o Dashboard mostra quantos ficaram assim)
  const rows = await db.order.findMany({
    where: { status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
    },
  });

  const orders: AdminOrder[] = rows.map((o) => {
    const addr = (o.shippingAddress ?? null) as Record<string, string | null> | null;
    return {
      id: o.id,
      number: o.number,
      status: o.status as OrderStatusValue,
      email: o.email,
      name: o.customerName,
      phone: addr?.phone ?? null,
      address: addr
        ? {
            line1: addr.line1 ?? "",
            line2: addr.line2 ?? null,
            city: addr.city ?? "",
            state: addr.state ?? null,
            postalCode: addr.postal_code ?? "",
            country: addr.country ?? "",
          }
        : null,
      hasAccount: Boolean(o.userId),
      total: o.subtotal.toNumber(),
      createdAt: o.createdAt.toISOString(),
      shippedAt: o.shippedAt?.toISOString() ?? null,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      trackingNumber: o.trackingNumber,
      trackingCarrier: o.trackingCarrier,
      notes: o.notes,
      paymentIntentId: o.stripePaymentIntentId,
      items: o.items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unitPrice: i.unitPrice.toNumber(), image: i.image })),
      events: o.events.map((e) => ({ id: e.id, type: e.type, message: e.message, actor: e.actor, createdAt: e.createdAt.toISOString() })),
    };
  });

  // Link do pagamento no painel do Stripe (modo teste ou produção, conforme a chave secreta ou restrita)
  const stripeDashboard = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "")
    ? "https://dashboard.stripe.com/payments/"
    : "https://dashboard.stripe.com/test/payments/";

  return <OrdersManager orders={orders} initialStatus={status} initialOpen={open} stripeDashboard={stripeDashboard} />;
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminOrdersPage(props: Parameters<typeof AdminOrdersPageContent>[0]) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminOrdersPageContent {...props} />
    </Suspense>
  );
}
