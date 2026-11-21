import type Stripe from "stripe";
import { markOrderPaid } from "@/lib/checkout";
import { stripe } from "@/lib/stripe";

// Confirma pedidos mesmo se o cliente fechar a aba antes de voltar para /checkout/success.
// Em dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook` e copie o whsec_ para o .env
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    await markOrderPaid(event.data.object);
  }

  return Response.json({ received: true });
}
