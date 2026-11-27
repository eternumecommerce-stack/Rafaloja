import "server-only";
import { db } from "@/lib/db";
import { sanitizeTracking } from "@/lib/tracking";

/**
 * Envio de pedidos para a UTMify (API "Credenciais de API"), para as vendas aparecerem no
 * dashboard atribuídas ao anúncio de origem. Doc: https://docs.utmify.com.br/
 *
 * O mesmo pedido é enviado de novo a cada mudança (waiting_payment → paid → refunded), sempre
 * com o mesmo orderId e createdAt. Falhas só são registradas no log: nunca travam a compra.
 * Sem UTMIFY_API_TOKEN no .env, nada é enviado.
 */

const ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

export type UtmifyStatus = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";

/** "YYYY-MM-DD HH:MM:SS" em UTC, como a UTMify pede */
const utc = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 19).replace("T", " ") : null);
const cents = (n: { toNumber(): number } | number) => Math.round((typeof n === "number" ? n : n.toNumber()) * 100);

export async function sendOrderToUtmify(orderId: string, status: UtmifyStatus, opts: { isTest?: boolean } = {}) {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return { skipped: true as const };

  try {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { error: "order not found" };

    const address = (order.shippingAddress ?? {}) as Record<string, string | null>;
    const tracking = (order.tracking ?? {}) as Record<string, unknown>;
    const total = cents(order.subtotal);

    const body = {
      orderId: order.id,
      platform: "StivonStore",
      // Stripe: cartão e carteiras (Apple Pay / Google Pay) contam como cartão
      paymentMethod: "credit_card",
      status,
      createdAt: utc(order.createdAt),
      approvedDate: status === "waiting_payment" || status === "refused" ? null : utc(order.paidAt ?? new Date()),
      refundedAt: status === "refunded" || status === "chargedback" ? utc(order.refundedAt ?? new Date()) : null,
      customer: {
        name: order.customerName || order.email || "Customer",
        email: order.email ?? "",
        phone: address.phone ?? null,
        document: null,
        country: address.country ?? undefined,
        ip: typeof tracking.ip === "string" ? tracking.ip : undefined,
      },
      products: order.items.map((i) => ({
        id: i.productId ?? i.id,
        name: i.title,
        planId: null,
        planName: null,
        quantity: i.quantity,
        priceInCents: cents(i.unitPrice),
      })),
      trackingParameters: sanitizeTracking(tracking),
      // A taxa do Stripe não é conhecida aqui: informa o total como valor recebido
      commission: { totalPriceInCents: total, gatewayFeeInCents: 0, userCommissionInCents: total, currency: "USD" },
      ...(opts.isTest ? { isTest: true } : {}),
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-token": token },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[utmify] pedido ${order.number} (${status}): HTTP ${res.status} ${text}`);
      return { error: `HTTP ${res.status}`, detail: text };
    }
    return { ok: true as const };
  } catch (e) {
    console.error(`[utmify] falha ao enviar pedido ${orderId} (${status})`, e);
    return { error: e instanceof Error ? e.message : "unknown" };
  }
}
