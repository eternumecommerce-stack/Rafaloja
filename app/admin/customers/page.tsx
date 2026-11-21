import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
import CustomersManager, { type AdminCustomer } from "@/components/admin/CustomersManager";
import { requireAdminPage } from "@/lib/admin";
import { SALE_STATUSES, type OrderStatusValue } from "@/lib/admin-shared";
import { db } from "@/lib/db";

async function AdminCustomersPageContent() {
  await requireAdminPage();

  const [users, orders] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true } }),
    db.order.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, status: true, email: true, customerName: true, shippingAddress: true, subtotal: true, createdAt: true, userId: true },
    }),
  ]);

  // Cliente = email (conta e/ou pedidos como visitante)
  const byEmail = new Map<string, AdminCustomer>();
  const get = (email: string) => {
    let c = byEmail.get(email);
    if (!c) {
      c = { email, name: null, phone: null, address: null, hasAccount: false, since: null, ordersCount: 0, spent: 0, lastOrderAt: null, orders: [] };
      byEmail.set(email, c);
    }
    return c;
  };

  for (const u of users) {
    const c = get(u.email.toLowerCase());
    const a = u.address as Record<string, string | null> | null;
    c.name = u.name;
    c.phone = u.phone;
    c.hasAccount = true;
    c.since = u.createdAt.toISOString();
    if (a) c.address = [a.line1, a.line2, `${a.city ?? ""}${a.state ? `, ${a.state}` : ""} ${a.postal_code ?? ""}`, a.country].filter(Boolean).join(", ");
  }

  for (const o of orders) {
    if (!o.email) continue;
    const c = get(o.email.toLowerCase());
    const a = o.shippingAddress as Record<string, string | null> | null;
    const sale = SALE_STATUSES.includes(o.status as OrderStatusValue);
    c.orders.push({ id: o.id, number: o.number, status: o.status as OrderStatusValue, total: o.subtotal.toNumber(), createdAt: o.createdAt.toISOString() });
    if (sale) {
      c.ordersCount += 1;
      c.spent += o.subtotal.toNumber();
    }
    // Pedidos vêm do mais novo para o mais antigo: o primeiro define os dados mais recentes
    if (!c.lastOrderAt) {
      c.lastOrderAt = o.createdAt.toISOString();
      c.name ??= o.customerName;
      c.phone ??= a?.phone ?? null;
      if (!c.address && a) c.address = [a.line1, a.line2, `${a.city ?? ""}${a.state ? `, ${a.state}` : ""} ${a.postal_code ?? ""}`, a.country].filter(Boolean).join(", ");
    }
  }

  const customers = [...byEmail.values()].sort((a, b) => (b.lastOrderAt ?? b.since ?? "").localeCompare(a.lastOrderAt ?? a.since ?? ""));
  return <CustomersManager customers={customers} />;
}

// O conteúdo lê a sessão e o banco: fica dentro de Suspense para a navegação no painel ser instantânea
export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminCustomersPageContent />
    </Suspense>
  );
}
