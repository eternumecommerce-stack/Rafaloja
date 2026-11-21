import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export type SavedAddress = {
  name?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
};

/**
 * Confirma que quem está pedindo é o comprador: só ele tem o client secret do pagamento
 * (vem na URL de retorno do Stripe). Devolve o PaymentIntent e o pedido.
 */
export async function verifyBuyer(paymentIntentId: string, clientSecret: string) {
  if (!paymentIntentId || !clientSecret) return null;
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.client_secret !== clientSecret || !pi.metadata?.orderId) return null;
    const order = await db.order.findUnique({ where: { id: pi.metadata.orderId } });
    if (!order || order.stripePaymentIntentId !== pi.id) return null;
    return { pi, order };
  } catch {
    return null;
  }
}

/** Liga o pedido à conta e guarda telefone + endereço do pedido no perfil (para o próximo checkout). */
export async function linkOrderToUser(
  order: { id: string; userId: string | null; customerName: string | null; shippingAddress: Prisma.JsonValue },
  userId: string,
) {
  if (order.userId && order.userId !== userId) return;
  const shipping = (order.shippingAddress ?? null) as (SavedAddress & { phone?: string | null }) | null;
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { userId } }),
    ...(shipping
      ? [
          db.user.update({
            where: { id: userId },
            data: {
              phone: shipping.phone || undefined,
              address: {
                name: order.customerName,
                line1: shipping.line1,
                line2: shipping.line2 ?? null,
                city: shipping.city,
                state: shipping.state ?? null,
                postal_code: shipping.postal_code,
                country: shipping.country,
              },
            },
          }),
        ]
      : []),
  ]);
}
