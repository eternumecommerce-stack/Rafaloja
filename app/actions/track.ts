"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";
import type { Prisma } from "@/lib/generated/prisma/client";

export type TrackedOrder = {
  number: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  destination: string | null;
  total: number;
  items: { title: string; quantity: number }[];
};

// Mensagem única para não revelar se o número existe com outro email
const NOT_FOUND = "We couldn't find an order with that number and email. Please check and try again.";

/** Busca o pedido pelo número + email usado na compra. */
export async function trackOrder(
  orderNumber: string,
  email: string,
): Promise<{ order: TrackedOrder } | { error: string }> {
  if (!(await rateLimit("track", 10, 10 * 60_000))) return { error: TOO_MANY };

  // Aceita "#0002", "0002" ou "2"
  const num = Number(String(orderNumber ?? "").replace(/[#\s]/g, ""));
  const cleanEmail = String(email ?? "").trim().toLowerCase().slice(0, 254);
  if (!Number.isInteger(num) || num < 1 || num > 2_147_483_647 || !cleanEmail) {
    return { error: NOT_FOUND };
  }

  const order = await db.order.findUnique({ where: { number: num }, include: { items: true } });
  if (!order || order.email?.toLowerCase() !== cleanEmail) return { error: NOT_FOUND };

  return { order: toTracked(order) };
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

function toTracked(order: OrderWithItems): TrackedOrder {
  const address = order.shippingAddress as Record<string, string | null> | null;
  const destination = address ? [address.city, address.state, address.country].filter(Boolean).join(", ") : null;
  return {
    number: String(order.number).padStart(4, "0"),
    status: order.status,
    placedAt: order.createdAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    destination,
    total: order.subtotal.toNumber(),
    items: order.items.map((i) => ({ title: i.title, quantity: i.quantity })),
  };
}

/** Pedidos do cliente logado (sem precisar de número). null = não está logado. */
export async function getMyOrders(): Promise<TrackedOrder[] | null> {
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const { user } = session;
  const orders = await db.order.findMany({
    where: {
      status: { not: "PENDING" },
      // Pedidos ligados à conta; pelo email só se ele for verificado (ex.: login com Google)
      OR: [{ userId: user.id }, ...(user.emailVerified ? [{ email: user.email.toLowerCase() }] : [])],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map(toTracked);
}
