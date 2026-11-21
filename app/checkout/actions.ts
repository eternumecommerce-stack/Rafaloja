"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceCart, type CheckoutItemInput } from "@/lib/checkout";
import { stripe } from "@/lib/stripe";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { linkOrderToUser } from "@/lib/orders";
import { brand } from "@/lib/store";

export type ShippingInput = {
  name: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    postal_code: string;
    country: string;
  };
};

type Result = { clientSecret: string } | { error: string };

export type QuotedLine = { id: string; title: string; subtitle?: string; image?: string; price: number; qty: number };

/** Preços atuais do banco para exibir no checkout (o navegador pode ter preços antigos). */
export async function quoteCart(
  items: CheckoutItemInput[],
): Promise<{ lines: QuotedLine[]; total: number } | { error: string }> {
  if (!(await rateLimit("quote", 60, 60_000))) return { error: TOO_MANY };
  try {
    const priced = await priceCart(items);
    const lines = priced.lines.map((l) => ({
      id: l.id,
      title: l.title,
      subtitle: l.subtitle ?? undefined,
      image: l.image ?? undefined,
      price: l.unitPrice.toNumber(),
      qty: l.quantity,
    }));
    return { lines, total: priced.subtotal.toNumber() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid cart" };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cria o pedido (PENDING) e o PaymentIntent no momento em que o cliente clica em "Pay now".
 * O front confirma o pagamento com o clientSecret retornado.
 */
export async function createPaymentIntent(input: {
  items: CheckoutItemInput[];
  email: string;
  shipping: ShippingInput;
  newsletter?: boolean;
}): Promise<Result> {
  if (!(await rateLimit("payment-intent", 10, 10 * 60_000))) return { error: TOO_MANY };
  const email = String(input.email ?? "").trim().toLowerCase();
  if (email.length > 254) return { error: "Enter a valid email" };
  if (!email || !EMAIL_RE.test(email)) return { error: "Enter a valid email" };
  const { shipping } = input;
  if (!shipping?.name || !shipping.address?.line1 || !shipping.address.country) {
    return { error: "Enter a shipping address" };
  }
  // Limites de tamanho: nada de textos gigantes no banco ou no Stripe
  const tooLong = [shipping.name, shipping.phone, ...Object.values(shipping.address ?? {})].some(
    (v) => typeof v === "string" && v.length > 200,
  );
  if (tooLong) return { error: "Some fields are too long" };
  if (!shipping.phone || shipping.phone.replace(/\D/g, "").length < 7) {
    return { error: "Enter a phone number so we can contact you about your delivery" };
  }

  let priced;
  try {
    priced = await priceCart(input.items);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid cart" };
  }
  if (priced.amountCents < 50) return { error: "Order total is too low" };

  // Cliente logado: o pedido fica ligado à conta (aparece em "My account")
  const session = await getSession().catch(() => null);

  let order;
  try {
    order = await db.order.create({
      data: {
        userId: session?.user.id ?? null,
        email,
        customerName: shipping.name,
        shippingAddress: { ...shipping.address, phone: shipping.phone ?? null },
        subtotal: priced.subtotal,
        items: {
          create: priced.lines.map(({ productId, title, variant, image, unitPrice, quantity }) => ({
            productId,
            // A cor/tamanho escolhidos ficam no título do item (o painel mostra isso para separar o pedido)
            title: variant ? `${title} — ${variant}` : title,
            image,
            unitPrice,
            quantity,
          })),
        },
      },
    });
  } catch (e) {
    console.error("Order create error", e);
    return { error: "We couldn't create your order. Please try again." };
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: priced.amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: `${brand.name} order #${order.number}`,
      metadata: { orderId: order.id, orderNumber: String(order.number) },
      // O endereço de entrega é anexado pelo Address Element / carteira na confirmação
      // (o Stripe não deixa o front alterar um shipping definido com a chave secreta).
    });
    await db.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: pi.id },
    });
    if (input.newsletter) await subscribeToNewsletter(email, "checkout");
    // Logado: guarda telefone e endereço na conta para o próximo checkout
    if (session) await linkOrderToUser(order, session.user.id).catch(() => {});
    return { clientSecret: pi.client_secret! };
  } catch (e) {
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    console.error("Stripe PaymentIntent error", e);
    return { error: "We couldn't start the payment. Please try again." };
  }
}
