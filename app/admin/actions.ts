"use server";

import { after } from "next/server";
import { sendOrderToUtmify } from "@/lib/utmify";
import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES, STATUS_LABEL, TRACKER_STAGES, type OrderStatusValue } from "@/lib/admin-shared";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type Result = { ok: true } | { error: string };

const fail = (e: unknown): Result => {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "Unauthorized" || msg === "Forbidden") return { error: "Sem permissão." };
  console.error("Admin action error", e);
  return { error: "Não foi possível salvar. Tente de novo." };
};

const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : null;
};

// ───────────────────────── Pedidos ─────────────────────────

export async function updateOrderStatus(orderId: string, status: OrderStatusValue): Promise<Result> {
  try {
    const admin = await requireAdmin();
    if (!ORDER_STATUSES.includes(status)) return { error: "Status inválido." };
    if (status === "REFUNDED") return { error: "Use o botão de reembolso." };
    // Só as etapas do rastreio do cliente
    if (!TRACKER_STAGES.includes(status)) return { error: "Etapa inválida." };
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Pedido não encontrado." };
    if (order.status === status) return { ok: true };
    // Pedido sem pagamento (ou cancelado/reembolsado) não entra nas etapas: o pagamento só é confirmado pelo Stripe
    if (!TRACKER_STAGES.includes(order.status)) return { error: "Esse pedido não tem pagamento confirmado." };

    const now = new Date();
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status,
          // Datas de envio/entrega preenchidas na primeira vez que o status é marcado
          ...(status === "SHIPPED" && !order.shippedAt ? { shippedAt: now } : {}),
          ...(status === "DELIVERED" ? { deliveredAt: order.deliveredAt ?? now, shippedAt: order.shippedAt ?? now } : {}),
        },
      }),
      db.orderEvent.create({
        data: {
          orderId,
          type: "status",
          message: `Status: ${STATUS_LABEL[order.status]} → ${STATUS_LABEL[status]}`,
          actor: admin.email,
        },
      }),
    ]);
    // UTMify: a venda sai do faturamento do anúncio
    after(() => sendOrderToUtmify(orderId, "refunded"));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateTracking(orderId: string, trackingNumber: string, carrier: string, markShipped: boolean): Promise<Result> {
  try {
    const admin = await requireAdmin();
    const number = text(trackingNumber, 60).replace(/\s+/g, "");
    const carrierName = text(carrier, 40);
    if (number && !/^[A-Za-z0-9-]{6,60}$/.test(number)) return { error: "Código de rastreio inválido." };
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Pedido não encontrado." };

    const ship = markShipped && number && ["PAID", "FULFILLED"].includes(order.status);
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          trackingNumber: number || null,
          trackingCarrier: carrierName || null,
          ...(ship ? { status: "SHIPPED", shippedAt: order.shippedAt ?? new Date() } : {}),
        },
      }),
      db.orderEvent.create({
        data: {
          orderId,
          type: "tracking",
          message: number
            ? `Rastreio: ${number}${carrierName ? ` (${carrierName})` : ""}${ship ? " · marcado como Enviado" : ""}`
            : "Rastreio removido",
          actor: admin.email,
        },
      }),
    ]);
    // UTMify: a venda sai do faturamento do anúncio
    after(() => sendOrderToUtmify(orderId, "refunded"));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveOrderNotes(orderId: string, notes: string): Promise<Result> {
  try {
    await requireAdmin();
    await db.order.update({ where: { id: orderId }, data: { notes: text(notes, 2000) || null } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Reembolso total no Stripe. Só para pedidos pagos; muda o status para Reembolsado. */
export async function refundOrder(orderId: string): Promise<Result> {
  try {
    const admin = await requireAdmin();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order?.stripePaymentIntentId) return { error: "Pedido sem pagamento no Stripe." };
    if (!["PAID", "FULFILLED", "SHIPPED", "DELIVERED"].includes(order.status)) {
      return { error: "Só pedidos pagos podem ser reembolsados." };
    }
    // Chave de idempotência: clicar duas vezes não gera dois reembolsos
    const refund = await stripe.refunds.create(
      { payment_intent: order.stripePaymentIntentId, reason: "requested_by_customer" },
      { idempotencyKey: `refund-${order.id}` },
    );
    await db.$transaction([
      db.order.update({ where: { id: orderId }, data: { status: "REFUNDED", refundedAt: new Date() } }),
      db.orderEvent.create({
        data: {
          orderId,
          type: "refund",
          message: `Reembolso de $${(refund.amount / 100).toFixed(2)} no Stripe (${refund.status})`,
          actor: admin.email,
        },
      }),
    ]);
    // UTMify: a venda sai do faturamento do anúncio
    after(() => sendOrderToUtmify(orderId, "refunded"));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Produtos e ofertas ─────────────────────────

export async function updateProduct(
  id: string,
  input: { title: string; subtitle: string; price: string; compareAtPrice: string; image: string; active: boolean },
): Promise<Result> {
  try {
    await requireAdmin();
    const title = text(input.title, 120);
    const price = money(input.price);
    const compare = input.compareAtPrice === "" ? null : money(input.compareAtPrice);
    const image = text(input.image, 300);
    if (!title) return { error: "Informe o nome." };
    if (price === null) return { error: "Preço inválido." };
    if (input.compareAtPrice !== "" && compare === null) return { error: "Preço riscado inválido." };
    if (image && !image.startsWith("/") && !image.startsWith("https://")) return { error: "Imagem deve ser /caminho ou https://" };

    await db.product.update({
      where: { id },
      data: { title, subtitle: text(input.subtitle, 200) || null, price, compareAtPrice: compare, image: image || null, active: Boolean(input.active) },
    });
    updateTag("products");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateOffer(
  id: string,
  input: { title: string; price: string; compareAtPrice: string; badge: string; gifts: string; active: boolean },
): Promise<Result> {
  try {
    await requireAdmin();
    const title = text(input.title, 80);
    const price = money(input.price);
    const compare = input.compareAtPrice === "" ? null : money(input.compareAtPrice);
    if (!title) return { error: "Informe o nome da oferta." };
    if (price === null) return { error: "Preço inválido." };
    const gifts = String(input.gifts ?? "")
      .split("\n")
      .map((g) => g.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 6);
    await db.productOffer.update({
      where: { id },
      data: { title, price, compareAtPrice: compare, badge: text(input.badge, 60) || null, gifts, active: Boolean(input.active) },
    });
    updateTag("products");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Reviews ─────────────────────────

export async function setReviewPublished(id: string, published: boolean): Promise<Result> {
  try {
    await requireAdmin();
    await db.review.update({ where: { id }, data: { published } });
    updateTag("products");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteReview(id: string): Promise<Result> {
  try {
    await requireAdmin();
    await db.review.delete({ where: { id } });
    updateTag("products");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Mensagens ─────────────────────────

export async function setMessageStatus(id: string, status: "NEW" | "READ" | "ANSWERED"): Promise<Result> {
  try {
    await requireAdmin();
    if (!["NEW", "READ", "ANSWERED"].includes(status)) return { error: "Status inválido." };
    await db.contactMessage.update({ where: { id }, data: { status } });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ───────────────────────── Configurações ─────────────────────────

export async function saveAnnouncements(items: { text: string; active: boolean }[]): Promise<Result> {
  try {
    await requireAdmin();
    const clean = (Array.isArray(items) ? items : [])
      .map((a, position) => ({ text: text(a.text, 120), active: Boolean(a.active), position }))
      .filter((a) => a.text)
      .slice(0, 6);
    await db.$transaction([db.announcement.deleteMany(), db.announcement.createMany({ data: clean })]);
    updateTag("announcements");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

